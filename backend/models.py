# models.py - Database models for the trends application

from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import json

db = SQLAlchemy()

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    
    # User preferences
    default_geo = db.Column(db.String(10), default='US')
    default_timeframe = db.Column(db.String(20), default='today 12-m')
    email_notifications = db.Column(db.Boolean, default=True)
    
    # Relationships
    watchlists = db.relationship('Watchlist', backref='user', lazy=True, cascade='all, delete-orphan')
    analyses = db.relationship('Analysis', backref='user', lazy=True, cascade='all, delete-orphan')
    alerts = db.relationship('TrendAlert', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check if provided password matches hash"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Convert user to dictionary"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat(),
            'default_geo': self.default_geo,
            'default_timeframe': self.default_timeframe
        }

class Watchlist(db.Model):
    __tablename__ = 'watchlists'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    keywords = db.Column(db.Text, nullable=False)  # JSON string
    category = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    is_public = db.Column(db.Boolean, default=False)
    
    def get_keywords(self):
        """Get keywords as list"""
        return json.loads(self.keywords) if self.keywords else []
    
    def set_keywords(self, keywords_list):
        """Set keywords from list"""
        self.keywords = json.dumps(keywords_list)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'keywords': self.get_keywords(),
            'category': self.category,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_active': self.is_active,
            'is_public': self.is_public
        }

class TrendData(db.Model):
    __tablename__ = 'trend_data'
    
    id = db.Column(db.Integer, primary_key=True)
    keyword = db.Column(db.String(100), nullable=False, index=True)
    date = db.Column(db.Date, nullable=False, index=True)
    interest_score = db.Column(db.Integer, nullable=False)
    geo = db.Column(db.String(10), default='US', index=True)
    category = db.Column(db.String(50), index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Compound index for efficient queries
    __table_args__ = (
        db.Index('idx_keyword_date_geo', 'keyword', 'date', 'geo'),
    )
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'keyword': self.keyword,
            'date': self.date.isoformat(),
            'interest_score': self.interest_score,
            'geo': self.geo,
            'category': self.category,
            'created_at': self.created_at.isoformat()
        }

class Analysis(db.Model):
    __tablename__ = 'analyses'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    keywords = db.Column(db.Text, nullable=False)  # JSON string
    analysis_type = db.Column(db.String(50), nullable=False)  # 'trend', 'comparison', 'prediction'
    results = db.Column(db.Text, nullable=False)  # JSON string
    chart_data = db.Column(db.Text)  # Base64 encoded chart or chart config
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_public = db.Column(db.Boolean, default=False)
    
    def get_keywords(self):
        """Get keywords as list"""
        return json.loads(self.keywords) if self.keywords else []
    
    def get_results(self):
        """Get results as dictionary"""
        return json.loads(self.results) if self.results else {}
    
    def set_results(self, results_dict):
        """Set results from dictionary"""
        self.results = json.dumps(results_dict)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'keywords': self.get_keywords(),
            'analysis_type': self.analysis_type,
            'results': self.get_results(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_public': self.is_public
        }

class TrendAlert(db.Model):
    __tablename__ = 'trend_alerts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    keyword = db.Column(db.String(100), nullable=False)
    alert_type = db.Column(db.String(20), nullable=False)  # 'spike', 'drop', 'threshold'
    threshold_value = db.Column(db.Integer)  # For threshold alerts
    percentage_change = db.Column(db.Float)  # For spike/drop alerts
    geo = db.Column(db.String(10), default='US')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_checked = db.Column(db.DateTime)
    last_triggered = db.Column(db.DateTime)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'keyword': self.keyword,
            'alert_type': self.alert_type,
            'threshold_value': self.threshold_value,
            'percentage_change': self.percentage_change,
            'geo': self.geo,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'last_checked': self.last_checked.isoformat() if self.last_checked else None,
            'last_triggered': self.last_triggered.isoformat() if self.last_triggered else None
        }

class MLModel(db.Model):
    __tablename__ = 'ml_models'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    model_type = db.Column(db.String(50), nullable=False)  # 'classification', 'regression', 'clustering'
    model_data = db.Column(db.LargeBinary)  # Pickled model
    accuracy = db.Column(db.Float)
    training_data_size = db.Column(db.Integer)
    features = db.Column(db.Text)  # JSON string of feature names
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    def get_features(self):
        """Get features as list"""
        return json.loads(self.features) if self.features else []
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'model_type': self.model_type,
            'accuracy': self.accuracy,
            'training_data_size': self.training_data_size,
            'features': self.get_features(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_active': self.is_active
        }

class APIUsage(db.Model):
    __tablename__ = 'api_usage'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Nullable for anonymous usage
    endpoint = db.Column(db.String(100), nullable=False)
    method = db.Column(db.String(10), nullable=False)
    ip_address = db.Column(db.String(45))  # IPv6 compatible
    user_agent = db.Column(db.Text)
    response_status = db.Column(db.Integer)
    response_time = db.Column(db.Float)  # in seconds
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'endpoint': self.endpoint,
            'method': self.method,
            'ip_address': self.ip_address,
            'response_status': self.response_status,
            'response_time': self.response_time,
            'created_at': self.created_at.isoformat()
        }