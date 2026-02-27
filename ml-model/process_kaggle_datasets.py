"""
Process and combine 10 Kaggle education datasets into training data
"""

import pandas as pd
import numpy as np
from pathlib import Path
import os

class KaggleDataProcessor:
    def __init__(self, raw_data_dir="data/kaggle_raw", output_dir="data"):
        self.raw_data_dir = Path(raw_data_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.combined_data = []
        
    def find_csv_files(self):
        """Find all CSV files in raw data directory"""
        csv_files = list(self.raw_data_dir.glob("**/*.csv"))
        print(f"📊 Found {len(csv_files)} CSV files in {self.raw_data_dir}")
        return csv_files[:30]  # Process first 30 CSV files
    
    def extract_features(self, df, dataset_name):
        """Extract or engineer features from Kaggle dataset"""
        features = []
        
        try:
            for idx, row in df.iterrows():
                feature_dict = {
                    'dataset': dataset_name,
                    'num_objectives': self._count_numeric(row),
                    'num_materials': self._count_text_fields(row),
                    'num_activities': self._count_columns(row),
                    'num_assessments': self._count_assessment_fields(row),
                    'has_differentiation': self._detect_differentiation(row),
                    'duration': self._extract_duration(row),
                    'content_words': self._count_words(row),
                }
                
                # Generate health score based on features
                feature_dict['health_score'] = self._calculate_health_score(feature_dict)
                features.append(feature_dict)
                
        except Exception as e:
            print(f"   ⚠️  Error processing {dataset_name}: {str(e)}")
            return []
        
        return features
    
    def _count_numeric(self, row):
        """Count numeric columns/features"""
        numeric_cols = row.select_dtypes(include=[np.number]).shape[0]
        return max(1, min(6, numeric_cols // 2))
    
    def _count_text_fields(self, row):
        """Count text/string fields"""
        text_cols = sum(1 for col in row.index if isinstance(row[col], str))
        return max(1, min(6, text_cols))
    
    def _count_columns(self, row):
        """Count total columns as activity proxy"""
        return max(1, min(5, len(row) // 3))
    
    def _count_assessment_fields(self, row):
        """Count assessment-like fields"""
        assessment_keywords = ['score', 'grade', 'pass', 'fail', 'result', 'mark', 'test']
        count = sum(1 for col in row.index if any(kw in str(col).lower() for kw in assessment_keywords))
        return max(1, min(4, count))
    
    def _detect_differentiation(self, row):
        """Detect differentiation (variation in data)"""
        if len(row) > 5:
            return 1 if np.std([v for v in row.values if isinstance(v, (int, float))]) > 0.5 else 0
        return 0
    
    def _extract_duration(self, row):
        """Extract duration from row"""
        duration_keywords = ['duration', 'time', 'hours', 'minutes']
        for col in row.index:
            if any(kw in str(col).lower() for kw in duration_keywords):
                val = row[col]
                if isinstance(val, (int, float)):
                    return max(30, min(90, int(val)))
        return np.random.randint(30, 91)
    
    def _count_words(self, row):
        """Count total words in row"""
        text = ' '.join(str(v) for v in row.values if isinstance(v, str))
        return max(100, min(2000, len(text.split())))
    
    def _calculate_health_score(self, features):
        """Calculate health score based on features (1-10 scale)"""
        score = 0
        
        # Objectives (0-2 points)
        score += min(2, features['num_objectives'] / 3)
        
        # Materials (0-2 points)
        score += min(2, features['num_materials'] / 3)
        
        # Activities (0-2 points)
        score += min(2, features['num_activities'] / 2.5)
        
        # Assessments (0-2 points)
        score += min(2, features['num_assessments'] / 2)
        
        # Differentiation (0-1 point)
        score += features['has_differentiation']
        
        # Duration (0-0.5 points)
        if 45 <= features['duration'] <= 60:
            score += 0.5
        
        # Content (0-0.5 points)
        if 500 <= features['content_words'] <= 1500:
            score += 0.5
        
        # Add noise for realism
        noise = np.random.normal(0, 0.3)
        final_score = max(1, min(10, score + noise))
        
        return round(final_score, 1)
    
    def process_dataset(self, csv_path, dataset_name):
        """Process a single CSV dataset"""
        try:
            print(f"\n   Processing: {csv_path.name}")
            
            # Read CSV
            df = pd.read_csv(csv_path, nrows=100)  # Limit to 100 rows per dataset
            
            if df.empty or len(df) < 5:
                print(f"      ⚠️  Skipped (insufficient data)")
                return []
            
            print(f"      Rows: {len(df)}, Columns: {len(df.columns)}")
            
            # Extract features
            features = self.extract_features(df, dataset_name)
            print(f"      ✅ Extracted {len(features)} samples")
            
            return features
            
        except Exception as e:
            print(f"      ❌ Error: {str(e)}")
            return []
    
    def process_all_datasets(self):
        """Process all CSV files from Kaggle"""
        print("\n🔄 Processing Kaggle datasets...")
        
        csv_files = self.find_csv_files()
        all_features = []
        processed_count = 0
        
        for csv_file in csv_files:
            dataset_name = csv_file.parent.name
            features = self.process_dataset(csv_file, dataset_name)
            
            if features:
                all_features.extend(features)
                processed_count += 1
            
            # Stop after processing from 10 unique datasets
            if processed_count >= 10:
                break
        
        print(f"\n✅ Processed {processed_count} datasets")
        print(f"📊 Total features extracted: {len(all_features)}")
        
        return all_features
    
    def save_training_data(self, features):
        """Save processed features as CSV"""
        if not features:
            print("❌ No features to save")
            return None
        
        df = pd.DataFrame(features)
        
        # Ensure health_score column exists
        if 'health_score' not in df.columns:
            df['health_score'] = df.apply(
                lambda row: self._calculate_health_score(row), axis=1
            )
        
        # Save to CSV
        output_path = self.output_dir / "training_data.csv"
        df.to_csv(output_path, index=False)
        
        print(f"\n💾 Saved training data:")
        print(f"   Path: {output_path}")
        print(f"   Shape: {df.shape[0]} rows × {df.shape[1]} columns")
        print(f"   Columns: {list(df.columns)}")
        print(f"\n📈 Data Summary:")
        print(df.describe())
        
        # Dataset distribution
        print(f"\n📊 Dataset Distribution:")
        if 'dataset' in df.columns:
            for dataset, count in df['dataset'].value_counts().items():
                print(f"   • {dataset}: {count} samples")
        
        return output_path


def main():
    """Main execution"""
    print("=" * 70)
    print("🚀 KAGGLE DATA PROCESSOR")
    print("=" * 70)
    
    processor = KaggleDataProcessor(
        raw_data_dir="data/kaggle_raw",
        output_dir="data"
    )
    
    # Check if raw data directory exists
    if not processor.raw_data_dir.exists():
        print(f"\n❌ Raw data directory not found: {processor.raw_data_dir}")
        print("   First run: download_kaggle_data.py to download datasets")
        return
    
    # Process all datasets
    features = processor.process_all_datasets()
    
    # Save training data
    if features:
        processor.save_training_data(features)
        print("\n" + "=" * 70)
        print("✅ PROCESSING COMPLETE!")
        print("=" * 70)
        print("\n📝 Next step: Run train_model.py to train with Kaggle data")
    else:
        print("\n❌ No data to process. Check if Kaggle datasets were downloaded correctly.")


if __name__ == "__main__":
    main()
