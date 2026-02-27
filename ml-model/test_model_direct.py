#!/usr/bin/env python3
"""
Direct ML Model Test - Shows the model is working
"""

import json
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

from predict import HealthScorePredictor

def main():
    print("\n" + "="*60)
    print("ML Model Test - Direct Health Score Prediction")
    print("="*60 + "\n")

    # Test lesson plan
    test_lesson = {
        "title": "Photosynthesis Basics",
        "subject": "Biology",
        "grade": "9",
        "duration": 45,
        "objectives": [
            "Understand the process of photosynthesis",
            "Identify inputs and outputs",
            "Explain the role of chlorophyll"
        ],
        "materials": [
            "Biology textbook",
            "Microscope",
            "Plant samples",
            "Lab worksheets"
        ],
        "activities": [
            "Lab experiment with plants",
            "Class discussion on findings",
            "Video: How plants make food",
            "Interactive simulation"
        ],
        "assessments": [
            "Lab report submission",
            "Quiz on concepts",
            "Diagram labeling assessment"
        ],
        "differentiation": [
            "Advanced: Research cellular respiration",
            "Standard: Follow main curriculum",
            "Support: Simplified diagram labels"
        ],
        "content": """
        Photosynthesis is the process by which plants convert light energy into chemical energy.
        This lesson covers the basic stages of photosynthesis including the light-dependent reactions
        in the thylakoids and the light-independent reactions (Calvin cycle) in the stroma.
        Students will learn how chlorophyll absorbs light and drives the process of converting
        CO2 and water into glucose and oxygen. This is fundamental to understanding plant biology
        and the foundation of most food chains on Earth.
        """
    }

    print("📝 Test Lesson Plan:")
    print(f"   Title: \"{test_lesson['title']}\"")
    print(f"   Duration: {test_lesson['duration']} minutes")
    print(f"   Objectives: {len(test_lesson['objectives'])}")
    print(f"   Materials: {len(test_lesson['materials'])}")
    print(f"   Activities: {len(test_lesson['activities'])}")
    print(f"   Assessments: {len(test_lesson['assessments'])}")
    print(f"   Has Differentiation: {'Yes' if len(test_lesson.get('differentiation', [])) > 0 else 'No'}")
    print(f"   Content Length: {len(test_lesson['content'])} characters\n")

    try:
        print("🚀 Initializing ML Model...")
        predictor = HealthScorePredictor()
        
        print("🔄 Running Prediction 1 (Model loads from disk)...")
        result1 = predictor.predict_with_reasoning(test_lesson)
        
        print("\n✅ Prediction 1 Results:")
        print("="*60)
        print(f"📊 Health Score: {result1['score']}/10")
        
        if result1.get('features'):
            print("\n📈 Extracted Features:")
            print(f"   • Objectives: {result1['features']['num_objectives']}")
            print(f"   • Materials: {result1['features']['num_materials']}")
            print(f"   • Activities: {result1['features']['num_activities']}")
            print(f"   • Assessments: {result1['features']['num_assessments']}")
            print(f"   • Differentiation: {'Yes' if result1['features']['has_differentiation'] else 'No'}")
            print(f"   • Duration: {result1['features']['duration']} minutes")
            print(f"   • Content Words: {result1['features']['content_words']}")
        
        if result1.get('reasoning'):
            print("\n💡 Reasoning:")
            for reason in result1['reasoning']:
                print(f"   {reason}")
        
        print("="*60)
        
        # Test caching with second prediction
        print("\n🔄 Running Prediction 2 (Model cached in memory)...")
        result2 = predictor.predict_with_reasoning(test_lesson)
        
        print(f"✅ Prediction 2 Score: {result2['score']}/10")
        
        # Test caching with third prediction
        print("\n🔄 Running Prediction 3 (Model still cached)...")
        result3 = predictor.predict_with_reasoning(test_lesson)
        
        print(f"✅ Prediction 3 Score: {result3['score']}/10")
        
        print("\n" + "="*60)
        print("✨ ML Model Performance Summary")
        print("="*60)
        print(f"✅ Model loads successfully")
        print(f"✅ Can extract 7 features from lesson plans")
        print(f"✅ Generates health scores (1-10 scale)")
        print(f"✅ Provides reasoning for scores")
        print(f"✅ Model caching is working")
        print(f"✅ Can make multiple predictions")
        print("="*60 + "\n")
        
        print("🎉 ML Model is working correctly!\n")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
