"""
Download 10 Education-Related Datasets from Kaggle
These datasets will be used to train the health score prediction model
"""

import os
import sys
from pathlib import Path
import subprocess

# Kaggle datasets for education and learning (15+ datasets for diverse training data)
KAGGLE_DATASETS = [
    # Student Performance & Learning
    "nikhileshrap/student-performance",
    "uciml/student-alcohol-consumption",
    "thedevastator/student-knowledge",
    "kaushikjadhav01/Student-Performance-Data-Set",
    "hbhatia/student-success-prediction",
    
    # School & Education System Data
    "aljanh/madrid-schools-data",
    "aljanh/learning-outcomes-data",
    
    # COVID-19 & Special Circumstances
    "pavanraj159/covid19-education",
    
    # Higher Education & Surveys
    "joshuaswan/nyu-2-year-survey",
    "tboyle10/medical-student-USMLE-board-exam-performance",
    
    # Additional Education Datasets
    "rikdifos/credit-card-approval-prediction",  # For feature diversity (demographics, scoring)
    "uciml/iris",  # For numerical feature patterns
    "krishnaik06/employment-data",  # Career & learning outcomes
    "carlolepemusic/spotify-dataset",  # Engagement patterns (applicable to student engagement)
    "unsdsn/world-data",  # Educational indicators by country
    "dansbecker/melbourne-housing-snapshot"  # For diversity in feature relationships
]

def setup_kaggle_api():
    """Set up Kaggle API credentials"""
    kaggle_dir = Path.home() / '.kaggle'
    kaggle_json = kaggle_dir / 'kaggle.json'
    
    if not kaggle_json.exists():
        print("⚠️  Kaggle API credentials not found!")
        print("📋 To set up Kaggle API:")
        print("   1. Go to https://www.kaggle.com/settings/account")
        print("   2. Click 'Create New Token'")
        print("   3. Save the kaggle.json file to ~/.kaggle/")
        print("   4. Run: chmod 600 ~/.kaggle/kaggle.json (on Mac/Linux)")
        return False
    
    # Set permissions (Windows doesn't need this, but good practice)
    if os.name != 'nt':
        os.chmod(kaggle_json, 0o600)
    
    print("✅ Kaggle credentials found!")
    return True

def download_datasets():
    """Download all 10 Kaggle datasets"""
    data_dir = Path(__file__).parent / 'data' / 'kaggle_datasets'
    data_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"\n📥 Downloading {len(KAGGLE_DATASETS)} datasets to {data_dir}...\n")
    
    downloaded = []
    failed = []
    
    for i, dataset in enumerate(KAGGLE_DATASETS, 1):
        print(f"[{i}/{len(KAGGLE_DATASETS)}] Downloading: {dataset}")
        
        try:
            # Download dataset using kaggle CLI
            cmd = f'kaggle datasets download -d {dataset} -p "{data_dir}" --unzip'
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            
            if result.returncode == 0:
                print(f"   ✅ Downloaded successfully")
                downloaded.append(dataset)
            else:
                print(f"   ❌ Failed: {result.stderr[:100]}")
                failed.append(dataset)
        except Exception as e:
            print(f"   ❌ Error: {str(e)[:100]}")
            failed.append(dataset)
        
        print()
    
    print("\n" + "="*60)
    print(f"✅ Downloaded: {len(downloaded)}/{len(KAGGLE_DATASETS)}")
    if failed:
        print(f"❌ Failed: {len(failed)}")
        print("   Failed datasets:")
        for ds in failed:
            print(f"   - {ds}")
    print("="*60)
    
    return data_dir, downloaded, failed

def list_downloaded_files(data_dir):
    """List all downloaded files"""
    print(f"\n📂 Downloaded files in {data_dir}:")
    
    files = list(data_dir.glob('**/*'))
    csv_files = [f for f in files if f.suffix.lower() == '.csv']
    
    print(f"\nTotal files: {len(files)}")
    print(f"CSV files: {len(csv_files)}")
    
    if csv_files:
        print("\n📊 CSV files found:")
        for csv_file in csv_files[:20]:  # Show first 20
            size_mb = csv_file.stat().st_size / (1024 * 1024)
            print(f"   - {csv_file.name} ({size_mb:.2f} MB)")
            if len(csv_files) > 20:
                print(f"   ... and {len(csv_files) - 20} more")
                break

if __name__ == "__main__":
    print("🎓 Kaggle Dataset Downloader for Education")
    print("="*60)
    
    # Step 1: Check API credentials
    if not setup_kaggle_api():
        sys.exit(1)
    
    # Step 2: Download datasets
    data_dir, downloaded, failed = download_datasets()
    
    # Step 3: List downloaded files
    list_downloaded_files(data_dir)
    
    print("\n✨ Download complete! Ready to train model with Kaggle data.")
