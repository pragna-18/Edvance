"""
Complete Setup Script for Kaggle-Based ML Model Training
Steps:
1. Install kaggle package
2. Download 10 education datasets from Kaggle
3. Process and consolidate datasets
4. Train model on Kaggle data
"""

import subprocess
import sys
from pathlib import Path

def run_command(cmd, description):
    """Run a command and handle errors"""
    print(f"\n{'='*60}")
    print(f"📌 {description}")
    print(f"{'='*60}\n")
    
    try:
        result = subprocess.run(cmd, shell=True, capture_output=False, text=True)
        if result.returncode != 0:
            print(f"\n❌ Error during: {description}")
            return False
        return True
    except Exception as e:
        print(f"\n❌ Exception: {str(e)}")
        return False

def main():
    """Execute complete setup pipeline"""
    print("\n" + "="*60)
    print("🎓 KAGGLE ML MODEL TRAINING - COMPLETE SETUP")
    print("="*60)
    
    ml_dir = Path(__file__).parent
    
    # Step 1: Install requirements
    print("\n📦 Step 1: Installing Python packages...")
    if not run_command(
        f"cd \"{ml_dir}\" && pip install -r requirements.txt",
        "Installing packages from requirements.txt"
    ):
        print("\n⚠️  Warning: Some packages may not have installed correctly")
    
    # Step 2: Download Kaggle datasets
    print("\n\n📥 Step 2: Downloading 10 education datasets from Kaggle...")
    print("\n⚠️  IMPORTANT: You need Kaggle API credentials!")
    print("   If you haven't set them up yet:")
    print("   1. Go to https://www.kaggle.com/settings/account")
    print("   2. Click 'Create New Token'")
    print("   3. Save kaggle.json to ~/.kaggle/")
    print("   4. Run: chmod 600 ~/.kaggle/kaggle.json (Mac/Linux)")
    
    response = input("\n✅ Have you set up Kaggle credentials? (yes/no): ").strip().lower()
    
    if response in ['yes', 'y']:
        if not run_command(
            f"cd \"{ml_dir}\" && python download_kaggle_datasets.py",
            "Downloading datasets from Kaggle"
        ):
            print("\n⚠️  Download failed. Check your Kaggle credentials.")
            print("   Run: python download_kaggle_datasets.py")
            return
    else:
        print("\n⏳ Skipping dataset download. Set up credentials and run:")
        print(f"   python download_kaggle_datasets.py")
        return
    
    # Step 3: Process datasets
    print("\n\n🔄 Step 3: Processing and consolidating datasets...")
    if not run_command(
        f"cd \"{ml_dir}\" && python load_kaggle_datasets.py",
        "Processing Kaggle datasets into training format"
    ):
        print("\n❌ Processing failed!")
        return
    
    # Step 4: Train model
    print("\n\n🤖 Step 4: Training model on Kaggle data...")
    if not run_command(
        f"cd \"{ml_dir}\" && python train_model.py",
        "Training machine learning model"
    ):
        print("\n❌ Training failed!")
        return
    
    # Success message
    print("\n" + "="*60)
    print("✅ COMPLETE SETUP FINISHED!")
    print("="*60)
    print("\n🎉 Your ML model has been trained on 10 Kaggle datasets!")
    print("\n📊 Model saved to: models/health_score_model.pkl")
    print("📋 Metadata saved to: models/model_metadata.json")
    print("📈 Visualizations saved to: models/")
    print("\n🚀 Ready to use with your backend!")

if __name__ == "__main__":
    main()
