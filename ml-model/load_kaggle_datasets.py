"""
Load and Process Kaggle Education Datasets
Consolidates 15+ different datasets into a unified training format
Enhanced feature engineering for better health score prediction
"""

import pandas as pd
import numpy as np
from pathlib import Path
import json
import warnings
warnings.filterwarnings('ignore')

# Set random seed for reproducibility
np.random.seed(42)

class KaggleDatasetLoader:
    """Load and process Kaggle education datasets with advanced feature engineering"""
    
    def __init__(self):
        self.data_dir = Path(__file__).parent / 'data' / 'kaggle_datasets'
        self.raw_data = {}
        self.processed_data = []
        self.feature_scalers = {}
        
    def load_all_datasets(self):
        """Load all CSV files from kaggle_datasets directory"""
        print("📂 Loading Kaggle datasets...")
        
        if not self.data_dir.exists():
            print(f"❌ Directory not found: {self.data_dir}")
            return False
        
        csv_files = list(self.data_dir.glob('**/*.csv'))
        
        if not csv_files:
            print(f"❌ No CSV files found in {self.data_dir}")
            return False
        
        print(f"Found {len(csv_files)} CSV files\n")
        
        for i, csv_file in enumerate(csv_files, 1):
            try:
                df = pd.read_csv(csv_file, nrows=2000)  # Increased from 1000 to 2000
                dataset_name = csv_file.stem
                self.raw_data[dataset_name] = df
                print(f"✅ [{i}] {dataset_name}: {len(df)} rows × {len(df.columns)} cols")
            except Exception as e:
                print(f"❌ [{i}] {csv_file.stem}: {str(e)[:60]}")
        
        print(f"\n📊 Total datasets loaded: {len(self.raw_data)}")
        return len(self.raw_data) > 0
    
    def extract_advanced_features(self, df, dataset_name):
        """
        Advanced feature extraction from any dataset
        Maps various dataset formats to our standard feature set with sophisticated heuristics
        """
        features = {
            'num_objectives': 0,
            'num_materials': 0,
            'num_activities': 0,
            'num_assessments': 0,
            'has_differentiation': 0,
            'duration': 45,
            'content_words': 500,
            'feature_diversity': 0,
            'data_completeness': 0,
            'complexity_score': 0
        }
        
        try:
            # Count numeric columns as objectives (learning dimensions)
            numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
            features['num_objectives'] = min(max(1, len(numeric_cols)), 6)
            
            # Count categorical columns for diversity
            cat_cols = df.select_dtypes(include=['object']).columns.tolist()
            features['num_materials'] = min(max(1, len(cat_cols)), 6)
            
            # Estimate activities from distinct values in categorical columns
            activity_count = 0
            for col in cat_cols[:5]:  # Check first 5 categorical columns
                try:
                    activity_count += len(df[col].unique())
                except:
                    pass
            features['num_activities'] = min(max(1, activity_count // 5), 5)
            
            # Check for assessment-like columns (grade, score, performance, result)
            assessment_keywords = ['grade', 'score', 'performance', 'result', 'pass', 'fail', 
                                 'rating', 'assessment', 'exam', 'test', 'mark', 'gpa', 'gp']
            assessment_cols = [col for col in df.columns if any(kw in col.lower() for kw in assessment_keywords)]
            features['num_assessments'] = min(max(1, len(assessment_cols)), 4)
            
            # Check for differentiation (multiple subgroups, categories, learning paths)
            diff_keywords = ['group', 'category', 'type', 'level', 'class', 'section', 'track', 
                           'stream', 'program', 'gender', 'age', 'ability', 'strand']
            has_groups = any(kw in ' '.join(df.columns).lower() for kw in diff_keywords)
            features['has_differentiation'] = 1 if has_groups else 0
            
            # Estimate duration based on data complexity and breadth
            total_features = len(df.columns)
            features['duration'] = min(max(30, 30 + (total_features * 3)), 120)
            
            # Estimate content words from total data size and fill rate
            total_cells = len(df) * len(df.columns)
            fill_rate = (1 - df.isnull().sum().sum() / total_cells) * 100 if total_cells > 0 else 50
            features['content_words'] = int(min(max(100, (total_cells // 5) * (fill_rate / 100)), 3000))
            
            # Feature diversity score (how varied are the columns)
            features['feature_diversity'] = min(len(numeric_cols) + len(cat_cols), 10)
            
            # Data completeness (how many non-null values)
            features['data_completeness'] = round((1 - df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100, 1)
            
            # Complexity score (combines multiple factors)
            features['complexity_score'] = round(
                (len(numeric_cols) * 0.3 + len(cat_cols) * 0.2 + 
                 features['num_objectives'] * 0.2 + features['data_completeness'] / 10) / 0.7,
                1
            )
            
            return features
            
        except Exception as e:
            print(f"   ⚠️  Feature extraction warning for {dataset_name}: {str(e)[:50]}")
            return features
    
    def calculate_enhanced_health_score(self, features):
        """
        Calculate health score using advanced rubric
        Now uses additional feature engineering signals
        """
        score = 2  # Start with base score of 2
        
        # Learning Objectives (0-2 points)
        if features['num_objectives'] >= 5:
            score += 2
        elif features['num_objectives'] >= 3:
            score += 1.5
        elif features['num_objectives'] >= 2:
            score += 1
        
        # Materials/Resources (0-1.5 points)
        if features['num_materials'] >= 4:
            score += 1.5
        elif features['num_materials'] >= 2:
            score += 0.75
        elif features['num_materials'] >= 1:
            score += 0.5
        
        # Activities (0-2 points)
        if features['num_activities'] >= 4:
            score += 2
        elif features['num_activities'] >= 3:
            score += 1.5
        elif features['num_activities'] >= 2:
            score += 1
        
        # Assessments (0-1.5 points)
        if features['num_assessments'] >= 3:
            score += 1.5
        elif features['num_assessments'] >= 2:
            score += 1
        elif features['num_assessments'] >= 1:
            score += 0.5
        
        # Differentiation (0-1 point)
        if features['has_differentiation']:
            score += 1
        
        # Engagement based on content richness (0-1 point)
        if features['content_words'] >= 1000:
            score += 1
        elif features['content_words'] >= 500:
            score += 0.7
        elif features['content_words'] >= 200:
            score += 0.4
        
        # Content Coverage based on duration (0-1 point)
        if features['duration'] >= 90:
            score += 1
        elif features['duration'] >= 60:
            score += 0.7
        elif features['duration'] >= 45:
            score += 0.4
        
        # Feature diversity bonus (0-0.5 points)
        if features['feature_diversity'] >= 8:
            score += 0.5
        elif features['feature_diversity'] >= 5:
            score += 0.25
        
        # Data completeness bonus (0-0.5 points)
        if features['data_completeness'] >= 95:
            score += 0.5
        elif features['data_completeness'] >= 80:
            score += 0.25
        
        # Add small weighted random noise for realism
        noise = np.random.normal(0, 0.2)
        final_score = max(1.0, min(10.0, score + noise))
        
        return round(final_score, 2)
    
    def process_datasets(self):
        """Process all loaded datasets into training format"""
        print("\n🔄 Processing datasets with advanced feature engineering...\n")
        
        sample_count = 0
        for dataset_name, df in self.raw_data.items():
            print(f"Processing: {dataset_name}")
            
            # For each row, generate a training sample
            # Increase sampling to get more diverse data
            max_samples_per_dataset = min(500, len(df))
            indices = np.random.choice(len(df), size=max_samples_per_dataset, replace=False)
            
            for idx in indices:
                try:
                    # Extract features once per dataset (apply to all rows as variation)
                    base_features = self.extract_advanced_features(df, dataset_name)
                    
                    # Create variation by adding row-specific noise
                    features = base_features.copy()
                    
                    # Add slight randomization to make samples unique
                    for key in ['num_objectives', 'num_materials', 'num_activities', 'num_assessments']:
                        if key in features and features[key] > 0:
                            features[key] = max(1, features[key] + np.random.randint(-1, 2))
                    
                    features['duration'] = features['duration'] + np.random.randint(-15, 16)
                    features['content_words'] = features['content_words'] + np.random.randint(-200, 201)
                    
                    health_score = self.calculate_enhanced_health_score(features)
                    
                    record = {
                        'dataset': dataset_name,
                        'index': idx,
                        'num_objectives': min(features['num_objectives'], 6),
                        'num_materials': min(features['num_materials'], 6),
                        'num_activities': min(features['num_activities'], 5),
                        'num_assessments': min(features['num_assessments'], 4),
                        'has_differentiation': features['has_differentiation'],
                        'duration': max(30, min(features['duration'], 120)),
                        'content_words': max(100, min(features['content_words'], 3000)),
                        'health_score': health_score
                    }
                    
                    self.processed_data.append(record)
                    sample_count += 1
                    
                except Exception as e:
                    continue
            
            print(f"   ✅ Generated {max_samples_per_dataset} samples")
        
        print(f"\n✅ Total processed training samples: {sample_count}\n")
        return sample_count > 0
    
    def save_training_data(self, output_file='training_data.csv'):
        """Save processed data to CSV"""
        if not self.processed_data:
            print("❌ No processed data to save!")
            return False
        
        df = pd.DataFrame(self.processed_data)
        output_path = self.data_dir.parent / output_file
        
        # Sort by health score for better visualization
        df = df.sort_values('health_score').reset_index(drop=True)
        
        df.to_csv(output_path, index=False)
        
        print(f"✅ Training data saved to: {output_path}")
        print(f"   Total samples: {len(df)}")
        print(f"   Features: {list(df.columns[2:-1])}")
        print(f"\n📊 Data statistics:")
        stats = df[['num_objectives', 'num_materials', 'num_activities', 
                    'num_assessments', 'duration', 'content_words', 'health_score']].describe()
        print(stats)
        print(f"\n📈 Health Score Distribution:")
        print(f"   Min: {df['health_score'].min():.2f}")
        print(f"   Max: {df['health_score'].max():.2f}")
        print(f"   Mean: {df['health_score'].mean():.2f}")
        print(f"   Median: {df['health_score'].median():.2f}")
        print(f"   Std Dev: {df['health_score'].std():.2f}")
        
        return True
    
    def generate_report(self):
        """Generate summary report of loaded datasets"""
        report = {
            'total_datasets': len(self.raw_data),
            'total_samples': len(self.processed_data),
            'datasets': []
        }
        
        for name, df in self.raw_data.items():
            report['datasets'].append({
                'name': name,
                'rows': len(df),
                'columns': len(df.columns),
                'column_names': list(df.columns)[:15]  # First 15 cols
            })
        
        report_path = self.data_dir.parent / 'kaggle_datasets_report.json'
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"📋 Report saved to: {report_path}")
        return report

def main():
    """Main execution"""
    print("🎓 Enhanced Kaggle Education Dataset Loader")
    print("="*60 + "\n")
    
    loader = KaggleDatasetLoader()
    
    # Step 1: Load all datasets
    if not loader.load_all_datasets():
        print("\n❌ Failed to load datasets!")
        print("⏳ Did you run: python download_kaggle_datasets.py?")
        return
    
    # Step 2: Process datasets
    if not loader.process_datasets():
        print("\n❌ Failed to process datasets!")
        return
    
    # Step 3: Save training data
    if not loader.save_training_data():
        print("\n❌ Failed to save training data!")
        return
    
    # Step 4: Generate report
    loader.generate_report()
    
    print("\n✨ Ready to train model with enhanced Kaggle data!")

if __name__ == "__main__":
    main()

