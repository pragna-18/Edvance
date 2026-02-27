#!/usr/bin/env python
"""Test the Python bridge to diagnose issues"""

import sys
import json

print("Python version:", sys.version)
print("Python path:", sys.executable)
print("Working directory:", __import__('os').getcwd())

try:
    print("\n1. Testing predict module import...")
    from predict import HealthScorePredictor
    print("   ✓ HealthScorePredictor imported")
    
    print("\n2. Creating predictor instance...")
    predictor = HealthScorePredictor()
    print("   ✓ Predictor initialized")
    
    print("\n3. Testing prediction...")
    lesson = {
        'duration': 60,
        'objectives': ['Obj1', 'Obj2'],
        'materials': ['Mat1'],
        'activities': ['Act1', 'Act2'],
        'assessments': ['Test1'],
        'differentiation': ['Diff1'],
        'content': 'Test content'
    }
    score = predictor.predict(lesson)
    print(f"   ✓ Prediction successful: {score}/10")
    
    print("\n4. Testing with reasoning...")
    result = predictor.predict_with_reasoning(lesson)
    print(f"   ✓ Reasoning generated: score={result['score']}")
    
    print("\n✅ ALL TESTS PASSED - Bridge is working properly")
    
except Exception as e:
    import traceback
    print(f"\n❌ ERROR: {e}")
    print(traceback.format_exc())
    sys.exit(1)
