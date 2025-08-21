# auth.py - Authentication routes and user management

from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.urls import url_parse
from datetime import datetime

from models import db, User
from forms import LoginForm, RegistrationForm, UserPreferencesForm, PasswordChangeForm

# Create authentication blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/auth')


# ------------------------
# LOGIN
# ------------------------
@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))

    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()

        if user is None or not user.check_password(form.password.data):
            flash('Invalid username or password', 'error')
            return redirect(url_for('auth.login'))

        user.last_login = datetime.now(datetime.timezone.utc)
        db.session.commit()

        login_user(user, remember=form.remember_me.data)

        next_page = request.args.get('next')
        if not next_page or url_parse(next_page).netloc != '':
            next_page = url_for('main.dashboard')

        flash(f'Welcome back, {user.username}!', 'success')
        return redirect(next_page)

    return render_template('auth/login.html', title='Sign In', form=form)


# ------------------------
# REGISTER
# ------------------------
@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))

    form = RegistrationForm()
    if form.validate_on_submit():
        if User.query.filter_by(username=form.username.data).first():
            flash('Username already taken. Please choose a different one.', 'error')
            return redirect(url_for('auth.register'))

        if User.query.filter_by(email=form.email.data.lower()).first():
            flash('Email already registered. Please use a different email.', 'error')
            return redirect(url_for('auth.register'))

        user = User(username=form.username.data, email=form.email.data.lower())
        user.set_password(form.password.data)

        try:
            db.session.add(user)
            db.session.commit()
            flash('Registration successful! You can now log in.', 'success')
            return redirect(url_for('auth.login'))
        except Exception:
            db.session.rollback()
            flash('An error occurred during registration. Please try again.', 'error')
            return redirect(url_for('auth.register'))

    return render_template('auth/register.html', title='Register', form=form)


# ------------------------
# LOGOUT
# ------------------------
@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'success')
    return redirect(url_for('auth.login'))

# ------------------------
# PROFILE
# ------------------------
@auth_bp.route('/profile')
@login_required
def profile():
    """User profile page"""
    return render_template('auth/profile.html', title='My Profile', user=current_user)

# ------------------------
# USER PREFERENCES
# ------------------------
@auth_bp.route('/preferences', methods=['GET', 'POST'])
@login_required
def preferences():
    """User preferences management"""
    form = UserPreferencesForm()
    
    if form.validate_on_submit():
        # Check if username changed and is available
        if form.username.data != current_user.username:
            existing_user = User.query.filter_by(username=form.username.data).first()
            if existing_user:
                flash('Username already taken. Please choose a different one.', 'error')
                return redirect(url_for('auth.preferences'))
        
        # Check if email changed and is available
        if form.email.data.lower() != current_user.email:
            existing_email = User.query.filter_by(email=form.email.data.lower()).first()
            if existing_email:
                flash('Email already registered. Please use a different email.', 'error')
                return redirect(url_for('auth.preferences'))
        
        try:
            # Update user preferences
            current_user.username = form.username.data
            current_user.email = form.email.data.lower()
            current_user.default_geo = form.default_geo.data
            current_user.default_timeframe = form.default_timeframe.data
            current_user.email_notifications = form.email_notifications.data
            
            db.session.commit()
            flash('Your preferences have been updated!', 'success')
            return redirect(url_for('auth.profile'))
            
        except Exception as e:
            db.session.rollback()
            flash('An error occurred while updating your preferences.', 'error')
    
    elif request.method == 'GET':
        # Pre-populate form with current values
        form.username.data = current_user.username
        form.email.data = current_user.email
        form.default_geo.data = current_user.default_geo
        form.default_timeframe.data = current_user.default_timeframe
        form.email_notifications.data = current_user.email_notifications
    
    return render_template('auth/preferences.html', title='Preferences', form=form)

# ------------------------
# CHANGE PASSWORD
# ------------------------
@auth_bp.route('/change-password', methods=['GET', 'POST'])
@login_required
def change_password():
    form = PasswordChangeForm()
    if form.validate_on_submit():
        if not current_user.check_password(form.current_password.data):
            flash('Current password is incorrect.', 'error')
            return redirect(url_for('auth.change_password'))

        current_user.set_password(form.new_password.data)
        try:
            db.session.commit()
            flash('Password changed successfully.', 'success')
            return redirect(url_for('auth.profile'))
        except Exception:
            db.session.rollback()
            flash('Error changing password. Please try again.', 'error')

    return render_template('auth/change_password.html', title='Change Password', form=form)

# ------------------------
# DELETE ACCOUNT
# ------------------------
@auth_bp.route('/delete-account', methods=['POST'])
@login_required
def delete_account():
    """Delete user account (with confirmation)"""
    password = request.form.get('password')
    
    if not password or not current_user.check_password(password):
        flash('Password verification failed. Account not deleted.', 'error')
        return redirect(url_for('auth.profile'))
    
    try:
        username = current_user.username
        
        # Delete user (cascade will handle related records)
        db.session.delete(current_user)
        db.session.commit()
        
        logout_user()
        flash(f'Account {username} has been permanently deleted.', 'info')
        return redirect(url_for('main.index'))
        
    except Exception as e:
        db.session.rollback()
        flash('An error occurred while deleting your account.', 'error')
        return redirect(url_for('auth.profile'))

# ------------------------
# USER LOADER
# ------------------------ 
# User loader for Flask-Login
from flask_login import LoginManager

login_manager = LoginManager()

@login_manager.user_loader
def load_user(user_id):
    """Load user by ID for Flask-Login"""
    return User.query.get(int(user_id))

# ------------------------
# FLASK AUTH INIT
# ------------------------ 
def init_auth(app):
    """Initialize authentication with Flask app"""
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Please log in to access this page.'
    login_manager.login_message_category = 'info'
    
    app.register_blueprint(auth_bp)