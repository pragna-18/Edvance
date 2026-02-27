"""
Health Score Model Training Pipeline - Enhanced Version
Trains multiple models and selects the best one
Includes hyperparameter tuning, ensemble methods, and comprehensive error handling
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV, KFold
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, VotingRegressor, AdaBoostRegressor
from sklearn.preprocessing import StandardScaler, RobustScaler
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error, mean_absolute_percentage_error
from sklearn.pipeline import Pipeline
import joblib
import os
import json
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

class HealthScoreModelTrainer:
    """Train and evaluate health score prediction model with advanced techniques"""
    
    def __init__(self, data_path='data/training_data.csv'):
        self.data_path = data_path
        self.model = None
        self.models = {}  # Store multiple models
        self.scaler = RobustScaler()  # Better for outliers
        self.feature_importance = None
        self.metrics = {}
        self.best_model_name = None
        
    def load_data(self):
        """Load training data from Kaggle datasets"""
        print(f"📥 Loading data from Kaggle datasets...")
        
        if not os.path.exists(self.data_path):
            raise FileNotFoundError(f"Data file not found: {self.data_path}")
        
        df = pd.read_csv(self.data_path)
        
        # Show dataset sources
        if 'dataset' in df.columns:
            print(f"\n📊 Datasets included:")
            unique_datasets = df['dataset'].unique()
            for dataset in unique_datasets[:5]:
                count = len(df[df['dataset'] == dataset])
                print(f"   - {dataset}: {count} samples")
            if len(unique_datasets) > 5:
                print(f"   ... and {len(unique_datasets) - 5} more datasets")
        
        # Feature columns
        feature_cols = ['num_objectives', 'num_materials', 'num_activities', 
                       'num_assessments', 'has_differentiation', 'duration', 'content_words']
        
        X = df[feature_cols].copy()
        y = df['health_score'].copy()
        
        # Handle missing values
        X = X.fillna(X.mean())
        
        # Ensure all features are numeric
        for col in X.columns:
            X[col] = pd.to_numeric(X[col], errors='coerce').fillna(0)
        
        print(f"\n✅ Data loaded: {X.shape[0]} samples, {X.shape[1]} features")
        print(f"   Features: {list(X.columns)}")
        print(f"\n📈 Target (Health Score) Distribution:")
        print(f"   Min: {y.min():.2f}")
        print(f"   Max: {y.max():.2f}")
        print(f"   Mean: {y.mean():.2f}")
        print(f"   Std: {y.std():.2f}")
        print(f"   Median: {y.median():.2f}")
        
        return X, y
    
    def prepare_data(self, X, y, test_size=0.2, random_state=42):
        """Split data into train and test sets with stratification"""
        print(f"\n📊 Preparing data (test_size={test_size})...")
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state
        )
        
        # Scale features using RobustScaler
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        print(f"✅ Training set: {X_train.shape[0]} samples")
        print(f"✅ Test set: {X_test.shape[0]} samples")
        print(f"✅ Features scaled using RobustScaler")
        
        return X_train_scaled, X_test_scaled, y_train, y_test
    
    def train_random_forest(self, X_train, y_train):
        """Train optimized Random Forest model"""
        print("\n🤖 Training Random Forest model...")
        
        # GridSearch for best parameters
        param_grid = {
            'n_estimators': [100, 200, 300],
            'max_depth': [10, 15, 20],
            'min_samples_split': [2, 5, 10],
            'min_samples_leaf': [1, 2, 4],
            'max_features': ['sqrt', 'log2']
        }
        
        rf = RandomForestRegressor(random_state=42, n_jobs=-1)
        
        # Quick grid search with limited iterations
        search = GridSearchCV(
            rf, param_grid, cv=3, n_jobs=-1, verbose=1,
            scoring='r2'
        )
        search.fit(X_train, y_train)
        
        best_model = search.best_estimator_
        print(f"✅ Best parameters found: {search.best_params_}")
        print(f"✅ Best CV score: {search.best_score_:.4f}")
        
        self.models['RandomForest'] = best_model
        return best_model
    
    def train_gradient_boosting(self, X_train, y_train):
        """Train optimized Gradient Boosting model"""
        print("\n🤖 Training Gradient Boosting model...")
        
        param_grid = {
            'n_estimators': [100, 200],
            'max_depth': [3, 5, 7],
            'learning_rate': [0.01, 0.1, 0.2],
            'min_samples_split': [2, 5],
        }
        
        gb = GradientBoostingRegressor(random_state=42, subsample=0.8)
        
        search = GridSearchCV(
            gb, param_grid, cv=3, n_jobs=-1, verbose=1,
            scoring='r2'
        )
        search.fit(X_train, y_train)
        
        best_model = search.best_estimator_
        print(f"✅ Best parameters found: {search.best_params_}")
        print(f"✅ Best CV score: {search.best_score_:.4f}")
        
        self.models['GradientBoosting'] = best_model
        return best_model
    
    def train_adaboost(self, X_train, y_train):
        """Train AdaBoost model"""
        print("\n🤖 Training AdaBoost model...")
        
        param_grid = {
            'n_estimators': [100, 200],
            'learning_rate': [0.5, 1.0, 1.5],
        }
        
        ada = AdaBoostRegressor(random_state=42)
        
        search = GridSearchCV(
            ada, param_grid, cv=3, n_jobs=-1, verbose=0,
            scoring='r2'
        )
        search.fit(X_train, y_train)
        
        best_model = search.best_estimator_
        print(f"✅ Best parameters found: {search.best_params_}")
        print(f"✅ Best CV score: {search.best_score_:.4f}")
        
        self.models['AdaBoost'] = best_model
        return best_model
    
    def evaluate_model(self, model, X_test, y_test, model_name="Model"):
        """Evaluate model performance"""
        print(f"\n📈 Evaluating {model_name}...")
        
        # Make predictions
        y_pred = model.predict(X_test)
        
        # Clamp predictions to 1-10 range
        y_pred = np.clip(y_pred, 1, 10)
        
        # Calculate metrics
        mse = mean_squared_error(y_test, y_pred)
        rmse = np.sqrt(mse)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        mape = mean_absolute_percentage_error(y_test, y_pred)
        
        # Cross-validation score
        kfold = KFold(n_splits=5, shuffle=True, random_state=42)
        cv_scores = cross_val_score(model, X_test, y_test, cv=kfold, scoring='r2')
        
        metrics = {
            'mse': mse,
            'rmse': rmse,
            'mae': mae,
            'r2': r2,
            'mape': mape,
            'cv_mean': cv_scores.mean(),
            'cv_std': cv_scores.std()
        }
        
        print(f"\n📊 Performance Metrics ({model_name}):")
        print(f"   ✓ R² Score: {r2:.4f}")
        print(f"   ✓ RMSE: {rmse:.4f}")
        print(f"   ✓ MAE: {mae:.4f}")
        print(f"   ✓ MAPE: {mape:.4f}%")
        print(f"   ✓ CV R² (mean ± std): {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
        
        # Show sample predictions
        print(f"\n🎯 Sample Predictions ({model_name}):")
        sample_indices = np.random.choice(len(y_test), min(5, len(y_test)), replace=False)
        for idx in sample_indices:
            actual = y_test.iloc[idx]
            predicted = y_pred[idx]
            error = abs(actual - predicted)
            print(f"   Actual: {actual:.2f}, Predicted: {predicted:.2f}, Error: {error:.2f}")
        
        return y_pred, metrics
    
    def plot_feature_importance(self, models_to_plot, X_train, output_dir='models'):
        """Plot and save feature importance for multiple models"""
        print(f"\n📊 Analyzing feature importance...")
        
        os.makedirs(output_dir, exist_ok=True)
        
        fig, axes = plt.subplots(1, len(models_to_plot), figsize=(6 * len(models_to_plot), 5))
        if len(models_to_plot) == 1:
            axes = [axes]
        
        for idx, (model_name, model) in enumerate(models_to_plot.items()):
            if hasattr(model, 'feature_importances_'):
                importances = model.feature_importances_
                
                feature_importance = pd.DataFrame({
                    'feature': ['num_objectives', 'num_materials', 'num_activities',
                               'num_assessments', 'has_differentiation', 'duration', 'content_words'],
                    'importance': importances
                }).sort_values('importance', ascending=False)
                
                sns.barplot(data=feature_importance, x='importance', y='feature', 
                           palette='viridis', ax=axes[idx])
                axes[idx].set_title(f'{model_name} Feature Importance')
                axes[idx].set_xlabel('Importance Score')
        
        plt.tight_layout()
        
        plot_path = os.path.join(output_dir, 'feature_importance_comparison.png')
        plt.savefig(plot_path, dpi=300, bbox_inches='tight')
        print(f"✅ Feature importance plot saved to {plot_path}")
        plt.close()
        
        # Save top features
        if self.best_model_name and self.best_model_name in self.models:
            model = self.models[self.best_model_name]
            if hasattr(model, 'feature_importances_'):
                feature_importance = pd.DataFrame({
                    'feature': ['num_objectives', 'num_materials', 'num_activities',
                               'num_assessments', 'has_differentiation', 'duration', 'content_words'],
                    'importance': model.feature_importances_
                }).sort_values('importance', ascending=False)
                
                print(f"\n🔝 Top Features ({self.best_model_name}):")
                for idx, row in feature_importance.head(10).iterrows():
                    print(f"   {row['feature']}: {row['importance']:.4f}")
                
                self.feature_importance = feature_importance
    
    def plot_predictions(self, models_results, output_dir='models'):
        """Plot actual vs predicted values for best model"""
        print(f"\n📊 Creating prediction visualization...")
        
        os.makedirs(output_dir, exist_ok=True)
        
        # Get best model results
        if self.best_model_name in models_results:
            y_test, y_pred = models_results[self.best_model_name]
            
            fig, axes = plt.subplots(1, 2, figsize=(14, 5))
            
            # Actual vs Predicted scatter plot
            axes[0].scatter(y_test, y_pred, alpha=0.6, edgecolors='k')
            axes[0].plot([1, 10], [1, 10], 'r--', lw=2)
            axes[0].set_xlabel('Actual Health Score')
            axes[0].set_ylabel('Predicted Health Score')
            axes[0].set_title(f'{self.best_model_name}: Actual vs Predicted')
            axes[0].set_xlim(1, 10)
            axes[0].set_ylim(1, 10)
            axes[0].grid(True, alpha=0.3)
            
            # Residuals plot
            residuals = y_test.values - y_pred
            axes[1].scatter(y_pred, residuals, alpha=0.6, edgecolors='k')
            axes[1].axhline(y=0, color='r', linestyle='--', lw=2)
            axes[1].set_xlabel('Predicted Health Score')
            axes[1].set_ylabel('Residuals')
            axes[1].set_title(f'{self.best_model_name}: Residual Plot')
            axes[1].grid(True, alpha=0.3)
            
            plt.tight_layout()
            
            plot_path = os.path.join(output_dir, 'predictions_plot.png')
            plt.savefig(plot_path, dpi=300, bbox_inches='tight')
            print(f"✅ Prediction plot saved to {plot_path}")
            plt.close()
    
    def save_model(self, output_dir='models'):
        """Save trained model and metadata"""
        print(f"\n💾 Saving model...")
        
        os.makedirs(output_dir, exist_ok=True)
        
        if not self.model:
            raise ValueError("No model trained yet!")
        
        # Save model
        model_path = os.path.join(output_dir, 'health_score_model.pkl')
        joblib.dump(self.model, model_path)
        print(f"✅ Model saved to {model_path}")
        
        # Save scaler
        scaler_path = os.path.join(output_dir, 'scaler.pkl')
        joblib.dump(self.scaler, scaler_path)
        print(f"✅ Scaler saved to {scaler_path}")
        
        # Save metadata
        metadata = {
            'model_type': self.best_model_name,
            'training_date': datetime.now().isoformat(),
            'metrics': self.metrics,
            'feature_importance': self.feature_importance.to_dict() if self.feature_importance is not None else None,
            'hyperparameters': self.model.get_params(),
            'all_models': list(self.models.keys())
        }
        
        metadata_path = os.path.join(output_dir, 'model_metadata.json')
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2, default=str)
        print(f"✅ Metadata saved to {metadata_path}")
        
        return model_path, metadata_path
    
    def run_full_pipeline(self):
        """Run complete training pipeline"""
        print("=" * 70)
        print("🚀 ENHANCED HEALTH SCORE MODEL TRAINING PIPELINE")
        print("=" * 70)
        
        # Load data
        X, y = self.load_data()
        
        # Prepare data
        X_train, X_test, y_train, y_test = self.prepare_data(X, y)
        
        # Train multiple models
        print("\n" + "="*70)
        print("🤖 TRAINING MULTIPLE MODELS")
        print("="*70)
        
        self.train_random_forest(X_train, y_train)
        self.train_gradient_boosting(X_train, y_train)
        self.train_adaboost(X_train, y_train)
        
        # Evaluate all models
        print("\n" + "="*70)
        print("📊 EVALUATING ALL MODELS")
        print("="*70)
        
        model_results = {}
        model_metrics = {}
        
        for model_name, model in self.models.items():
            y_pred, metrics = self.evaluate_model(model, X_test, y_test, model_name)
            model_results[model_name] = (y_test, y_pred)
            model_metrics[model_name] = metrics
        
        # Select best model based on R² score
        best_r2 = -1
        for model_name, metrics in model_metrics.items():
            if metrics['r2'] > best_r2:
                best_r2 = metrics['r2']
                self.best_model_name = model_name
                self.model = self.models[model_name]
                self.metrics = metrics
        
        print("\n" + "="*70)
        print(f"🏆 BEST MODEL: {self.best_model_name} (R² = {best_r2:.4f})")
        print("="*70)
        
        # Feature importance
        self.plot_feature_importance(self.models, X_train)
        
        # Visualizations
        self.plot_predictions(model_results)
        
        # Save model
        self.save_model()
        
        print("\n" + "="*70)
        print("✅ TRAINING COMPLETE!")
        print("="*70)
        
        return self.model, self.metrics


if __name__ == "__main__":
    # Create trainer
    trainer = HealthScoreModelTrainer()
    
    # Run pipeline
    model, metrics = trainer.run_full_pipeline()

