"""
Standalone Prediction Module for Health Score
Can be called from Node.js or Python applications
Optimized with model caching to avoid repeated disk loads
Enhanced with better feature extraction and score normalization
"""

import numpy as np
import pandas as pd
import joblib
import os
import json

# Global model instances - cached after first load to avoid disk I/O
_GLOBAL_MODEL_INSTANCE = None
_GLOBAL_SCALER_INSTANCE = None

class HealthScorePredictor:
    """Load trained model and make predictions on new lesson plans"""
    
    def __init__(self, model_path='models/health_score_model.pkl', scaler_path='models/scaler.pkl'):
        self.model_path = model_path
        self.scaler_path = scaler_path
        self.model = None
        self.scaler = None
        self.feature_names = [
            'num_objectives',
            'num_materials', 
            'num_activities',
            'num_assessments',
            'has_differentiation',
            'duration',
            'content_words'
        ]
        
        self._load_model()
        self._load_scaler()
    
    def _load_model(self):
        """Load trained model from disk (cached in memory)"""
        global _GLOBAL_MODEL_INSTANCE
        
        # Return cached model if available
        if _GLOBAL_MODEL_INSTANCE is not None:
            self.model = _GLOBAL_MODEL_INSTANCE
            return
        
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(
                f"Model not found at {self.model_path}. "
                f"Please run train_model.py first."
            )
        
        # Load from disk only once
        self.model = joblib.load(self.model_path)
        
        # Cache globally for reuse
        _GLOBAL_MODEL_INSTANCE = self.model
    
    def _load_scaler(self):
        """Load feature scaler if available, create default if not"""
        global _GLOBAL_SCALER_INSTANCE
        
        if _GLOBAL_SCALER_INSTANCE is not None:
            self.scaler = _GLOBAL_SCALER_INSTANCE
            return
        
        if os.path.exists(self.scaler_path):
            try:
                self.scaler = joblib.load(self.scaler_path)
                _GLOBAL_SCALER_INSTANCE = self.scaler
            except Exception as e:
                print(f"⚠️  Failed to load scaler from {self.scaler_path}: {str(e)}", file=__import__('sys').stderr)
                # Create a default scaler instead
                from sklearn.preprocessing import RobustScaler
                self.scaler = RobustScaler()
                # Fit with typical feature ranges based on domain knowledge
                typical_data = np.array([[
                    2, 2, 2, 1, 0, 45, 500  # num_objectives, materials, activities, assessments, diff, duration, content_words
                ]] * 10)  # Repeat to give scaler something to fit on
                self.scaler.fit(typical_data)
                _GLOBAL_SCALER_INSTANCE = self.scaler
        else:
            # Create a default scaler with typical feature ranges
            from sklearn.preprocessing import RobustScaler
            self.scaler = RobustScaler()
            # Fit with typical feature ranges based on domain knowledge
            typical_data = np.array([[
                2, 2, 2, 1, 0, 45, 500  # num_objectives, materials, activities, assessments, diff, duration, content_words
            ]] * 10)  # Repeat to give scaler something to fit on
            self.scaler.fit(typical_data)
            _GLOBAL_SCALER_INSTANCE = self.scaler

    
    def extract_features(self, lesson_plan):
        """
        Extract and normalize features from lesson plan
        
        Args:
            lesson_plan: dict with keys:
                - objectives: list of learning objectives
                - materials: list of materials
                - activities: list of activities
                - assessments: list of assessment methods
                - differentiation: list or bool
                - duration: int (minutes)
                - content: str or dict (lesson content)
        
        Returns:
            dict: extracted features ready for prediction
        """
        try:
            # Get feature values with safe defaults
            objectives = lesson_plan.get('objectives', [])
            materials = lesson_plan.get('materials', [])
            activities = lesson_plan.get('activities', [])
            assessments = lesson_plan.get('assessments', [])
            
            # Count objectives - handle both lists and single items
            if isinstance(objectives, (list, tuple)):
                num_objectives = len([o for o in objectives if o])
            else:
                num_objectives = 1 if objectives else 0
            
            # Count materials
            if isinstance(materials, (list, tuple)):
                num_materials = len([m for m in materials if m])
            else:
                num_materials = 1 if materials else 0
            
            # Count activities
            if isinstance(activities, (list, tuple)):
                num_activities = len([a for a in activities if a])
            else:
                num_activities = 1 if activities else 0
            
            # Count assessments
            if isinstance(assessments, (list, tuple)):
                num_assessments = len([a for a in assessments if a])
            else:
                num_assessments = 1 if assessments else 0
            
            # Check for differentiation
            differentiation = lesson_plan.get('differentiation', [])
            if isinstance(differentiation, (list, tuple)):
                has_differentiation = 1 if len([d for d in differentiation if d]) > 0 else 0
            else:
                has_differentiation = int(bool(differentiation))
            
            # Duration with validation
            duration = int(lesson_plan.get('duration', 45))
            duration = max(30, min(120, duration))  # Clamp between 30-120
            
            # Calculate content words with better handling
            content = lesson_plan.get('content', '')
            if isinstance(content, dict):
                content = json.dumps(content)
            elif not isinstance(content, str):
                content = str(content)
            
            content_words = len(content.split())
            content_words = max(100, min(3000, content_words))  # Clamp between 100-3000
            
            # Keep feature values without excessive clamping
            # Clamp to reasonable bounds but don't artificially compress differences
            features = {
                'num_objectives': max(1, min(num_objectives, 10)),  # Allow up to 10, don't clamp to 6
                'num_materials': max(1, min(num_materials, 10)),    # Allow up to 10, don't clamp to 6
                'num_activities': max(1, min(num_activities, 10)),  # Allow up to 10, don't clamp to 5
                'num_assessments': max(1, min(num_assessments, 5)), # Allow up to 5, don't clamp to 4
                'has_differentiation': has_differentiation,
                'duration': duration,
                'content_words': content_words
            }
            
            return features
        
        except Exception as e:
            print(f"⚠️  Error extracting features: {str(e)}")
            # Return safe defaults
            return {
                'num_objectives': 2,
                'num_materials': 1,
                'num_activities': 2,
                'num_assessments': 1,
                'has_differentiation': 0,
                'duration': 45,
                'content_words': 500
            }
    
    def normalize_score(self, raw_score):
        """
        Normalize raw model prediction to 1-10 health score scale
        Applies sigmoid normalization and proper scaling
        """
        # First, clip to reasonable model output range
        raw_score = float(raw_score)
        
        # If raw score is already in 1-10 range, use it directly
        if 0.5 < raw_score < 10.5:
            # Soft clipping for values slightly out of range
            normalized = max(1.0, min(10.0, raw_score))
        else:
            # For values far outside range, use sigmoid normalization
            # Center around 5, scale down large values
            if raw_score > 10:
                # Map scores > 10 down towards 10
                normalized = 10 - (1 / (1 + np.exp((raw_score - 10) / 2)))
            elif raw_score < 1:
                # Map scores < 1 up towards 1
                normalized = 1 + (1 / (1 + np.exp((1 - raw_score) / 2)))
            else:
                normalized = raw_score
        
        # Ensure final score is in valid range
        normalized = max(1.0, min(10.0, float(normalized)))
        
        return round(normalized, 1)
    
    def predict(self, lesson_plan, return_features=False):
        """
        Predict health score for lesson plan
        
        Args:
            lesson_plan: dict with lesson plan data
            return_features: bool, whether to return extracted features
        
        Returns:
            float: predicted health score (1-10)
            or tuple: (score, features) if return_features=True
        """
        try:
            # Extract features
            features = self.extract_features(lesson_plan)
            
            # Debug log
            import sys
            print(f"[PREDICT] Features extracted: {features}", file=sys.stderr, flush=True)
            
            # Create feature array in correct order
            feature_array = np.array([[
                features['num_objectives'],
                features['num_materials'],
                features['num_activities'],
                features['num_assessments'],
                features['has_differentiation'],
                features['duration'],
                features['content_words']
            ]])
            
            # Apply scaler if available
            if self.scaler:
                try:
                    feature_array = self.scaler.transform(feature_array)
                except Exception as e:
                    print(f"⚠️  Scaler error: {str(e)}")
                    # Continue without scaling
            
            # Make prediction
            raw_prediction = self.model.predict(feature_array)[0]
            
            # Normalize to 1-10 scale
            score = self.normalize_score(raw_prediction)
            
            if return_features:
                return score, features
            return score
        
        except Exception as e:
            print(f"❌ Prediction error: {str(e)}")
            # Fallback to middle score
            if return_features:
                return 5.0, self.extract_features(lesson_plan)
            return 5.0
    
    def predict_batch(self, lesson_plans):
        """
        Predict health scores for multiple lesson plans
        
        Args:
            lesson_plans: list of lesson plan dicts
        
        Returns:
            list: predicted scores
        """
        scores = []
        for plan in lesson_plans:
            try:
                score = self.predict(plan)
                scores.append(score)
            except Exception as e:
                print(f"⚠️  Batch prediction error: {str(e)}")
                scores.append(5.0)  # Fallback
        
        return scores
    
    def predict_with_reasoning(self, lesson_plan):
        """
        Predict score and provide explanation
        
        Returns:
            dict with:
                - score: predicted score (1-10)
                - features: extracted features
                - reasoning: explanation of score
        """
        try:
            score, features = self.predict(lesson_plan, return_features=True)
            
            # Generate reasoning
            reasoning = self._generate_reasoning(score, features)
            
            return {
                'score': score,
                'features': features,
                'reasoning': reasoning
            }
        
        except Exception as e:
            print(f"❌ Reasoning error: {str(e)}")
            return {
                'score': 5.0,
                'features': self.extract_features(lesson_plan),
                'reasoning': ['Unable to generate reasoning - using default score']
            }
    
    def _generate_reasoning(self, score, features):
        """Generate human-readable explanation for score"""
        reasons = []
        
        try:
            # Learning objectives (0-2 points contribution)
            obj_score = min(features['num_objectives'] / 3 * 2, 2)
            if features['num_objectives'] >= 5:
                reasons.append(f"✓ Excellent learning objectives ({features['num_objectives']} objectives)")
            elif features['num_objectives'] >= 3:
                reasons.append(f"✓ Strong learning objectives ({features['num_objectives']} objectives)")
            elif features['num_objectives'] >= 2:
                reasons.append(f"✓ Adequate learning objectives ({features['num_objectives']} objectives)")
            else:
                reasons.append(f"⚠ Limited learning objectives ({features['num_objectives']} objective)")
            
            # Activities
            if features['num_activities'] >= 4:
                reasons.append(f"✓ Diverse activities ({features['num_activities']} activities)")
            elif features['num_activities'] >= 2:
                reasons.append(f"✓ Multiple activities ({features['num_activities']} activities)")
            else:
                reasons.append(f"⚠ Limited activities ({features['num_activities']} activity)")
            
            # Assessment
            if features['num_assessments'] >= 3:
                reasons.append(f"✓ Multiple assessment methods ({features['num_assessments']} assessments)")
            elif features['num_assessments'] >= 1:
                reasons.append(f"✓ Assessment included ({features['num_assessments']} assessment)")
            else:
                reasons.append("⚠ No formal assessment")
            
            # Materials
            if features['num_materials'] >= 4:
                reasons.append(f"✓ Rich materials ({features['num_materials']} material types)")
            elif features['num_materials'] >= 2:
                reasons.append(f"✓ Adequate materials ({features['num_materials']} material types)")
            else:
                reasons.append(f"⚠ Limited materials ({features['num_materials']} material type)")
            
            # Differentiation
            if features['has_differentiation']:
                reasons.append("✓ Includes differentiation strategies")
            else:
                reasons.append("⚠ Could add differentiation for diverse learners")
            
            # Duration
            if features['duration'] >= 90:
                reasons.append(f"ℹ Duration: {features['duration']} minutes (comprehensive)")
            elif features['duration'] >= 60:
                reasons.append(f"ℹ Duration: {features['duration']} minutes (standard)")
            elif features['duration'] >= 45:
                reasons.append(f"ℹ Duration: {features['duration']} minutes (focused)")
            else:
                reasons.append(f"⚠ Duration: {features['duration']} minutes (may be tight)")
            
            # Content depth
            if features['content_words'] >= 1500:
                reasons.append("✓ Rich content depth")
            elif features['content_words'] >= 800:
                reasons.append("✓ Adequate content coverage")
            elif features['content_words'] >= 200:
                reasons.append("⚠ Moderate content detail")
            else:
                reasons.append("⚠ Limited content detail")
            
            # Score interpretation
            if score >= 9:
                reasons.append(f"🌟 Excellent lesson plan (Score: {score}/10)")
            elif score >= 7:
                reasons.append(f"✅ Good lesson plan (Score: {score}/10)")
            elif score >= 5:
                reasons.append(f"📌 Adequate lesson plan (Score: {score}/10)")
            else:
                reasons.append(f"⚠ Needs improvement (Score: {score}/10)")
            
        except Exception as e:
            reasons.append(f"Reasoning generated with score: {score}/10")
        
        return reasons


def predict_health_score(lesson_plan_json):
    """
    Simple function to predict health score from JSON
    Can be called from Node.js via child_process
    
    Args:
        lesson_plan_json: JSON string with lesson plan data
    
    Returns:
        JSON string with score and features
    """
    try:
        predictor = HealthScorePredictor()
        lesson_plan = json.loads(lesson_plan_json) if isinstance(lesson_plan_json, str) else lesson_plan_json
        
        result = predictor.predict_with_reasoning(lesson_plan)
        return json.dumps(result)
    
    except Exception as e:
        return json.dumps({
            'error': str(e),
            'score': 5.0,
            'message': 'Using default score due to prediction error'
        })


if __name__ == "__main__":
    # Example usage
    predictor = HealthScorePredictor()
    
    # Sample lesson plan
    sample_lesson = {
        'title': 'Photosynthesis Basics',
        'subject': 'Biology',
        'grade': '9',
        'duration': 45,
        'objectives': [
            'Understand photosynthesis process',
            'Identify inputs and outputs',
            'Explain chlorophyll role'
        ],
        'materials': [
            'Textbook',
            'Microscope',
            'Plant samples'
        ],
        'activities': [
            'Lab experiment (20 mins)',
            'Group discussion (15 mins)',
            'Video presentation (10 mins)'
        ],
        'assessments': [
            'Lab report',
            'Quiz'
        ],
        'differentiation': [
            'Extended resources for advanced students',
            'Simplified diagrams for struggling students'
        ],
        'content': 'Comprehensive lesson on photosynthesis covering the light reactions, dark reactions, and the role of chlorophyll in energy conversion...'
    }
    
    print("=" * 70)
    print("🔮 HEALTH SCORE PREDICTION")
    print("=" * 70)
    
    # Predict with reasoning
    result = predictor.predict_with_reasoning(sample_lesson)
    
    print(f"\n📊 Lesson: {sample_lesson['title']}")
    print(f"\n🎯 Predicted Health Score: {result['score']}/10")
    print(f"\n📋 Extracted Features:")
    for key, value in result['features'].items():
        print(f"   - {key}: {value}")
    
    print(f"\n📝 Reasoning:")
    for reason in result['reasoning']:
        print(f"   {reason}")
    
    print("\n" + "=" * 70)
