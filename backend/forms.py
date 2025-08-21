# forms.py - WTForms for handling user input and validation

from flask_wtf import FlaskForm
from wtforms import (StringField, PasswordField, TextAreaField, SelectField, 
                     SubmitField, BooleanField, IntegerField, FloatField, 
                     SelectMultipleField, DateField, HiddenField)
from wtforms.validators import (DataRequired, Email, Length, EqualTo, 
                               NumberRange, Optional, ValidationError)
from wtforms.widgets import CheckboxInput, ListWidget
from datetime import datetime, date

class MultiCheckboxField(SelectMultipleField):
    """Custom field for multiple checkboxes"""
    widget = ListWidget(prefix_label=False)
    option_widget = CheckboxInput()

class LoginForm(FlaskForm):
    """User login form"""
    username = StringField('Username', validators=[DataRequired(), Length(min=3, max=80)])
    password = PasswordField('Password', validators=[DataRequired()])
    remember_me = BooleanField('Remember Me')
    submit = SubmitField('Sign In')

class RegistrationForm(FlaskForm):
    """User registration form"""
    username = StringField('Username', validators=[
        DataRequired(), 
        Length(min=3, max=80, message='Username must be between 3 and 80 characters')
    ])
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[
        DataRequired(),
        Length(min=6, message='Password must be at least 6 characters long')
    ])
    password2 = PasswordField('Repeat Password', validators=[
        DataRequired(),
        EqualTo('password', message='Passwords must match')
    ])
    submit = SubmitField('Register')

class TrendAnalysisForm(FlaskForm):
    """Form for creating trend analysis"""
    title = StringField('Analysis Title', validators=[DataRequired(), Length(max=200)])
    keywords = TextAreaField('Keywords (one per line)', validators=[
        DataRequired(),
        Length(max=1000)
    ])
    analysis_type = SelectField('Analysis Type', choices=[
        ('trend', 'Trend Analysis'),
        ('comparison', 'Keyword Comparison'),
        ('prediction', 'Trend Prediction'),
        ('classification', 'Category Classification')
    ], validators=[DataRequired()])
    
    timeframe = SelectField('Time Range', choices=[
        ('today 1-m', 'Past Month'),
        ('today 3-m', 'Past 3 Months'),
        ('today 12-m', 'Past Year'),
        ('today 5-y', 'Past 5 Years'),
        ('all', 'All Time')
    ], default='today 12-m')
    
    geo = SelectField('Geographic Region', choices=[
        ('', 'Worldwide'),
        ('US', 'United States'),
        ('GB', 'United Kingdom'),
        ('CA', 'Canada'),
        ('AU', 'Australia'),
        ('DE', 'Germany'),
        ('FR', 'France'),
        ('JP', 'Japan'),
        ('IN', 'India'),
        ('BR', 'Brazil')
    ], default='US')
    
    category = SelectField('Category', choices=[
        ('', 'All Categories'),
        ('climbing', 'Climbing & Mountaineering'),
        ('coding', 'Programming & Development'),
        ('technology', 'Technology'),
        ('outdoor', 'Outdoor Activities'),
        ('fitness', 'Fitness & Health'),
        ('entertainment', 'Entertainment'),
        ('sports', 'Sports'),
        ('business', 'Business & Finance')
    ])
    
    description = TextAreaField('Description (Optional)', validators=[Optional(), Length(max=500)])
    is_public = BooleanField('Make Analysis Public')
    submit = SubmitField('Run Analysis')
    
    def validate_keywords(self, keywords):
        """Custom validation for keywords"""
        keyword_list = [k.strip() for k in keywords.data.split('\n') if k.strip()]
        if len(keyword_list) > 20:
            raise ValidationError('Maximum 20 keywords allowed')
        if len(keyword_list) < 1:
            raise ValidationError('At least one keyword is required')

class WatchlistForm(FlaskForm):
    """Form for creating/editing watchlists"""
    name = StringField('Watchlist Name', validators=[DataRequired(), Length(max=100)])
    description = TextAreaField('Description', validators=[Optional(), Length(max=500)])
    keywords = TextAreaField('Keywords (one per line)', validators=[
        DataRequired(),
        Length(max=1000)
    ])
    category = SelectField('Category', choices=[
        ('climbing', 'Climbing & Mountaineering'),
        ('coding', 'Programming & Development'),
        ('technology', 'Technology'),
        ('outdoor', 'Outdoor Activities'),
        ('fitness', 'Fitness & Health'),
        ('entertainment', 'Entertainment'),
        ('sports', 'Sports'),
        ('business', 'Business & Finance'),
        ('custom', 'Custom Category')
    ], validators=[DataRequired()])
    
    is_public = BooleanField('Make Watchlist Public')
    submit = SubmitField('Save Watchlist')
    
    def validate_keywords(self, keywords):
        """Custom validation for keywords"""
        keyword_list = [k.strip() for k in keywords.data.split('\n') if k.strip()]
        if len(keyword_list) > 50:
            raise ValidationError('Maximum 50 keywords allowed')
        if len(keyword_list) < 1:
            raise ValidationError('At least one keyword is required')

class TrendAlertForm(FlaskForm):
    """Form for setting up trend alerts"""
    keyword = StringField('Keyword', validators=[DataRequired(), Length(max=100)])
    alert_type = SelectField('Alert Type', choices=[
        ('spike', 'Interest Spike'),
        ('drop', 'Interest Drop'),
        ('threshold', 'Threshold Crossed')
    ], validators=[DataRequired()])
    
    threshold_value = IntegerField('Threshold Value (0-100)', validators=[
        Optional(),
        NumberRange(min=0, max=100)
    ])
    percentage_change = FloatField('Percentage Change (%)', validators=[
        Optional(),
        NumberRange(min=1, max=1000)
    ])
    
    geo = SelectField('Geographic Region', choices=[
        ('US', 'United States'),
        ('GB', 'United Kingdom'),
        ('CA', 'Canada'),
        ('AU', 'Australia'),
        ('DE', 'Germany'),
        ('FR', 'France'),
        ('JP', 'Japan'),
        ('IN', 'India'),
        ('BR', 'Brazil'),
        ('', 'Worldwide')
    ], default='US')
    
    submit = SubmitField('Create Alert')
    
    def validate(self, **kwargs):
        """Custom validation logic"""
        if not super().validate(**kwargs):
            return False
        
        if self.alert_type.data == 'threshold' and not self.threshold_value.data:
            self.threshold_value.errors.append('Threshold value required for threshold alerts')
            return False
        
        if self.alert_type.data in ['spike', 'drop'] and not self.percentage_change.data:
            self.percentage_change.errors.append('Percentage change required for spike/drop alerts')
            return False
        
        return True

class UserPreferencesForm(FlaskForm):
    """Form for user preferences"""
    username = StringField('Username', validators=[DataRequired(), Length(min=3, max=80)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    
    default_geo = SelectField('Default Region', choices=[
        ('US', 'United States'),
        ('GB', 'United Kingdom'),
        ('CA', 'Canada'),
        ('AU', 'Australia'),
        ('DE', 'Germany'),
        ('FR', 'France'),
        ('JP', 'Japan'),
        ('IN', 'India'),
        ('BR', 'Brazil'),
        ('', 'Worldwide')
    ], default='US')
    
    default_timeframe = SelectField('Default Time Range', choices=[
        ('today 1-m', 'Past Month'),
        ('today 3-m', 'Past 3 Months'),
        ('today 12-m', 'Past Year'),
        ('today 5-y', 'Past 5 Years')
    ], default='today 12-m')
    
    email_notifications = BooleanField('Email Notifications')
    
    submit = SubmitField('Update Preferences')

class PasswordChangeForm(FlaskForm):
    """Form for changing password"""
    current_password = PasswordField('Current Password', validators=[DataRequired()])
    new_password = PasswordField('New Password', validators=[
        DataRequired(),
        Length(min=6, message='Password must be at least 6 characters long')
    ])
    new_password2 = PasswordField('Repeat New Password', validators=[
        DataRequired(),
        EqualTo('new_password', message='Passwords must match')
    ])
    submit = SubmitField('Change Password')

class SearchForm(FlaskForm):
    """Form for searching trends"""
    query = StringField('Search Keywords', validators=[DataRequired()], render_kw={
        'placeholder': 'Enter keywords to search trends...',
        'class': 'form-control'
    })
    submit = SubmitField('Search', render_kw={'class': 'btn btn-primary'})

class QuickAnalysisForm(FlaskForm):
    """Quick analysis form for dashboard"""
    keywords = StringField('Keywords (comma separated)', validators=[
        DataRequired(),
        Length(max=200)
    ], render_kw={
        'placeholder': 'e.g., python, javascript, react',
        'class': 'form-control'
    })
    
    timeframe = SelectField('Time Range', choices=[
        ('today 1-m', 'Past Month'),
        ('today 3-m', 'Past 3 Months'),
        ('today 12-m', 'Past Year')
    ], default='today 3-m', render_kw={'class': 'form-select'})
    
    submit = SubmitField('Analyze', render_kw={'class': 'btn btn-success'})
    
    def validate_keywords(self, keywords):
        """Validate keywords format"""
        keyword_list = [k.strip() for k in keywords.data.split(',') if k.strip()]
        if len(keyword_list) > 5:
            raise ValidationError('Maximum 5 keywords for quick analysis')
        if len(keyword_list) < 1:
            raise ValidationError('At least one keyword is required')

class ContactForm(FlaskForm):
    """Contact form for support"""
    name = StringField('Name', validators=[DataRequired(), Length(max=100)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    subject = SelectField('Subject', choices=[
        ('bug', 'Bug Report'),
        ('feature', 'Feature Request'),
        ('support', 'Technical Support'),
        ('billing', 'Billing Question'),
        ('other', 'Other')
    ], validators=[DataRequired()])
    
    message = TextAreaField('Message', validators=[
        DataRequired(),
        Length(min=10, max=1000)
    ], render_kw={'rows': 5})
    
    submit = SubmitField('Send Message')

class CSVUploadForm(FlaskForm):
    """Form for uploading CSV data"""
    description = StringField('Description', validators=[Optional(), Length(max=200)])
    submit = SubmitField('Upload CSV')