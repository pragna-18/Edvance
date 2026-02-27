"""
Persistent Python Bridge for Health Score Prediction
Keeps process alive and handles multiple requests efficiently
Startup: ~1-2 seconds (model loads once)
Per-prediction: ~50-100ms
Enhanced error handling and graceful degradation
"""

import sys
import json
import io
import traceback
from contextlib import redirect_stdout, redirect_stderr

# Global predictor instance - created once on startup
predictor = None

def initialize():
    """Initialize predictor on startup"""
    global predictor
    
    # Pre-load model
    try:
        import warnings
        warnings.filterwarnings('ignore')
        print("[INIT] Importing HealthScorePredictor...", file=sys.stderr, flush=True)
        from predict import HealthScorePredictor
        
        print("[INIT] Creating predictor instance...", file=sys.stderr, flush=True)
        predictor = HealthScorePredictor()
        
        print("[INIT] Predictor ready!", file=sys.stderr, flush=True)
        # Signal Node.js that we're ready AFTER model loads
        print("READY", flush=True)
    except Exception as e:
        error_response = {
            "error": f"Failed to initialize predictor: {str(e)}",
            "traceback": traceback.format_exc()
        }
        print(json.dumps(error_response), flush=True)
        sys.exit(1)

def handle_request(request_data):
    """Handle a single prediction request with error handling"""
    request_id = request_data.get('id')
    lesson_plan = request_data.get('lesson_plan', {})
    
    try:
        if not predictor:
            raise RuntimeError("Predictor not initialized")
        
        if not isinstance(lesson_plan, dict):
            raise ValueError("lesson_plan must be a dictionary")
        
        # Suppress stdout/stderr during prediction
        f = io.StringIO()
        with redirect_stdout(f), redirect_stderr(f):
            result = predictor.predict_with_reasoning(lesson_plan)
        
        # Validate result
        if not isinstance(result, dict):
            raise ValueError("Prediction result is not a dictionary")
        
        if 'score' not in result or 'features' not in result:
            raise ValueError("Prediction result missing required fields")
        
        # Ensure score is valid
        score = result.get('score', 5.0)
        if not isinstance(score, (int, float)) or score < 1 or score > 10:
            print(f"⚠️  Invalid score {score}, clamping to 1-10 range", file=sys.stderr, flush=True)
            score = max(1.0, min(10.0, float(score)))
            result['score'] = score
        
        response = {
            'id': request_id,
            'result': result,
            'error': None
        }
        
    except json.JSONDecodeError as e:
        response = {
            'id': request_id,
            'result': None,
            'error': f"Invalid JSON in lesson_plan: {str(e)}"
        }
    
    except Exception as e:
        response = {
            'id': request_id,
            'result': None,
            'error': f"{type(e).__name__}: {str(e)}",
            'traceback': traceback.format_exc()
        }
    
    return response

def main():
    """Main event loop for persistent predictions"""
    initialize()
    
    # Keep process alive - don't exit on EOF
    import select
    
    try:
        while True:
            # Use select for non-blocking stdin reading
            # On Windows, select only works with sockets, so we fall back to regular stdin
            try:
                line = sys.stdin.readline()
                if not line:
                    # EOF detected, but keep process alive (wait a bit and retry)
                    import time
                    time.sleep(0.1)
                    continue
                
                line = line.strip()
                if not line:
                    continue
                
                try:
                    request_data = json.loads(line)
                    response = handle_request(request_data)
                    print(json.dumps(response, ensure_ascii=True), flush=True)
                    
                except json.JSONDecodeError as e:
                    error_response = {
                        'id': None,
                        'result': None,
                        'error': f'Invalid JSON request: {str(e)}'
                    }
                    print(json.dumps(error_response, ensure_ascii=True), flush=True)
                    
                except Exception as e:
                    error_response = {
                        'id': None,
                        'result': None,
                        'error': f'Unexpected error: {str(e)}',
                        'traceback': traceback.format_exc()
                    }
                    print(json.dumps(error_response, ensure_ascii=True), flush=True)
                    
            except KeyboardInterrupt:
                print("Shutting down gracefully...", file=sys.stderr, flush=True)
                sys.exit(0)
            except Exception as e:
                print(f"Error reading input: {e}", file=sys.stderr, flush=True)
                import time
                time.sleep(0.1)
                
    except KeyboardInterrupt:
        print("Shutting down...", file=sys.stderr, flush=True)
        sys.exit(0)

if __name__ == "__main__":
    main()
