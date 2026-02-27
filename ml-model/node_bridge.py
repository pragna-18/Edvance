"""
Node.js Integration Bridge for Health Score Prediction
This module allows Node.js to call the Python ML model
Optimized with persistent predictor instance for fast predictions
"""

import sys
import json
import io
from contextlib import redirect_stdout, redirect_stderr
from predict import HealthScorePredictor

# Global predictor instance - created once, reused for all predictions
_PREDICTOR_INSTANCE = None

def get_predictor():
    """Get or create global predictor instance (lazy loading)"""
    global _PREDICTOR_INSTANCE
    if _PREDICTOR_INSTANCE is None:
        _PREDICTOR_INSTANCE = HealthScorePredictor()
    return _PREDICTOR_INSTANCE

def main():
    """Main entry point for Node.js child_process calls"""
    try:
        # Read input from Node.js
        lesson_plan_json = sys.stdin.read()
        
        # Suppress stdout/stderr to avoid encoding issues
        f = io.StringIO()
        with redirect_stdout(f), redirect_stderr(f):
            # Get cached predictor (creates on first call, reuses on subsequent)
            predictor = get_predictor()
            lesson_plan = json.loads(lesson_plan_json)
            result = predictor.predict_with_reasoning(lesson_plan)
        
        # Output result as JSON only
        print(json.dumps(result, ensure_ascii=True))
        
    except Exception as e:
        error_result = {
            'error': str(e),
            'score': None,
            'features': None,
            'reasoning': []
        }
        print(json.dumps(error_result, ensure_ascii=True))
        sys.exit(1)

if __name__ == "__main__":
    main()
