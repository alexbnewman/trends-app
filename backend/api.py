# api.py - REST API endpoints with ML analyzer integration

from flask import Blueprint, jsonify, request, current_app
from flask_login import login_required, current_user
from datetime import datetime, timedelta
import json
import time
from functools import wraps

from models import db, TrendData, Analysis, Watchlist, TrendAlert, APIUsage
from ml_analyzer import GoogleTrendsMLAnalyzer

# Create API blueprint
api_bp = Blueprint('api', __name__, url_prefix='/api/v1')

# Initialize analyzer (singleton pattern)
_analyzer = None

def get_analyzer():
    """Get or create ML analyzer instance"""
    global _analyzer
    if _analyzer is None:
        _analyzer = GoogleTrendsMLAnalyzer()
    return _analyzer

# Rate limiting decorator
def rate_limit(max_requests=100, per_minutes=60):
    """Simple rate limiting decorator"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # TODO: Implement proper rate limiting with Redis or similar
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def log_api_usage(response_status=200, response_time_ms=None):
    """Log API usage for analytics"""
    try:
        usage = APIUsage(
            user_id=current_user.id if current_user.is_authenticated else None,
            endpoint=request.endpoint,
            method=request.method,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent', '')[:500],
            response_status=response_status,
            response_time_ms=response_time_ms
        )
        db.session.add(usage)
        db.session.commit()
    except Exception as e:
        current_app.logger.error(f"API usage logging failed: {e}")

# Error handlers
@api_bp.errorhandler(404)
def api_not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@api_bp.errorhandler(500)
def api_internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500

@api_bp.errorhandler(400)
def api_bad_request(error):
    return jsonify({'error': 'Bad request'}), 400

# Trends API endpoints
@api_bp.route('/trends/search', methods=['POST'])
@rate_limit(max_requests=50, per_minutes=60)
def search_trends():
    """Search for trend data using ML analyzer"""
    start_time = time.time()
    
    try:
        data = request.get_json()
        if not data or 'keywords' not in data:
            log_api_usage(400)
            return jsonify({'error': 'Keywords are required'}), 400
        
        keywords = data.get('keywords', [])
        timeframe = data.get('timeframe', 'today 12-m')
        geo = data.get('geo', 'US')
        
        if not isinstance(keywords, list) or len(keywords) == 0:
            log_api_usage(400)
            return jsonify({'error': 'Keywords must be a non-empty list'}), 400
        
        if len(keywords) > 5:
            log_api_usage(400)
            return jsonify({'error': 'Maximum 5 keywords allowed'}), 400
        
        # Use ML analyzer to fetch data
        analyzer = get_analyzer()
        trend_data = analyzer.fetch_trending_data(keywords, timeframe, geo)
        
        if not trend_data:
            log_api_usage(404, (time.time() - start_time) * 1000)
            return jsonify({'error': 'No trend data found for the given keywords'}), 404
        
        # Process results with enhanced analytics
        result = {}
        for keyword, values in trend_data.items():
            # Extract features using ML analyzer
            features = analyzer.extract_features(keyword, values)
            
            result[keyword] = {
                'values': values.tolist() if hasattr(values, 'tolist') else list(values),
                'analytics': {
                    'avg_interest': features['avg_interest'] if features else 0,
                    'max_interest': features['max_interest'] if features else 0,
                    'min_interest': features['min_interest'] if features else 0,
                    'volatility': features['volatility'] if features else 0,
                    'trend_direction': 'rising' if features and features['trend_slope'] > 0 else 'falling' if features and features['trend_slope'] < 0 else 'stable',
                    'trend_strength': abs(features['trend_slope']) if features else 0
                }
            }
        
        response_time = (time.time() - start_time) * 1000
        log_api_usage(200, response_time)
        
        return jsonify({
            'success': True,
            'data': result,
            'metadata': {
                'timeframe': timeframe,
                'geo': geo,
                'keywords': keywords,
                'timestamp': datetime.now().isoformat(),
                'response_time_ms': response_time
            }
        })
        
    except Exception as e:
        current_app.logger.error(f"Trends search error: {e}")
        log_api_usage(500, (time.time() - start_time) * 1000)
        return jsonify({'error': 'Failed to fetch trend data', 'details': str(e)}), 500

@api_bp.route('/trends/predict', methods=['POST'])
@login_required
@rate_limit(max_requests=20, per_minutes=60)
def predict_trend():
    """Predict trend category using ML model"""
    start_time = time.time()
    
    try:
        data = request.get_json()
        if not data or 'keyword' not in data:
            log_api_usage(400)
            return jsonify({'error': 'Keyword is required'}), 400
        
        keyword = data.get('keyword', '').strip()
        if not keyword:
            log_api_usage(400)
            return jsonify({'error': 'Keyword cannot be empty'}), 400
        
        analyzer = get_analyzer()
        features, prediction_data = analyzer.predict_trend_popularity(keyword)
        
        if features is None:
            log_api_usage(404, (time.time() - start_time) * 1000)
            return jsonify({'error': 'Unable to analyze the given keyword'}), 404
        
        response_time = (time.time() - start_time) * 1000
        log_api_usage(200, response_time)
        
        return jsonify({
            'success': True,
            'data': {
                'keyword': keyword,
                'features': features,
                'prediction': prediction_data,
                'timestamp': datetime.utcnow().isoformat()
            },
            'metadata': {
                'response_time_ms': response_time
            }
        })
        
    except Exception as e:
        current_app.logger.error(f"Trend prediction error: {e}")
        log_api_usage(500, (time.time() - start_time) * 1000)
        return jsonify({'error': 'Failed to predict trend', 'details': str(e)}), 500

@api_bp.route('/trends/insights', methods=['POST'])
@login_required
@rate_limit(max_requests=30, per_minutes=60)
def get_insights():
    """Get comprehensive insights for keywords"""
    start_time = time.time()
    
    try:
        data = request.get_json()
        if not data or 'keywords' not in data:
            log_api_usage(400)
            return jsonify({'error': 'Keywords are required'}), 400
        
        keywords = data.get('keywords', [])
        timeframe = data.get('timeframe', 'today 3-m')
        
        if not isinstance(keywords, list) or len(keywords) == 0:
            log_api_usage(400)
            return jsonify({'error': 'Keywords must be a non-empty list'}), 400
        
        analyzer = get_analyzer()
        insights = analyzer.get_trending_insights(keywords, timeframe)
        
        response_time = (time.time() - start_time) * 1000
        log_api_usage(200, response_time)
        
        return jsonify({
            'success': True,
            'data': insights,
            'metadata': {
                'response_time_ms': response_time,
                'timestamp': datetime.utcnow().isoformat()
            }
        })
        
    except Exception as e:
        current_app.logger.error(f"Insights error: {e}")
        log_api_usage(500, (time.time() - start_time) * 1000)
        return jsonify({'error': 'Failed to generate insights', 'details': str(e)}), 500

# Watchlist API endpoints with ML integration
@api_bp.route('/watchlists', methods=['GET'])
@login_required
def get_watchlists():
    """Get user's watchlists"""
    try:
        watchlists = Watchlist.query.filter_by(
            user_id=current_user.id,
            is_active=True
        ).order_by(Watchlist.updated_at.desc()).all()
        
        log_api_usage(200)
        return jsonify({
            'success': True,
            'data': [watchlist.to_dict() for watchlist in watchlists]
        })
        
    except Exception as e:
        current_app.logger.error(f"Get watchlists error: {e}")
        log_api_usage(500)
        return jsonify({'error': 'Failed to retrieve watchlists'}), 500

@api_bp.route('/watchlists/<int:watchlist_id>/analyze', methods=['POST'])
@login_required
@rate_limit(max_requests=10, per_minutes=60)
def analyze_watchlist(watchlist_id):
    """Analyze all keywords in a watchlist using ML"""
    start_time = time.time()
    
    try:
        watchlist = Watchlist.query.filter_by(
            id=watchlist_id,
            user_id=current_user.id
        ).first()
        
        if not watchlist:
            log_api_usage(404)
            return jsonify({'error': 'Watchlist not found'}), 404
        
        keywords = watchlist.get_keywords()
        if not keywords:
            log_api_usage(400)
            return jsonify({'error': 'No keywords in watchlist'}), 400
        
        analyzer = get_analyzer()
        analysis_results = analyzer.analyze_watchlist_keywords(keywords)
        
        # Save analysis
        analysis = Analysis(
            user_id=current_user.id,
            title=f"Watchlist Analysis: {watchlist.name}",
            description=f"ML analysis of watchlist '{watchlist.name}' containing {len(keywords)} keywords",
            keywords=json.dumps(keywords),
            analysis_type='watchlist_ml'
        )
        analysis.set_results(analysis_results)
        
        db.session.add(analysis)
        db.session.commit()
        
        response_time = (time.time() - start_time) * 1000
        log_api_usage(200, response_time)
        
        return jsonify({
            'success': True,
            'data': {
                'analysis_id': analysis.id,
                'watchlist': watchlist.to_dict(),
                'results': analysis_results
            },
            'metadata': {
                'response_time_ms': response_time,
                'keywords_analyzed': len(keywords)
            }
        })
        
    except Exception as e:
        current_app.logger.error(f"Watchlist analysis error: {e}")
        log_api_usage(500, (time.time() - start_time) * 1000)
        return jsonify({'error': 'Failed to analyze watchlist', 'details': str(e)}), 500

@api_bp.route('/watchlists', methods=['POST'])
@login_required
def create_watchlist():
    """Create a new watchlist"""
    try:
        data = request.get_json()
        if not data:
            log_api_usage(400)
            return jsonify({'error': 'Request data is required'}), 400
        
        required_fields = ['name', 'keywords', 'category']
        for field in required_fields:
            if field not in data:
                log_api_usage(400)
                return jsonify({'error': f'{field} is required'}), 400
        
        watchlist = Watchlist(
            user_id=current_user.id,
            name=data['name'],
            description=data.get('description', ''),
            category=data['category'],
            is_public=data.get('is_public', False)
        )
        
        # Set keywords
        if isinstance(data['keywords'], list):
            watchlist.set_keywords(data['keywords'])
        else:
            keywords_list = [k.strip() for k in data['keywords'].split('\n') if k.strip()]
            watchlist.set_keywords(keywords_list)
        
        db.session.add(watchlist)
        db.session.commit()
        
        log_api_usage(201)
        return jsonify({
            'success': True,
            'data': watchlist.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Create watchlist error: {e}")
        log_api_usage(500)
        return jsonify({'error': 'Failed to create watchlist'}), 500

# Analysis API endpoints
@api_bp.route('/analyses', methods=['GET'])
@login_required
def get_analyses():
    """Get user's analyses with filtering"""
    try:
        # Get query parameters
        analysis_type = request.args.get('type')
        limit = min(int(request.args.get('limit', 50)), 100)  # Max 100
        offset = int(request.args.get('offset', 0))
        
        query = Analysis.query.filter_by(user_id=current_user.id)
        
        if analysis_type:
            query = query.filter_by(analysis_type=analysis_type)
        
        analyses = query.order_by(Analysis.updated_at.desc()).offset(offset).limit(limit).all()
        
        log_api_usage(200)
        return jsonify({
            'success': True,
            'data': [analysis.to_dict() for analysis in analyses],
            'metadata': {
                'count': len(analyses),
                'offset': offset,
                'limit': limit
            }
        })
        
    except Exception as e:
        current_app.logger.error(f"Get analyses error: {e}")
        log_api_usage(500)
        return jsonify({'error': 'Failed to retrieve analyses'}), 500

@api_bp.route('/analyses/<int:analysis_id>', methods=['GET'])
@login_required
def get_analysis(analysis_id):
    """Get a specific analysis with full results"""
    try:
        analysis = Analysis.query.filter_by(
            id=analysis_id,
            user_id=current_user.id
        ).first()
        
        if not analysis:
            log_api_usage(404)
            return jsonify({'error': 'Analysis not found'}), 404
        
        log_api_usage(200)
        return jsonify({
            'success': True,
            'data': analysis.to_dict()
        })
        
    except Exception as e:
        current_app.logger.error(f"Get analysis error: {e}")
        log_api_usage(500)
        return jsonify({'error': 'Failed to retrieve analysis'}), 500

# ML Model Management endpoints
@api_bp.route('/ml/models/train', methods=['POST'])
@login_required
def train_models():
    """Train ML models (admin or premium users)"""
    if not current_user.is_premium:
        log_api_usage(403)
        return jsonify({'error': 'Premium account required'}), 403
    
    start_time = time.time()
    
    try:
        analyzer = get_analyzer()
        success = analyzer.train_and_save_models()
        
        response_time = (time.time() - start_time) * 1000
        
        if success:
            log_api_usage(200, response_time)
            return jsonify({
                'success': True,
                'message': 'Models trained successfully',
                'metadata': {
                    'training_time_ms': response_time
                }
            })
        else:
            log_api_usage(500, response_time)
            return jsonify({'error': 'Model training failed'}), 500
        
    except Exception as e:
        current_app.logger.error(f"Model training error: {e}")
        log_api_usage(500, (time.time() - start_time) * 1000)
        return jsonify({'error': 'Model training failed', 'details': str(e)}), 500

@api_bp.route('/ml/models/status', methods=['GET'])
@login_required
def model_status():
    """Get ML model status"""
    try:
        analyzer = get_analyzer()
        
        # Check if models are loaded
        models_available = bool(analyzer.models)
        model_count = len(analyzer.models) if analyzer.models else 0
        
        log_api_usage(200)
        return jsonify({
            'success': True,
            'data': {
                'models_available': models_available,
                'model_count': model_count,
                'model_names': list(analyzer.models.keys()) if analyzer.models else [],
                'categories': list(analyzer.categories.keys())
            }
        })
        
    except Exception as e:
        current_app.logger.error(f"Model status error: {e}")
        log_api_usage(500)
        return jsonify({'error': 'Failed to get model status'}), 500

# Stats and dashboard endpoints
@api_bp.route('/stats/dashboard', methods=['GET'])
@login_required
def dashboard_stats():
    """Get dashboard statistics with ML insights"""
    try:
        # Basic counts
        watchlist_count = Watchlist.query.filter_by(user_id=current_user.id, is_active=True).count()
        analysis_count = Analysis.query.filter_by(user_id=current_user.id).count()
        alert_count = TrendAlert.query.filter_by(user_id=current_user.id, is_active=True).count()
        
        # Recent analyses
        recent_analyses = Analysis.query.filter_by(user_id=current_user.id)\
                                      .order_by(Analysis.updated_at.desc())\
                                      .limit(5).all()
        
        # ML model status
        analyzer = get_analyzer()
        ml_status = {
            'models_available': bool(analyzer.models),
            'model_count': len(analyzer.models) if analyzer.models else 0
        }
        
        log_api_usage(200)
        return jsonify({
            'success': True,
            'data': {
                'counts': {
                    'watchlists': watchlist_count,
                    'analyses': analysis_count,
                    'alerts': alert_count
                },
                'recent_analyses': [analysis.to_dict() for analysis in recent_analyses],
                'ml_status': ml_status
            }
        })
        
    except Exception as e:
        current_app.logger.error(f"Dashboard stats error: {e}")
        log_api_usage(500)
        return jsonify({'error': 'Failed to retrieve dashboard statistics'}), 500

# Public API endpoints
@api_bp.route('/trends/public/<keyword>', methods=['GET'])
@rate_limit(max_requests=100, per_minutes=60)
def public_trend_data(keyword):
    """Get public trend data for a keyword with ML insights"""
    start_time = time.time()
    
    try:
        timeframe = request.args.get('timeframe', 'today 3-m')
        geo = request.args.get('geo', 'US')
        include_ml = request.args.get('include_ml', 'false').lower() == 'true'
        
        analyzer = get_analyzer()
        trend_data = analyzer.fetch_trending_data([keyword], timeframe, geo)
        
        if not trend_data or keyword not in trend_data:
            log_api_usage(404, (time.time() - start_time) * 1000)
            return jsonify({'error': 'No trend data found'}), 404
        
        values = trend_data[keyword]
        result = {
            'keyword': keyword,
            'values': values.tolist() if hasattr(values, 'tolist') else list(values),
            'timeframe': timeframe,
            'geo': geo,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # Add ML insights if requested
        if include_ml:
            features = analyzer.extract_features(keyword, values)
            if features:
                result['ml_insights'] = {
                    'avg_interest': features['avg_interest'],
                    'volatility': features['volatility'],
                    'trend_direction': 'rising' if features['trend_slope'] > 0 else 'falling' if features['trend_slope'] < 0 else 'stable'
                }
        
        response_time = (time.time() - start_time) * 1000
        log_api_usage(200, response_time)
        
        return jsonify({
            'success': True,
            'data': result,
            'metadata': {
                'response_time_ms': response_time,
                'cached': False  # Could implement caching logic here
            }
        })
        
    except Exception as e:
        current_app.logger.error(f"Public trend data error: {e}")
        log_api_usage(500, (time.time() - start_time) * 1000)
        return jsonify({'error': 'Failed to fetch trend data'}), 500

def init_api(app):
    """Initialize API with Flask app"""
    app.register_blueprint(api_bp)
    
    # Initialize ML analyzer on startup
    with app.app_context():
        try:
            analyzer = get_analyzer()
            app.logger.info("ML Analyzer initialized successfully")
        except Exception as e:
            app.logger.error(f"Failed to initialize ML Analyzer: {e}")