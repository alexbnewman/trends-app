# app.py - Main Flask application with ML integration

from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_required, current_user
from flask_migrate import Migrate
from datetime import datetime
import os
import json

# Import configuration
from config import config

# Import models and database
from models import db, User, Watchlist, Analysis, TrendAlert

# Import blueprints
from auth import init_auth
from api import init_api

# Import forms
from forms import (TrendAnalysisForm, WatchlistForm, TrendAlertForm, 
                   QuickAnalysisForm, SearchForm, ContactForm)

# Import ML analyzer
from ml_analyzer import GoogleTrendsMLAnalyzer

def create_app(config_name='default'):
    """Application factory pattern"""
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    migrate = Migrate(app, db)
    
    # Initialize authentication
    init_auth(app)
    
    # Initialize API
    init_api(app)
    
    # Initialize ML analyzer
    analyzer = GoogleTrendsMLAnalyzer()
    
    # Create main blueprint
    from flask import Blueprint
    main_bp = Blueprint('main', __name__)
    
    @main_bp.route('/')
    def index():
        """Homepage with ML insights"""
        search_form = SearchForm()
        quick_form = QuickAnalysisForm()
        
        # Get sample trending data using ML analyzer
        try:
            sample_keywords = ['python', 'javascript', 'rock climbing', 'machine learning']
            sample_data = analyzer.fetch_trending_data(sample_keywords[:2], timeframe='today 1-m')
            
            # Add ML insights to trending data
            trending_insights = {}
            if sample_data:
                for keyword, values in sample_data.items():
                    features = analyzer.extract_features(keyword, values)
                    if features:
                        trending_insights[keyword] = {
                            'values': values.tolist(),
                            'avg_interest': features['avg_interest'],
                            'trend_direction': 'rising' if features['trend_slope'] > 0 else 'falling' if features['trend_slope'] < 0 else 'stable',
                            'volatility': features['volatility']
                        }
        except Exception as e:
            app.logger.error(f"Error fetching sample data: {e}")
            trending_insights = {}
        
        return render_template('index.html', 
                             search_form=search_form,
                             quick_form=quick_form,
                             trending_insights=trending_insights)
    
    @main_bp.route('/dashboard')
    @login_required
    def dashboard():
        """User dashboard with ML insights"""
        # Get user's recent activity
        recent_analyses = Analysis.query.filter_by(user_id=current_user.id)\
                                      .order_by(Analysis.updated_at.desc())\
                                      .limit(5).all()
        
        active_watchlists = Watchlist.query.filter_by(
            user_id=current_user.id, 
            is_active=True
        ).limit(5).all()
        
        active_alerts = TrendAlert.query.filter_by(
            user_id=current_user.id,
            is_active=True
        ).limit(5).all()
        
        # Quick analysis form
        quick_form = QuickAnalysisForm()
        
        # User stats
        stats = {
            'total_analyses': Analysis.query.filter_by(user_id=current_user.id).count(),
            'total_watchlists': Watchlist.query.filter_by(user_id=current_user.id).count(),
            'total_alerts': TrendAlert.query.filter_by(user_id=current_user.id).count()
        }
        
        # ML model status
        ml_status = {
            'models_available': bool(analyzer.models),
            'model_count': len(analyzer.models) if analyzer.models else 0,
            'categories': list(analyzer.categories.keys())
        }
        
        return render_template('dashboard.html',
                             recent_analyses=recent_analyses,
                             active_watchlists=active_watchlists,
                             active_alerts=active_alerts,
                             quick_form=quick_form,
                             stats=stats,
                             ml_status=ml_status)
    
    @main_bp.route('/analyze', methods=['GET', 'POST'])
    @login_required
    def analyze():
        """Enhanced trend analysis page with ML"""
        form = TrendAnalysisForm()
        
        if form.validate_on_submit():
            try:
                # Parse keywords
                keywords_list = [k.strip() for k in form.keywords.data.split('\n') if k.strip()]
                
                # Fetch trend data using ML analyzer
                trend_data = analyzer.fetch_trending_data(
                    keywords_list,
                    timeframe=form.timeframe.data,
                    geo=form.geo.data
                )
                
                if not trend_data:
                    flash('No trend data found for the given keywords.', 'warning')
                    return redirect(url_for('main.analyze'))
                
                # Perform enhanced analysis based on type
                results = {}
                if form.analysis_type.data == 'trend':
                    results = perform_enhanced_trend_analysis(trend_data, analyzer)
                elif form.analysis_type.data == 'comparison':
                    results = perform_comparison_analysis(trend_data, analyzer)
                elif form.analysis_type.data == 'prediction':
                    results = perform_ml_prediction_analysis(analyzer, keywords_list)
                elif form.analysis_type.data == 'classification':
                    results = perform_ml_classification_analysis(analyzer, keywords_list)
                
                # Save analysis
                analysis = Analysis(
                    user_id=current_user.id,
                    title=form.title.data,
                    description=form.description.data,
                    keywords=json.dumps(keywords_list),  # Store as JSON
                    analysis_type=form.analysis_type.data,
                    is_public=form.is_public.data
                )
                analysis.set_results(results)
                
                db.session.add(analysis)
                db.session.commit()
                
                flash('Analysis completed successfully!', 'success')
                return redirect(url_for('main.view_analysis', analysis_id=analysis.id))
                
            except Exception as e:
                flash('An error occurred during analysis. Please try again.', 'error')
                app.logger.error(f"Analysis error: {e}")
        
        return render_template('analysis/analyze.html', form=form)
    
    @main_bp.route('/analysis/<int:analysis_id>')
    @login_required
    def view_analysis(analysis_id):
        """View a specific analysis with enhanced ML insights"""
        analysis = Analysis.query.filter_by(
            id=analysis_id,
            user_id=current_user.id
        ).first()
        
        if not analysis:
            flash('Analysis not found.', 'error')
            return redirect(url_for('main.dashboard'))
        
        # Add additional ML insights if analysis is ML-based
        enhanced_results = analysis.get_results()
        if analysis.analysis_type in ['prediction', 'classification']:
            try:
                keywords = analysis.get_keywords_list()
                for keyword in keywords:
                    if keyword not in enhanced_results:
                        continue
                    
                    # Get fresh ML prediction
                    features, prediction = analyzer.predict_trend_popularity(keyword)
                    if prediction and 'error' not in prediction:
                        enhanced_results[keyword]['ml_prediction'] = prediction
            except Exception as e:
                app.logger.error(f"Error enhancing analysis results: {e}")
        
        return render_template('analysis/view.html', 
                             analysis=analysis, 
                             enhanced_results=enhanced_results)
    
    @main_bp.route('/watchlists')
    @login_required
    def watchlists():
        """Watchlists management page with ML insights"""
        user_watchlists = Watchlist.query.filter_by(
            user_id=current_user.id
        ).order_by(Watchlist.updated_at.desc()).all()
        
        # Add quick insights for each watchlist
        watchlist_insights = {}
        for watchlist in user_watchlists:
            try:
                keywords = watchlist.get_keywords()[:3]  # Limit to first 3 for performance
                if keywords:
                    insights = analyzer.get_trending_insights(keywords, 'today 1-m')
                    watchlist_insights[watchlist.id] = insights
            except Exception as e:
                app.logger.error(f"Error getting watchlist insights: {e}")
        
        return render_template('watchlists/list.html', 
                             watchlists=user_watchlists,
                             watchlist_insights=watchlist_insights)
    
    @main_bp.route('/watchlists/create', methods=['GET', 'POST'])
    @login_required
    def create_watchlist():
        """Create new watchlist with ML validation"""
        form = WatchlistForm()
        
        if form.validate_on_submit():
            try:
                keywords_list = [k.strip() for k in form.keywords.data.split('\n') if k.strip()]
                
                # Validate keywords using ML analyzer
                validation_results = {}
                for keyword in keywords_list[:5]:  # Validate first 5
                    features = analyzer.extract_features(keyword)
                    validation_results[keyword] = {
                        'valid': features is not None,
                        'avg_interest': features['avg_interest'] if features else 0
                    }
                
                watchlist = Watchlist(
                    user_id=current_user.id,
                    name=form.name.data,
                    description=form.description.data,
                    category=form.category.data,
                    is_public=form.is_public.data
                )
                watchlist.set_keywords(keywords_list)
                
                db.session.add(watchlist)
                db.session.commit()
                
                # Show validation feedback
                valid_count = sum(1 for result in validation_results.values() if result['valid'])
                flash(f'Watchlist created successfully! {valid_count}/{len(validation_results)} keywords validated.', 'success')
                
                return redirect(url_for('main.watchlists'))
                
            except Exception as e:
                flash('Failed to create watchlist. Please try again.', 'error')
                app.logger.error(f"Watchlist creation error: {e}")
        
        return render_template('watchlists/create.html', form=form)
    
    @main_bp.route('/watchlists/<int:watchlist_id>/analyze')
    @login_required
    def analyze_watchlist(watchlist_id):
        """Analyze watchlist with ML insights"""
        watchlist = Watchlist.query.filter_by(
            id=watchlist_id,
            user_id=current_user.id
        ).first()
        
        if not watchlist:
            flash('Watchlist not found.', 'error')
            return redirect(url_for('main.watchlists'))
        
        try:
            keywords = watchlist.get_keywords()
            analysis_results = analyzer.analyze_watchlist_keywords(keywords)
            
            # Create and save analysis
            analysis = Analysis(
                user_id=current_user.id,
                title=f"ML Analysis: {watchlist.name}",
                description=f"Machine learning analysis of watchlist '{watchlist.name}'",
                keywords=json.dumps(keywords),
                analysis_type='watchlist_ml'
            )
            analysis.set_results(analysis_results)
            
            db.session.add(analysis)
            db.session.commit()
            
            return redirect(url_for('main.view_analysis', analysis_id=analysis.id))
            
        except Exception as e:
            flash('Failed to analyze watchlist. Please try again.', 'error')
            app.logger.error(f"Watchlist analysis error: {e}")
            return redirect(url_for('main.watchlists'))
    
    @main_bp.route('/watchlists/<int:watchlist_id>/edit', methods=['GET', 'POST'])
    @login_required
    def edit_watchlist(watchlist_id):
        """Edit watchlist"""
        watchlist = Watchlist.query.filter_by(
            id=watchlist_id,
            user_id=current_user.id
        ).first()
        
        if not watchlist:
            flash('Watchlist not found.', 'error')
            return redirect(url_for('main.watchlists'))
        
        form = WatchlistForm()
        
        if form.validate_on_submit():
            try:
                keywords_list = [k.strip() for k in form.keywords.data.split('\n') if k.strip()]
                
                watchlist.name = form.name.data
                watchlist.description = form.description.data
                watchlist.category = form.category.data
                watchlist.is_public = form.is_public.data
                watchlist.set_keywords(keywords_list)
                watchlist.updated_at = datetime.utcnow()
                
                db.session.commit()
                
                flash('Watchlist updated successfully!', 'success')
                return redirect(url_for('main.watchlists'))
                
            except Exception as e:
                flash('Failed to update watchlist. Please try again.', 'error')
                app.logger.error(f"Watchlist update error: {e}")
        
        elif request.method == 'GET':
            # Pre-populate form
            form.name.data = watchlist.name
            form.description.data = watchlist.description
            form.category.data = watchlist.category
            form.is_public.data = watchlist.is_public
            form.keywords.data = '\n'.join(watchlist.get_keywords())
        
        return render_template('watchlists/edit.html', form=form, watchlist=watchlist)
    
    @main_bp.route('/alerts')
    @login_required
    def alerts():
        """Trend alerts management page"""
        user_alerts = TrendAlert.query.filter_by(
            user_id=current_user.id
        ).order_by(TrendAlert.created_at.desc()).all()
        
        return render_template('alerts/list.html', alerts=user_alerts)
    
    @main_bp.route('/alerts/create', methods=['GET', 'POST'])
    @login_required
    def create_alert():
        """Create new trend alert with ML validation"""
        form = TrendAlertForm()
        
        if form.validate_on_submit():
            try:
                # Validate keyword exists in trends
                keyword = form.keyword.data
                features = analyzer.extract_features(keyword)
                
                if not features:
                    flash('Warning: No recent trend data found for this keyword.', 'warning')
                
                alert = TrendAlert(
                    user_id=current_user.id,
                    keyword=keyword,
                    alert_type=form.alert_type.data,
                    threshold_value=form.threshold_value.data,
                    percentage_change=form.percentage_change.data,
                    geo=form.geo.data
                )
                
                db.session.add(alert)
                db.session.commit()
                
                flash('Alert created successfully!', 'success')
                return redirect(url_for('main.alerts'))
                
            except Exception as e:
                flash('Failed to create alert. Please try again.', 'error')
                app.logger.error(f"Alert creation error: {e}")
        
        return render_template('alerts/create.html', form=form)
    
    @main_bp.route('/search')
    def search():
        """Search trends with ML insights"""
        form = SearchForm()
        results = []
        ml_insights = {}
        
        if form.validate_on_submit():
            query = form.query.data
            try:
                keywords = [k.strip() for k in query.split(',') if k.strip()][:5]  # Limit to 5
                trend_data = analyzer.fetch_trending_data(keywords, timeframe='today 3-m')
                
                if trend_data:
                    results = []
                    for keyword, values in trend_data.items():
                        # Basic stats
                        avg_interest = float(values.mean()) if hasattr(values, 'mean') else sum(values) / len(values)
                        max_interest = float(values.max()) if hasattr(values, 'max') else max(values)
                        
                        results.append({
                            'keyword': keyword,
                            'avg_interest': avg_interest,
                            'max_interest': max_interest,
                            'values': values.tolist() if hasattr(values, 'tolist') else list(values)
                        })
                        
                        # ML insights
                        features = analyzer.extract_features(keyword, values)
                        if features:
                            ml_insights[keyword] = {
                                'trend_direction': 'rising' if features['trend_slope'] > 0 else 'falling' if features['trend_slope'] < 0 else 'stable',
                                'volatility': features['volatility'],
                                'trend_strength': abs(features['trend_slope'])
                            }
                            
                            # Get ML prediction if models are available
                            if analyzer.models:
                                _, prediction = analyzer.predict_trend_popularity(keyword)
                                if prediction and 'predicted_category' in prediction:
                                    ml_insights[keyword]['predicted_category'] = prediction['predicted_category']
                                    ml_insights[keyword]['confidence'] = prediction.get('confidence', 0)
                
            except Exception as e:
                flash('Search failed. Please try again.', 'error')
                app.logger.error(f"Search error: {e}")
        
        return render_template('search.html', form=form, results=results, ml_insights=ml_insights)
    
    @main_bp.route('/quick-analysis', methods=['POST'])
    @login_required
    def quick_analysis():
        """Handle quick analysis from dashboard with ML"""
        form = QuickAnalysisForm()
        
        if form.validate_on_submit():
            try:
                keywords_list = [k.strip() for k in form.keywords.data.split(',') if k.strip()]
                
                trend_data = analyzer.fetch_trending_data(
                    keywords_list,
                    timeframe=form.timeframe.data
                )
                
                if trend_data:
                    # Create enhanced analysis with ML insights
                    results = perform_enhanced_trend_analysis(trend_data, analyzer)
                    
                    analysis = Analysis(
                        user_id=current_user.id,
                        title=f"Quick ML Analysis: {', '.join(keywords_list)}",
                        keywords=json.dumps(keywords_list),
                        analysis_type='quick_ml',
                        is_public=False
                    )
                    analysis.set_results(results)
                    
                    db.session.add(analysis)
                    db.session.commit()
                    
                    return redirect(url_for('main.view_analysis', analysis_id=analysis.id))
                else:
                    flash('No trend data found for the given keywords.', 'warning')
            
            except Exception as e:
                flash('Quick analysis failed. Please try again.', 'error')
                app.logger.error(f"Quick analysis error: {e}")
        
        return redirect(url_for('main.dashboard'))
    
    @main_bp.route('/ml-models')
    @login_required
    def ml_models():
        """ML models management page"""
        if not current_user.is_premium:
            flash('Premium account required to access ML models.', 'warning')
            return redirect(url_for('main.dashboard'))
        
        # Get model status
        models_info = {
            'available': bool(analyzer.models),
            'count': len(analyzer.models) if analyzer.models else 0,
            'models': list(analyzer.models.keys()) if analyzer.models else [],
            'categories': analyzer.categories
        }
        
        return render_template('ml/models.html', models_info=models_info)
    
    @main_bp.route('/ml-models/train', methods=['POST'])
    @login_required
    def train_ml_models():
        """Train ML models"""
        if not current_user.is_premium:
            flash('Premium account required.', 'error')
            return redirect(url_for('main.dashboard'))
        
        try:
            success = analyzer.train_and_save_models()
            if success:
                flash('ML models trained successfully!', 'success')
            else:
                flash('Model training failed. Please check logs.', 'error')
        except Exception as e:
            flash('Model training failed. Please try again.', 'error')
            app.logger.error(f"Model training error: {e}")
        
        return redirect(url_for('main.ml_models'))
    
    @main_bp.route('/about')
    def about():
        """About page"""
        return render_template('about.html')
    
    @main_bp.route('/contact', methods=['GET', 'POST'])
    def contact():
        """Contact page"""
        form = ContactForm()
        
        if form.validate_on_submit():
            # In a real app, this would send an email or save to database
            flash('Thank you for your message! We will get back to you soon.', 'success')
            return redirect(url_for('main.contact'))
        
        return render_template('contact.html', form=form)
    
    # Register main blueprint
    app.register_blueprint(main_bp)
    
    # Error handlers
    @app.errorhandler(404)
    def not_found_error(error):
        return render_template('errors/404.html'), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return render_template('errors/500.html'), 500
    
    @app.errorhandler(403)
    def forbidden_error(error):
        return render_template('errors/403.html'), 403
    
    # CLI commands
    @app.cli.command()
    def init_db():
        """Initialize the database"""
        db.create_all()
        print('Database initialized!')
    
    @app.cli.command()
    def create_admin():
        """Create an admin user"""
        username = input('Admin username: ')
        email = input('Admin email: ')
        password = input('Admin password: ')
        
        admin = User(username=username, email=email, is_premium=True)
        admin.set_password(password)
        
        db.session.add(admin)
        db.session.commit()
        print(f'Admin user {username} created!')
    
    @app.cli.command()
    def train_models():
        """Train ML models via CLI"""
        print('Training ML models...')
        try:
            success = analyzer.train_and_save_models()
            if success:
                print('✅ Models trained successfully!')
            else:
                print('❌ Model training failed')
        except Exception as e:
            print(f'❌ Error: {e}')
    
    return app

# Enhanced helper functions with ML integration
def perform_enhanced_trend_analysis(trend_data, analyzer):
    """Perform enhanced trend analysis with ML insights"""
    import numpy as np
    
    results = {
        'analysis_type': 'enhanced_trend',
        'keywords': {},
        'summary': {},
        'ml_insights': {}
    }
    
    for keyword, values in trend_data.items():
        # Basic analysis
        avg_interest = float(np.mean(values))
        max_interest = float(np.max(values))
        min_interest = float(np.min(values))
        volatility = float(np.std(values) / np.mean(values)) if np.mean(values) > 0 else 0
        trend_slope = float(np.polyfit(range(len(values)), values, 1)[0])
        
        # ML-enhanced features
        features = analyzer.extract_features(keyword, values)
        
        results['keywords'][keyword] = {
            'avg_interest': avg_interest,
            'max_interest': max_interest,
            'min_interest': min_interest,
            'volatility': volatility,
            'trend_slope': trend_slope,
            'trend_direction': 'rising' if trend_slope > 0 else 'falling' if trend_slope < 0 else 'stable',
            'ml_features': features if features else {}
        }
        
        # ML prediction if available
        if analyzer.models:
            try:
                _, prediction = analyzer.predict_trend_popularity(keyword)
                if prediction and 'predicted_category' in prediction:
                    results['ml_insights'][keyword] = prediction
            except Exception as e:
                app.logger.error(f"ML prediction error for {keyword}: {e}")
    
    # Overall summary
    avg_interests = [data['avg_interest'] for data in results['keywords'].values()]
    results['summary'] = {
        'total_keywords': len(trend_data),
        'avg_interest_overall': float(np.mean(avg_interests)) if avg_interests else 0,
        'most_popular': max(results['keywords'], key=lambda k: results['keywords'][k]['avg_interest']) if results['keywords'] else None,
        'most_volatile': max(results['keywords'], key=lambda k: results['keywords'][k]['volatility']) if results['keywords'] else None,
        'ml_models_used': bool(analyzer.models)
    }
    
    return results

def perform_comparison_analysis(trend_data, analyzer):
    """Perform keyword comparison analysis with ML"""
    import numpy as np
    
    results = {
        'analysis_type': 'comparison',
        'keywords': {},
        'comparison': {},
        'ml_insights': {}
    }
    
    # Basic stats for each keyword
    for keyword, values in trend_data.items():
        results['keywords'][keyword] = {
            'avg_interest': float(np.mean(values)),
            'max_interest': float(np.max(values)),
            'peak_periods': find_peak_periods(values),
            'correlation': {}
        }
        
        # ML insights
        if analyzer.models:
            try:
                _, prediction = analyzer.predict_trend_popularity(keyword)
                if prediction:
                    results['ml_insights'][keyword] = prediction
            except Exception as e:
                print(f"ML prediction error for {keyword}: {e}")
    
    # Cross-correlation analysis
    keywords = list(trend_data.keys())
    for i, keyword1 in enumerate(keywords):
        for keyword2 in keywords[i+1:]:
            correlation = float(np.corrcoef(trend_data[keyword1], trend_data[keyword2])[0, 1])
            results['keywords'][keyword1]['correlation'][keyword2] = correlation
    
    return results

def perform_ml_prediction_analysis(analyzer, keywords):
    """Perform ML prediction analysis"""
    results = {
        'analysis_type': 'ml_prediction',
        'predictions': {},
        'model_info': {
            'models_available': bool(analyzer.models),
            'model_count': len(analyzer.models) if analyzer.models else 0
        }
    }
    
    for keyword in keywords:
        try:
            features, prediction_data = analyzer.predict_trend_popularity(keyword)
            results['predictions'][keyword] = {
                'features': features,
                'prediction': prediction_data,
                'status': 'success' if features else 'failed'
            }
        except Exception as e:
            results['predictions'][keyword] = {
                'error': str(e),
                'status': 'error'
            }
    
    return results

def perform_ml_classification_analysis(analyzer, keywords):
    """Perform ML classification analysis"""
    results = {
        'analysis_type': 'ml_classification',
        'classifications': {},
        'category_summary': {}
    }
    
    categories = {}
    
    for keyword in keywords:
        try:
            features, prediction_data = analyzer.predict_trend_popularity(keyword)
            if prediction_data and 'predicted_category' in prediction_data:
                category = prediction_data['predicted_category']
                confidence = prediction_data.get('confidence', 0)
                
                results['classifications'][keyword] = {
                    'category': category,
                    'confidence': confidence,
                    'features': features,
                    'status': 'success'
                }
                
                # Count categories
                if category not in categories:
                    categories[category] = []
                categories[category].append(keyword)
            else:
                results['classifications'][keyword] = {
                    'error': 'Classification failed',
                    'status': 'failed'
                }
        except Exception as e:
            results['classifications'][keyword] = {
                'error': str(e),
                'status': 'error'
            }
    
    # Summary by category
    results['category_summary'] = {
        category: {
            'count': len(keywords),
            'keywords': keywords
        }
        for category, keywords in categories.items()
    }
    
    return results

def find_peak_periods(values, threshold_percentile=90):
    """Find peak periods in trend data"""
    import numpy as np
    
    threshold = np.percentile(values, threshold_percentile)
    peaks = []
    
    for i, value in enumerate(values):
        if value >= threshold:
            peaks.append({
                'index': i,
                'value': float(value)
            })
    
    return peaks

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)