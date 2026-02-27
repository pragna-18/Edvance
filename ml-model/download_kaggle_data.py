"""
Download and process 10 education-related datasets from Kaggle
"""

import os
import pandas as pd
import numpy as np
from pathlib import Path
import zipfile
import shutil

# 10 Education-related Kaggle datasets
KAGGLE_DATASETS = [
    "nikhil7280/student-performance-data",
    "uciml/student-alcohol-consumption",
    "aljarah/xAPI-Edu-Data",
    "kwartler/online-course-reviews",
    "asegun/student-study-performance",
    "laowingkin/credit-card-default-data",
    "sumanthamandal/student-performance",
    "aadhavvignesh/student-performance-factors",
    "jackoge/student-dataset",
    "gpaulgill/student-success"
]

class KaggleDataDownloader:
    def __init__(self, data_dir="data"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        self.datasets = []
        
    def download_datasets(self):
        """Download all datasets from Kaggle"""
        print("🔄 Starting Kaggle dataset downloads...")
        print(f"📂 Saving to: {self.data_dir.absolute()}\n")
        
        try:
            from kaggle.api.kaggle_api_extended import KaggleApi
            
            # Authenticate with Kaggle API
            api = KaggleApi()
            api.authenticate()
            print("✅ Kaggle API authenticated\n")
            
            for idx, dataset in enumerate(KAGGLE_DATASETS, 1):
                dataset_name = dataset.split('/')[-1]
                dataset_dir = self.data_dir / dataset_name
                
                print(f"[{idx}/10] Downloading: {dataset}")
                print(f"        Destination: {dataset_dir}")
                
                try:
                    # Download dataset
                    api.dataset_download_files(dataset, path=dataset_dir, unzip=True)
                    print(f"        ✅ Downloaded\n")
                    self.datasets.append({
                        'name': dataset_name,
                        'full_name': dataset,
                        'path': dataset_dir
                    })
                except Exception as e:
                    print(f"        ⚠️  Error: {str(e)}\n")
                    continue
            
            print(f"✅ Downloaded {len(self.datasets)}/10 datasets")
            return self.datasets
            
        except ImportError:
            print("❌ Kaggle API not installed. Install with: pip install kaggle")
            print("   Also set up credentials: https://github.com/Kaggle/kaggle-api#installation")
            return []
    
    def list_downloaded_files(self):
        """List all downloaded CSV files"""
        print("\n📊 Downloaded dataset files:")
        csv_files = list(self.data_dir.glob("**/*.csv"))
        
        if not csv_files:
            print("   ❌ No CSV files found")
            return []
        
        for csv_file in sorted(csv_files)[:20]:  # Show first 20
            size_mb = csv_file.stat().st_size / (1024 * 1024)
            print(f"   • {csv_file.relative_to(self.data_dir)} ({size_mb:.2f} MB)")
        
        if len(csv_files) > 20:
            print(f"   ... and {len(csv_files) - 20} more files")
        
        return csv_files


def main():
    """Main execution"""
    print("=" * 70)
    print("🚀 KAGGLE DATASET DOWNLOADER")
    print("=" * 70)
    print()
    
    downloader = KaggleDataDownloader(data_dir="data/kaggle_raw")
    
    print("📋 Datasets to download:")
    for idx, dataset in enumerate(KAGGLE_DATASETS, 1):
        print(f"   {idx}. {dataset}")
    print()
    
    # Download
    downloaded = downloader.download_datasets()
    
    # List files
    csv_files = downloader.list_downloaded_files()
    
    print("\n" + "=" * 70)
    print(f"✅ DOWNLOAD COMPLETE! {len(downloaded)} datasets ready to process")
    print("=" * 70)
    print("\n📝 Next step: Run process_kaggle_datasets.py to prepare training data")


if __name__ == "__main__":
    main()
