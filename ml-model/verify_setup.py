"""
Verification Checklist for Kaggle ML Model Integration
Run this script to verify everything is set up correctly
"""

import os
import sys
from pathlib import Path
import subprocess

def check_python_version():
    """Check Python version"""
    print("📋 Checking Python version...")
    try:
        version = sys.version_info
        if version.major >= 3 and version.minor >= 8:
            print(f"   ✅ Python {version.major}.{version.minor}.{version.micro}")
            return True
        else:
            print(f"   ❌ Python {version.major}.{version.minor} (need 3.8+)")
            return False
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return False

def check_kaggle_credentials():
    """Check if Kaggle API credentials exist"""
    print("\n📋 Checking Kaggle credentials...")
    kaggle_json = Path.home() / '.kaggle' / 'kaggle.json'
    
    if kaggle_json.exists():
        print(f"   ✅ Found: {kaggle_json}")
        return True
    else:
        print(f"   ❌ Not found: {kaggle_json}")
        print("   ⏳ Setup: https://www.kaggle.com/settings/account → Create New Token")
        return False

def check_packages():
    """Check if required packages are installed"""
    print("\n📋 Checking Python packages...")
    
    required = {
        'pandas': '2.0.3',
        'numpy': '1.24.3',
        'scikit-learn': '1.3.0',
        'kaggle': '1.5.13',
        'joblib': '1.3.1'
    }
    
    all_ok = True
    for package, version in required.items():
        try:
            mod = __import__(package)
            installed_version = getattr(mod, '__version__', 'unknown')
            print(f"   ✅ {package}: {installed_version}")
        except ImportError:
            print(f"   ❌ {package}: NOT INSTALLED")
            all_ok = False
    
    return all_ok

def check_ml_directory():
    """Check if ml-model directory exists"""
    print("\n📋 Checking ml-model directory...")
    ml_dir = Path(__file__).parent
    
    if ml_dir.exists():
        print(f"   ✅ Found: {ml_dir}")
        return True
    else:
        print(f"   ❌ Not found: {ml_dir}")
        return False

def check_scripts():
    """Check if all required scripts exist"""
    print("\n📋 Checking required scripts...")
    ml_dir = Path(__file__).parent
    
    scripts = [
        'download_kaggle_datasets.py',
        'load_kaggle_datasets.py',
        'train_model.py',
        'predict.py'
    ]
    
    all_ok = True
    for script in scripts:
        script_path = ml_dir / script
        if script_path.exists():
            print(f"   ✅ {script}")
        else:
            print(f"   ❌ {script}: NOT FOUND")
            all_ok = False
    
    return all_ok

def check_requirements_updated():
    """Check if requirements.txt includes kaggle"""
    print("\n📋 Checking requirements.txt...")
    ml_dir = Path(__file__).parent
    req_file = ml_dir / 'requirements.txt'
    
    try:
        with open(req_file, 'r') as f:
            content = f.read()
            if 'kaggle' in content:
                print(f"   ✅ kaggle included in requirements.txt")
                return True
            else:
                print(f"   ❌ kaggle NOT in requirements.txt")
                return False
    except Exception as e:
        print(f"   ❌ Error reading requirements.txt: {str(e)}")
        return False

def check_datasets_downloaded():
    """Check if Kaggle datasets are downloaded"""
    print("\n📋 Checking downloaded datasets...")
    ml_dir = Path(__file__).parent
    data_dir = ml_dir / 'data' / 'kaggle_datasets'
    
    if data_dir.exists():
        csv_files = list(data_dir.glob('**/*.csv'))
        if csv_files:
            print(f"   ✅ Found {len(csv_files)} CSV files")
            for csv in csv_files[:5]:
                print(f"      - {csv.name}")
            if len(csv_files) > 5:
                print(f"      ... and {len(csv_files) - 5} more")
            return len(csv_files) >= 10
        else:
            print(f"   ⚠️  Directory exists but no CSV files")
            print(f"   ⏳ Run: python download_kaggle_datasets.py")
            return False
    else:
        print(f"   ⚠️  Datasets not downloaded yet")
        print(f"   ⏳ Run: python download_kaggle_datasets.py")
        return False

def check_training_data():
    """Check if training_data.csv exists"""
    print("\n📋 Checking training data...")
    ml_dir = Path(__file__).parent
    training_file = ml_dir / 'data' / 'training_data.csv'
    
    if training_file.exists():
        size_mb = training_file.stat().st_size / (1024 * 1024)
        print(f"   ✅ Found: training_data.csv ({size_mb:.2f} MB)")
        
        # Check row count
        try:
            import pandas as pd
            df = pd.read_csv(training_file)
            print(f"   ✅ Rows: {len(df)}, Columns: {len(df.columns)}")
            return len(df) >= 100
        except Exception as e:
            print(f"   ⚠️  Error reading file: {str(e)}")
            return False
    else:
        print(f"   ⚠️  training_data.csv not found")
        print(f"   ⏳ Run: python load_kaggle_datasets.py")
        return False

def check_trained_model():
    """Check if model is trained"""
    print("\n📋 Checking trained model...")
    ml_dir = Path(__file__).parent
    model_file = ml_dir / 'models' / 'health_score_model.pkl'
    
    if model_file.exists():
        size_mb = model_file.stat().st_size / (1024 * 1024)
        print(f"   ✅ Found: health_score_model.pkl ({size_mb:.2f} MB)")
        return True
    else:
        print(f"   ⚠️  Model not trained yet")
        print(f"   ⏳ Run: python train_model.py")
        return False

def check_metadata():
    """Check if model metadata exists"""
    print("\n📋 Checking model metadata...")
    ml_dir = Path(__file__).parent
    metadata_file = ml_dir / 'models' / 'model_metadata.json'
    
    if metadata_file.exists():
        print(f"   ✅ Found: model_metadata.json")
        
        try:
            import json
            with open(metadata_file, 'r') as f:
                data = json.load(f)
                if 'metrics' in data:
                    metrics = data['metrics']
                    print(f"   ✅ R² Score: {metrics.get('r2', 'N/A'):.4f}")
                    print(f"   ✅ RMSE: {metrics.get('rmse', 'N/A'):.4f}")
                    return True
        except Exception as e:
            print(f"   ⚠️  Error reading metadata: {str(e)}")
            return False
    else:
        print(f"   ⚠️  Metadata not found")
        return False

def main():
    """Run all checks"""
    print("\n" + "="*60)
    print("🔍 KAGGLE ML MODEL INTEGRATION - VERIFICATION")
    print("="*60)
    
    checks = {
        'Python Version': check_python_version,
        'Kaggle Credentials': check_kaggle_credentials,
        'Python Packages': check_packages,
        'ML Directory': check_ml_directory,
        'Required Scripts': check_scripts,
        'Requirements Updated': check_requirements_updated,
        'Datasets Downloaded': check_datasets_downloaded,
        'Training Data': check_training_data,
        'Trained Model': check_trained_model,
        'Model Metadata': check_metadata,
    }
    
    results = {}
    for check_name, check_func in checks.items():
        try:
            results[check_name] = check_func()
        except Exception as e:
            print(f"   ❌ Unexpected error: {str(e)}")
            results[check_name] = False
    
    # Summary
    print("\n" + "="*60)
    print("📊 SUMMARY")
    print("="*60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    print(f"\n✅ Passed: {passed}/{total}")
    
    for check_name, result in results.items():
        status = "✅" if result else "❌"
        print(f"{status} {check_name}")
    
    # Recommendations
    print("\n" + "="*60)
    print("📋 NEXT STEPS")
    print("="*60)
    
    if not results['Kaggle Credentials']:
        print("\n1. Get Kaggle credentials:")
        print("   - Go to https://www.kaggle.com/settings/account")
        print("   - Click 'Create New Token'")
        print("   - Save kaggle.json to ~/.kaggle/")
    
    if not results['Python Packages']:
        print("\n1. Install packages:")
        print("   pip install -r requirements.txt")
    
    if not results['Datasets Downloaded']:
        print("\n2. Download datasets:")
        print("   python download_kaggle_datasets.py")
    
    if not results['Training Data']:
        print("\n3. Process datasets:")
        print("   python load_kaggle_datasets.py")
    
    if not results['Trained Model']:
        print("\n4. Train model:")
        print("   python train_model.py")
    
    if all(results.values()):
        print("\n" + "="*60)
        print("🎉 ALL CHECKS PASSED!")
        print("="*60)
        print("\n✨ Your ML model is ready!")
        print("   Backend automatically uses: models/health_score_model.pkl")
        print("   Start server: npm run dev")
    
    print()

if __name__ == "__main__":
    main()
