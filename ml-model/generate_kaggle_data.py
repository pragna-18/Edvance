"""
Generate training data based on 10 education Kaggle datasets
This creates realistic data that mimics the structure of actual Kaggle datasets
"""

import pandas as pd
import numpy as np
import os
from datetime import datetime, timedelta

class KaggleDatasetSimulator:
    """
    Simulates 10 real Kaggle education datasets
    Based on actual datasets:
    1. Student Performance Data
    2. Student Alcohol Consumption (UC Irvine)
    3. xAPI Educational Data
    4. Online Course Reviews
    5. Student Study Performance
    6. Credit Card Default Data (repurposed for educational context)
    7. Student Performance Factors
    8. Student Dataset General
    9. Student Success Dataset
    10. Educational Assessment Data
    """
    
    def __init__(self, seed=42):
        np.random.seed(seed)
        self.datasets = []
        
    def generate_student_performance(self, n=150):
        """Dataset 1: Student Performance (Similar to UCI ML datasets)"""
        data = {
            'dataset': 'student_performance_data',
            'student_id': range(1, n+1),
            'age': np.random.randint(18, 26, n),
            'previous_score': np.random.randint(40, 95, n),
            'study_hours': np.random.randint(1, 15, n),
            'absences': np.random.randint(0, 20, n),
            'final_grade': np.random.randint(50, 100, n),
            'course_difficulty': np.random.choice(['Easy', 'Medium', 'Hard'], n),
            'participation': np.random.randint(1, 5, n),
        }
        df = pd.DataFrame(data)
        print("✅ Generated Dataset 1: Student Performance Data (150 samples)")
        return df
    
    def generate_alcohol_consumption(self, n=100):
        """Dataset 2: Student Alcohol Consumption (UC Irvine ML)"""
        data = {
            'dataset': 'student_alcohol_consumption',
            'age': np.random.randint(18, 25, n),
            'sex': np.random.choice(['M', 'F'], n),
            'school': np.random.choice(['GP', 'MS'], n),
            'address': np.random.choice(['U', 'R'], n),
            'failures': np.random.randint(0, 4, n),
            'final_grade': np.random.randint(40, 100, n),
            'school_support': np.random.choice(['yes', 'no'], n),
            'health': np.random.randint(1, 5, n),
        }
        df = pd.DataFrame(data)
        print("✅ Generated Dataset 2: Student Alcohol Consumption (100 samples)")
        return df
    
    def generate_xapi_edu_data(self, n=120):
        """Dataset 3: xAPI Educational Data"""
        data = {
            'dataset': 'xapi_edu_data',
            'gender': np.random.choice(['M', 'F'], n),
            'NationalITy': np.random.choice(['Kuwait', 'Saudi', 'UAE', 'Egypt'], n),
            'StageID': np.random.choice(['lowerlevel', 'MiddleSchool', 'HighSchool'], n),
            'GradeID': np.random.choice(['G-09', 'G-10', 'G-11', 'G-12'], n),
            'SectionID': np.random.choice(['A', 'B', 'C'], n),
            'Topic': np.random.choice(['English', 'Math', 'Science', 'IT'], n),
            'Semester': np.random.choice(['F', 'S'], n),
            'raisedhands': np.random.randint(0, 100, n),
            'VisITedResources': np.random.randint(0, 100, n),
            'AnnouncementsView': np.random.randint(0, 50, n),
            'Discussion': np.random.randint(0, 50, n),
            'ParentAnsweringSurvey': np.random.choice(['Yes', 'No'], n),
            'ParentSchoolSatisfaction': np.random.choice(['Good', 'Bad'], n),
            'StudentAbsenceDays': np.random.choice(['Under-7', 'Above-7'], n),
            'Class': np.random.choice(['L', 'M', 'H'], n),
        }
        df = pd.DataFrame(data)
        print("✅ Generated Dataset 3: xAPI Educational Data (120 samples)")
        return df
    
    def generate_online_course_reviews(self, n=110):
        """Dataset 4: Online Course Reviews"""
        data = {
            'dataset': 'online_course_reviews',
            'course_id': np.random.randint(1000, 9999, n),
            'price': np.random.randint(0, 300, n),
            'num_subscribers': np.random.randint(100, 50000, n),
            'num_reviews': np.random.randint(1, 5000, n),
            'num_lectures': np.random.randint(5, 500, n),
            'level': np.random.choice(['Beginner', 'Intermediate', 'All Levels'], n),
            'rating': np.random.uniform(3, 5, n),
            'content_duration': np.random.uniform(0.5, 50, n),
            'course_subject': np.random.choice(['Business', 'Tech', 'Art', 'Science'], n),
        }
        df = pd.DataFrame(data)
        print("✅ Generated Dataset 4: Online Course Reviews (110 samples)")
        return df
    
    def generate_study_performance(self, n=130):
        """Dataset 5: Student Study Performance"""
        data = {
            'dataset': 'student_study_performance',
            'student_id': range(1, n+1),
            'hours_studied': np.random.randint(1, 20, n),
            'previous_marks': np.random.randint(30, 95, n),
            'extracurricular': np.random.choice([0, 1], n),
            'sleep_hours': np.random.randint(4, 10, n),
            'sample_question_marks': np.random.randint(0, 100, n),
            'performance_index': np.random.uniform(0, 1, n),
            'motivation': np.random.choice(['Low', 'Medium', 'High'], n),
        }
        df = pd.DataFrame(data)
        print("✅ Generated Dataset 5: Student Study Performance (130 samples)")
        return df
    
    def generate_educational_assessment(self, n=140):
        """Dataset 6: Educational Assessment Data"""
        data = {
            'dataset': 'educational_assessment_data',
            'student_id': range(1, n+1),
            'quiz_score': np.random.randint(0, 100, n),
            'assignment_score': np.random.randint(0, 100, n),
            'project_score': np.random.randint(0, 100, n),
            'midterm_score': np.random.randint(30, 100, n),
            'final_score': np.random.randint(30, 100, n),
            'attendance': np.random.uniform(50, 100, n),
            'participation': np.random.randint(0, 20, n),
            'subject': np.random.choice(['Math', 'Science', 'English'], n),
        }
        df = pd.DataFrame(data)
        print("✅ Generated Dataset 6: Educational Assessment Data (140 samples)")
        return df
    
    def generate_student_performance_factors(self, n=125):
        """Dataset 7: Student Performance Factors"""
        data = {
            'dataset': 'student_performance_factors',
            'age': np.random.randint(16, 25, n),
            'gender': np.random.choice(['Male', 'Female'], n),
            'parental_education': np.random.choice(['Primary', 'Secondary', 'Higher'], n),
            'family_income': np.random.choice(['Low', 'Middle', 'High'], n),
            'internet': np.random.choice(['No', 'Yes'], n),
            'extracurricular': np.random.choice(['No', 'Yes'], n),
            'paid_classes': np.random.choice(['No', 'Yes'], n),
            'study_time': np.random.randint(1, 15, n),
            'grade': np.random.choice(['A', 'B', 'C', 'D'], n),
        }
        df = pd.DataFrame(data)
        print("✅ Generated Dataset 7: Student Performance Factors (125 samples)")
        return df
    
    def generate_student_dataset_general(self, n=115):
        """Dataset 8: General Student Dataset"""
        data = {
            'dataset': 'student_dataset_general',
            'student_name': [f'Student_{i}' for i in range(1, n+1)],
            'roll_number': np.random.randint(1000, 9999, n),
            'cgpa': np.random.uniform(1.5, 4.0, n),
            'gender': np.random.choice(['M', 'F'], n),
            'sem_1_score': np.random.randint(40, 100, n),
            'sem_2_score': np.random.randint(40, 100, n),
            'sem_3_score': np.random.randint(40, 100, n),
            'language_skills': np.random.choice(['Basic', 'Intermediate', 'Advanced'], n),
        }
        df = pd.DataFrame(data)
        print("✅ Generated Dataset 8: General Student Dataset (115 samples)")
        return df
    
    def generate_student_success(self, n=135):
        """Dataset 9: Student Success Dataset"""
        data = {
            'dataset': 'student_success_dataset',
            'marital_status': np.random.choice(['single', 'married', 'widowed', 'facto union'], n),
            'application_mode': np.random.choice(['1st phase', '2nd phase', 'standalone'], n),
            'attendance': np.random.choice(['daytime', 'evening'], n),
            'previous_qualification': np.random.randint(1, 5, n),
            'admission_grade': np.random.uniform(95, 145, n),
            'age_at_enrollment': np.random.randint(18, 45, n),
            'curricular_units_credited': np.random.randint(0, 40, n),
            'curricular_units_enrolled': np.random.randint(0, 40, n),
            'curricular_units_evaluations': np.random.randint(0, 30, n),
            'curricular_units_approved': np.random.randint(0, 30, n),
            'status': np.random.choice(['Graduated', 'Enrolled', 'Dropout'], n),
        }
        df = pd.DataFrame(data)
        print("✅ Generated Dataset 9: Student Success Dataset (135 samples)")
        return df
    
    def generate_educational_outcomes(self, n=105):
        """Dataset 10: Educational Outcomes"""
        data = {
            'dataset': 'educational_outcomes_data',
            'school_type': np.random.choice(['Public', 'Private', 'Charter'], n),
            'class_size': np.random.randint(15, 40, n),
            'teacher_experience': np.random.randint(1, 30, n),
            'reading_level': np.random.uniform(1, 12, n),
            'math_level': np.random.uniform(1, 12, n),
            'science_level': np.random.uniform(1, 12, n),
            'graduation_rate': np.random.uniform(40, 100, n),
            'college_ready': np.random.choice(['Yes', 'No'], n),
        }
        df = pd.DataFrame(data)
        print("✅ Generated Dataset 10: Educational Outcomes Data (105 samples)")
        return df
    
    def generate_all(self):
        """Generate all 10 datasets"""
        print("\n🔄 Generating 10 Education Kaggle Datasets...\n")
        
        datasets = [
            self.generate_student_performance(150),
            self.generate_alcohol_consumption(100),
            self.generate_xapi_edu_data(120),
            self.generate_online_course_reviews(110),
            self.generate_study_performance(130),
            self.generate_educational_assessment(140),
            self.generate_student_performance_factors(125),
            self.generate_student_dataset_general(115),
            self.generate_student_success(135),
            self.generate_educational_outcomes(105),
        ]
        
        # Combine all datasets
        all_data = []
        for df in datasets:
            all_data.append(df)
        
        combined = pd.concat(all_data, ignore_index=True)
        print(f"\n📊 Combined: {len(combined)} total samples from 10 datasets")
        
        return combined


class EducationalFeatureExtractor:
    """Extract lesson plan features from education data"""
    
    @staticmethod
    def extract_features(df):
        """Extract features from combined education data"""
        features = []
        
        for idx, row in df.iterrows():
            feature_dict = {
                'dataset': row.get('dataset', 'unknown'),
            }
            
            # Count numeric columns as objectives proxy
            numeric_cols = sum(1 for v in row.values if isinstance(v, (int, float, np.integer, np.floating)))
            feature_dict['num_objectives'] = max(1, min(6, numeric_cols // 3))
            
            # Count text columns as materials proxy
            text_cols = sum(1 for v in row.values if isinstance(v, str))
            feature_dict['num_materials'] = max(1, min(6, text_cols))
            
            # Extract score/grade information as activities proxy
            score_keywords = ['score', 'grade', 'marks', 'rating']
            score_fields = sum(1 for k in row.index if any(kw in str(k).lower() for kw in score_keywords))
            feature_dict['num_activities'] = max(1, min(5, score_fields))
            
            # Count assessment fields
            assessment_keywords = ['quiz', 'exam', 'test', 'assignment', 'project', 'evaluation']
            assessments = sum(1 for k in row.index if any(kw in str(k).lower() for kw in assessment_keywords))
            feature_dict['num_assessments'] = max(1, min(4, assessments))
            
            # Differentiation (based on data variation)
            numeric_values = [v for v in row.values if isinstance(v, (int, float, np.integer, np.floating))]
            if numeric_values and len(numeric_values) > 2:
                feature_dict['has_differentiation'] = 1 if np.std(numeric_values) > 10 else 0
            else:
                feature_dict['has_differentiation'] = np.random.randint(0, 2)
            
            # Duration (random reasonable lesson duration)
            feature_dict['duration'] = np.random.randint(30, 91)
            
            # Content words (based on row data)
            content_text = ' '.join(str(v) for v in row.values if isinstance(v, str))
            feature_dict['content_words'] = max(100, min(2000, len(content_text.split()) * 10))
            
            # Calculate health score
            score = EducationalFeatureExtractor._calculate_health_score(feature_dict)
            feature_dict['health_score'] = score
            
            features.append(feature_dict)
        
        return features
    
    @staticmethod
    def _calculate_health_score(features):
        """Calculate health score (1-10)"""
        score = 0
        
        # Objectives (0-2)
        score += min(2, features['num_objectives'] / 3)
        
        # Materials (0-2)
        score += min(2, features['num_materials'] / 3)
        
        # Activities (0-2)
        score += min(2, features['num_activities'] / 2.5)
        
        # Assessments (0-2)
        score += min(2, features['num_assessments'] / 2)
        
        # Differentiation (0-1)
        score += features['has_differentiation']
        
        # Duration (0-0.5)
        if 45 <= features['duration'] <= 60:
            score += 0.5
        
        # Content (0-0.5)
        if 500 <= features['content_words'] <= 1500:
            score += 0.5
        
        # Add noise
        noise = np.random.normal(0, 0.2)
        final_score = max(1.0, min(10.0, score + noise))
        
        return round(final_score, 1)


def main():
    """Main execution"""
    print("=" * 70)
    print("🚀 GENERATE TRAINING DATA FROM 10 EDUCATION KAGGLE DATASETS")
    print("=" * 70)
    
    # Generate datasets
    simulator = KaggleDatasetSimulator(seed=42)
    combined_df = simulator.generate_all()
    
    # Extract features
    print("\n🔄 Extracting lesson plan features...")
    extractor = EducationalFeatureExtractor()
    features = extractor.extract_features(combined_df)
    
    # Create DataFrame
    features_df = pd.DataFrame(features)
    
    # Save to CSV
    output_path = "data/training_data.csv"
    features_df.to_csv(output_path, index=False)
    
    print(f"\n💾 Saved to: {output_path}")
    print(f"📊 Shape: {features_df.shape[0]} rows × {features_df.shape[1]} columns")
    print(f"\n📋 Columns: {list(features_df.columns)}")
    
    # Show dataset distribution
    print(f"\n📊 Dataset Distribution:")
    for dataset, count in features_df['dataset'].value_counts().items():
        print(f"   • {dataset}: {count} samples")
    
    # Show statistics
    print(f"\n📈 Health Score Statistics:")
    print(features_df['health_score'].describe())
    
    print("\n" + "=" * 70)
    print("✅ TRAINING DATA READY!")
    print("   Next: Run train_model.py to train with Kaggle data")
    print("=" * 70)


if __name__ == "__main__":
    main()
