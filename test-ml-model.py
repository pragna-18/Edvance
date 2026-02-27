#!/usr/bin/env python
"""
Test script to verify ML model functionality
"""

import sys
import json

# Add ml-model to path
sys.path.insert(0, r'C:\Users\User\Desktop\Projects\Edvance\ml-model')

from predict import HealthScorePredictor

def test_ml_model():
    """Test the ML model with sample data"""
    print("=" * 70)
    print("🧪 TESTING ML MODEL FUNCTIONALITY")
    print("=" * 70)
    
    # Initialize predictor
    print("\n1️⃣  Initializing predictor...")
    try:
        predictor = HealthScorePredictor()
        print("   ✅ Predictor initialized successfully")
    except Exception as e:
        print(f"   ❌ Failed to initialize predictor: {e}")
        return False
    
    # Test with sample lesson plan
    print("\n2️⃣  Testing prediction with sample lesson plan...")
    sample_lesson = {
        'title': 'Introduction to Python',
        'subject': 'Computer Science',
        'grade': '10',
        'duration': 60,
        'objectives': [
            'Learn Python basics',
            'Understand variables and data types',
            'Write simple programs'
        ],
        'materials': [
            'Laptop with Python installed',
            'Tutorial videos',
            'Code examples'
        ],
        'activities': [
            'Live coding demo',
            'Hands-on practice',
            'Group project'
        ],
        'assessments': [
            'Quiz',
            'Code submission'
        ],
        'differentiation': [
            'Extended challenges for advanced students',
            'Simplified code examples for beginners'
        ],
        'content': '''
            This lesson introduces students to Python programming.
            We'll cover basic syntax, variables, data types, and simple programs.
            Students will learn by doing, with plenty of hands-on practice.
            By the end, they should be able to write simple Python scripts.
            The lesson includes differentiated materials for students at different levels.
        '''
    }
    
    try:
        result = predictor.predict_with_reasoning(sample_lesson)
        print(f"   ✅ Prediction successful!")
        print(f"\n   📊 Score: {result['score']}/10")
        print(f"\n   📋 Features extracted:")
        for key, value in result['features'].items():
            print(f"      • {key}: {value}")
        print(f"\n   📝 Reasoning:")
        for reason in result['reasoning']:
            print(f"      {reason}")
    except Exception as e:
        print(f"   ❌ Prediction failed: {e}")
        return False
    
    # Test batch predictions
    print("\n3️⃣  Testing batch predictions...")
    batch_lessons = [sample_lesson, sample_lesson]
    try:
        scores = predictor.predict_batch(batch_lessons)
        print(f"   ✅ Batch prediction successful!")
        print(f"      Scores: {scores}")
    except Exception as e:
        print(f"   ❌ Batch prediction failed: {e}")
        return False
    
    print("\n" + "=" * 70)
    print("✅ ALL TESTS PASSED - ML MODEL IS FULLY FUNCTIONAL")
    print("=" * 70)
    return True

if __name__ == "__main__":
    success = test_ml_model()
    sys.exit(0 if success else 1)
