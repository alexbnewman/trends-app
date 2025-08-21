# ml_analyzer.py - Updated to integrate with Flask models

import pandas as pd
import numpy as np
from pytrends.request import TrendReq
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
import warnings
import time
import json
import joblib
import os
warnings.filterwarnings('ignore')

# ML imports
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder, MinMaxScaler
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.cluster import KMeans

class GoogleTrendsMLAnalyzer:
    def __init__(self, cache_dir='ml_cache'):
        self.pytrends = TrendReq(hl='en-US', tz=360)
        self.scaler = StandardScaler()
        self.vectorizer = TfidfVectorizer(max_features=500, stop_words='english')
        self.label_encoder = LabelEncoder()
        self.cache_dir = cache_dir
        
        # Create cache directory
        os.makedirs(cache_dir, exist_ok=True)
        
        # Load pre-trained models if they exist
        self.models = {}
        self.load_models()
        
        # Updated categories based on your interests
        self.categories = {
            'climbing': ['rock climbing', 'bouldering', 'mountaineering', 'climbing gym', 'outdoor climbing'],
            'coding': ['python programming', 'javascript', 'web development', 'software engineering', 'coding'],
            'technology': ['artificial intelligence', 'machine learning', 'data science', 'cybersecurity', 'blockchain'],
            'outdoor': ['hiking', 'camping', 'backpacking', 'outdoor gear', 'national parks'],
            'fitness': ['gym workout', 'strength training', 'crossfit', 'running', 'yoga']
        }
        
    def save_models(self):
        """Save trained models to disk"""
        try:
            model_path = os.path.join(self.cache_dir, 'models.joblib')
            scaler_path = os.path.join(self.cache_dir, 'scaler.joblib')
            vectorizer_path = os.path.join(self.cache_dir, 'vectorizer.joblib')
            encoder_path = os.path.join(self.cache_dir, 'label_encoder.joblib')
            
            joblib.dump(self.models, model_path)
            joblib.dump(self.scaler, scaler_path)
            joblib.dump(self.vectorizer, vectorizer_path)
            joblib.dump(self.label_encoder, encoder_path)
            
            print("✅ Models saved successfully")
        except Exception as e:
            print(f"⚠️ Failed to save models: {e}")
    
    def load_models(self):
        """Load pre-trained models from disk"""
        try:
            model_path = os.path.join(self.cache_dir, 'models.joblib')
            scaler_path = os.path.join(self.cache_dir, 'scaler.joblib')
            vectorizer_path = os.path.join(self.cache_dir, 'vectorizer.joblib')
            encoder_path = os.path.join(self.cache_dir, 'label_encoder.joblib')
            
            if all(os.path.exists(path) for path in [model_path, scaler_path, vectorizer_path, encoder_path]):
                self.models = joblib.load(model_path)
                self.scaler = joblib.load(scaler_path)
                self.vectorizer = joblib.load(vectorizer_path)
                self.label_encoder = joblib.load(encoder_path)
                print("✅ Pre-trained models loaded")
                return True
        except Exception as e:
            print(f"⚠️ Failed to load models: {e}")
        
        return False
        
    def fetch_trending_data(self, keywords, timeframe='today 12-m', geo='US'):
        """
        Fetch Google Trends data with caching and error handling
        """
        # Check cache first
        cache_key = f"{'-'.join(keywords)}_{timeframe}_{geo}"
        cache_file = os.path.join(self.cache_dir, f"{cache_key}.json")
        
        # Use cached data if less than 1 hour old
        if os.path.exists(cache_file):
            cache_time = os.path.getmtime(cache_file)
            if time.time() - cache_time < 3600:  # 1 hour
                try:
                    with open(cache_file, 'r') as f:
                        cached_data = json.load(f)
                    print(f"📦 Using cached data for: {keywords}")
                    return {k: np.array(v) for k, v in cached_data.items()}
                except Exception as e:
                    print(f"⚠️ Cache read error: {e}")
        
        # Fetch fresh data
        trending_data = {}
        
        for i, keyword in enumerate(keywords):
            try:
                # Add delay to avoid rate limiting
                if i > 0:
                    time.sleep(2)
                    
                print(f"Fetching data for: {keyword}")
                self.pytrends.build_payload([keyword], timeframe=timeframe, geo=geo)
                interest_over_time = self.pytrends.interest_over_time()
                
                if not interest_over_time.empty and keyword in interest_over_time.columns:
                    values = interest_over_time[keyword].values
                    if np.sum(values) > 0:  # Only keep if there's actual data
                        trending_data[keyword] = values
                        print(f"✓ Success: {keyword} ({len(values)} data points)")
                    else:
                        print(f"✗ No interest data for: {keyword}")
                else:
                    print(f"✗ No data available for: {keyword}")
                    
            except Exception as e:
                print(f"✗ Error fetching {keyword}: {str(e)}")
                time.sleep(5)  # Longer delay if error occurs
        
        # Cache the results
        if trending_data:
            try:
                cache_data = {k: v.tolist() for k, v in trending_data.items()}
                with open(cache_file, 'w') as f:
                    json.dump(cache_data, f)
                print(f"💾 Data cached for future use")
            except Exception as e:
                print(f"⚠️ Cache write error: {e}")
                
        return trending_data
    
    def extract_features(self, keyword, values=None):
        """Extract features for a single keyword"""
        if values is None:
            # Fetch data if not provided
            trend_data = self.fetch_trending_data([keyword])
            if not trend_data or keyword not in trend_data:
                return None
            values = trend_data[keyword]
        
        if len(values) == 0 or np.sum(values) == 0:
            return None
        
        mean_val = np.mean(values)
        
        features = {
            'keyword': keyword,
            'avg_interest': mean_val,
            'max_interest': np.max(values),
            'min_interest': np.min(values),
            'std_interest': np.std(values),
            'trend_slope': np.polyfit(range(len(values)), values, 1)[0] if len(values) > 1 else 0,
            'volatility': np.std(values) / mean_val if mean_val > 0 else 0,
            'peak_ratio': np.max(values) / mean_val if mean_val > 0 else 0,
            'consistency': np.sum(values > mean_val) / len(values) if len(values) > 0 else 0
        }
        
        return features
    
    def predict_trend_popularity(self, keyword):
        """Predict trend category and popularity for a keyword"""
        # Extract features
        features_dict = self.extract_features(keyword)
        if not features_dict:
            return None, {"error": "Unable to extract features for this keyword"}
        
        # Check if models are trained
        if not self.models:
            return features_dict, {"error": "Models not trained yet. Please train models first."}
        
        try:
            # Prepare features for prediction
            text_features = self.vectorizer.transform([keyword])
            
            numerical_cols = ['avg_interest', 'max_interest', 'min_interest', 
                             'std_interest', 'trend_slope', 'volatility',
                             'peak_ratio', 'consistency']
            
            numerical_features = np.array([[features_dict[col] for col in numerical_cols]])
            numerical_features_scaled = self.scaler.transform(numerical_features)
            
            # Combine features
            combined_features = np.hstack([text_features.toarray(), numerical_features_scaled])
            
            # Get predictions from all models
            predictions = {}
            confidences = {}
            
            for model_name, model in self.models.items():
                if model is not None:
                    pred = model.predict(combined_features)[0]
                    category = self.label_encoder.inverse_transform([pred])[0]
                    predictions[model_name] = category
                    
                    # Get confidence if available
                    if hasattr(model, 'predict_proba'):
                        proba = model.predict_proba(combined_features)[0]
                        confidences[model_name] = float(np.max(proba))
            
            # Ensemble prediction (majority vote)
            if predictions:
                most_common_pred = max(set(predictions.values()), key=list(predictions.values()).count)
                avg_confidence = np.mean(list(confidences.values())) if confidences else 0
                
                result = {
                    "predicted_category": most_common_pred,
                    "confidence": float(avg_confidence),
                    "individual_predictions": predictions,
                    "individual_confidences": confidences,
                    "features": features_dict
                }
                
                return features_dict, result
            else:
                return features_dict, {"error": "No valid predictions available"}
                
        except Exception as e:
            return features_dict, {"error": f"Prediction failed: {str(e)}"}
    
    def analyze_watchlist_keywords(self, keywords):
        """Analyze a list of keywords from a watchlist"""
        analysis_results = {}
        
        # Fetch trend data for all keywords
        trend_data = self.fetch_trending_data(keywords)
        
        for keyword in keywords:
            if keyword in trend_data:
                values = trend_data[keyword]
                features, prediction = self.predict_trend_popularity(keyword)
                
                analysis_results[keyword] = {
                    'trend_data': values.tolist(),
                    'features': features,
                    'prediction': prediction,
                    'status': 'success'
                }
            else:
                analysis_results[keyword] = {
                    'status': 'no_data',
                    'error': 'No trend data available'
                }
        
        return analysis_results
    
    def get_trending_insights(self, keywords, timeframe='today 3-m'):
        """Get comprehensive insights for keywords"""
        trend_data = self.fetch_trending_data(keywords, timeframe)
        
        if not trend_data:
            return {"error": "No trend data available"}
        
        insights = {
            'timeframe': timeframe,
            'keywords_analyzed': len(trend_data),
            'keywords': {}
        }
        
        all_values = []
        for keyword, values in trend_data.items():
            features = self.extract_features(keyword, values)
            if features:
                insights['keywords'][keyword] = {
                    'avg_interest': features['avg_interest'],
                    'max_interest': features['max_interest'],
                    'trend_direction': 'rising' if features['trend_slope'] > 0 else 'falling' if features['trend_slope'] < 0 else 'stable',
                    'volatility': features['volatility'],
                    'data_points': len(values)
                }
                all_values.extend(values)
        
        # Overall insights
        if all_values:
            insights['overall'] = {
                'avg_interest': float(np.mean(all_values)),
                'max_interest': float(np.max(all_values)),
                'total_data_points': len(all_values)
            }
        
        return insights
    
    def train_and_save_models(self):
        """Train models with current categories and save them"""
        print("🤖 Training models with your categories...")
        
        # Create dataset
        dataset = []
        labels = []
        
        for category, keywords in self.categories.items():
            print(f"\n📊 Processing category: {category.upper()}")
            limited_keywords = keywords[:3]  # Limit to avoid rate limits
            trend_data = self.fetch_trending_data(limited_keywords)
            
            for keyword, values in trend_data.items():
                features = self.extract_features(keyword, values)
                if features and features['avg_interest'] > 0:
                    dataset.append(features)
                    labels.append(category)
        
        if len(dataset) < 5:
            print("❌ Not enough data to train models")
            return False
        
        df = pd.DataFrame(dataset)
        
        # Prepare features
        X, y = self._prepare_features_for_training(df, labels)
        if X is None:
            return False
        
        # Train models
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)
        
        self.models = {}
        
        # Random Forest
        try:
            rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
            rf_model.fit(X_train, y_train)
            rf_score = rf_model.score(X_test, y_test)
            self.models['random_forest'] = rf_model
            print(f"✓ Random Forest trained - Accuracy: {rf_score:.3f}")
        except Exception as e:
            print(f"✗ Random Forest failed: {e}")
        
        # SVM
        try:
            svm_model = SVC(probability=True, random_state=42)
            svm_model.fit(X_train, y_train)
            svm_score = svm_model.score(X_test, y_test)
            self.models['svm'] = svm_model
            print(f"✓ SVM trained - Accuracy: {svm_score:.3f}")
        except Exception as e:
            print(f"✗ SVM failed: {e}")
        
        # Naive Bayes (with scaled features)
        try:
            scaler_nb = MinMaxScaler()
            X_train_scaled = scaler_nb.fit_transform(X_train)
            X_test_scaled = scaler_nb.transform(X_test)
            
            nb_model = MultinomialNB(alpha=1.0)
            nb_model.fit(X_train_scaled, y_train)
            nb_score = nb_model.score(X_test_scaled, y_test)
            self.models['naive_bayes'] = nb_model
            self.nb_scaler = scaler_nb
            print(f"✓ Naive Bayes trained - Accuracy: {nb_score:.3f}")
        except Exception as e:
            print(f"✗ Naive Bayes failed: {e}")
        
        # Save models
        if self.models:
            self.save_models()
            print(f"\n✅ Training complete! {len(self.models)} models trained and saved.")
            return True
        else:
            print("❌ No models were successfully trained")
            return False
    
    def _prepare_features_for_training(self, df, labels):
        """Prepare features for model training"""
        try:
            # Text features
            text_features = self.vectorizer.fit_transform(df['keyword'])
            
            # Numerical features
            numerical_cols = ['avg_interest', 'max_interest', 'min_interest', 
                             'std_interest', 'trend_slope', 'volatility',
                             'peak_ratio', 'consistency']
            
            df[numerical_cols] = df[numerical_cols].fillna(0)
            numerical_features = self.scaler.fit_transform(df[numerical_cols])
            
            # Combine features
            combined_features = np.hstack([text_features.toarray(), numerical_features])
            
            # Encode labels
            encoded_labels = self.label_encoder.fit_transform(labels)
            
            return combined_features, encoded_labels
            
        except Exception as e:
            print(f"Feature preparation failed: {e}")
            return None, None