"""
Data Generator for Health Score Model Training
Generates synthetic training data with realistic lesson plan features and health scores
"""

import json
import random
import pandas as pd
import numpy as np
from datetime import datetime
import os

# Set random seed for reproducibility
random.seed(42)
np.random.seed(42)

class LessonPlanDataGenerator:
    """Generate synthetic lesson plan data for model training"""
    
    def __init__(self, num_samples=500):
        self.num_samples = num_samples
        self.subjects = [
            'Mathematics', 'Science', 'English', 'History', 'Geography',
            'Biology', 'Chemistry', 'Physics', 'Computer Science', 'Economics'
        ]
        self.grades = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
        
    def generate_objectives(self, count):
        """Generate learning objectives"""
        templates = [
            "Students will understand the concept of {}",
            "Learners will be able to analyze {}",
            "Students will apply knowledge of {} in practical scenarios",
            "Students will evaluate the importance of {}",
            "Learners will create new understanding of {}",
        ]
        
        topics = [
            "fractions", "photosynthesis", "Shakespeare", "French Revolution",
            "climate change", "nuclear reactions", "programming loops",
            "economic systems", "historical events", "geometric shapes",
            "cellular processes", "poetry analysis", "quantum mechanics"
        ]
        
        objectives = []
        for _ in range(count):
            template = random.choice(templates)
            topic = random.choice(topics)
            objectives.append(template.format(topic))
        
        return objectives
    
    def generate_materials(self, count):
        """Generate required materials list"""
        materials = [
            "Textbook", "Whiteboard", "Markers", "Projector", "Laptop",
            "Scientific Apparatus", "Charts", "Models", "Videos", "Audio Clips",
            "Worksheet", "Flashcards", "Manipulatives", "Lab Equipment"
        ]
        return random.sample(materials, min(count, len(materials)))
    
    def generate_activities(self, count):
        """Generate classroom activities"""
        activity_types = [
            "Group Discussion", "Individual Task", "Pair Work", "Hands-on Experiment",
            "Video Presentation", "Debate", "Quiz", "Brainstorming", "Role Play",
            "Project Work", "Case Study Analysis", "Problem Solving"
        ]
        
        activities = []
        for _ in range(count):
            activity = random.choice(activity_types)
            duration = random.randint(5, 30)
            activities.append(f"{activity} ({duration} mins)")
        
        return activities
    
    def generate_assessment_methods(self, count):
        """Generate assessment methods"""
        assessments = [
            "Formative Quiz", "Summative Test", "Project Submission",
            "Oral Presentation", "Group Project", "Written Assignment",
            "Practical Exam", "Peer Review", "Self Assessment", "Portfolio"
        ]
        return random.sample(assessments, min(count, len(assessments)))
    
    def generate_differentiation(self):
        """Generate differentiation strategies"""
        strategies = [
            "Tiered activities for different levels",
            "Flexible grouping based on learning needs",
            "Extended resources for advanced learners",
            "Simplified materials for struggling students",
            "Visual aids for all learning styles",
            "Adapted assessment options"
        ]
        return random.sample(strategies, random.randint(1, 4))
    
    def calculate_health_score(self, features_dict):
        """
        Calculate realistic health score based on features
        Returns score 1-10
        Score ranges:
        - 1-3: Very poor (minimal components)
        - 4-6: Average (some components)
        - 7-9: Good (well structured)
        - 9-10: Excellent (comprehensive)
        """
        score = 1.0  # Start from minimum
        
        # Learning objectives (0-2 points)
        num_objectives = features_dict['num_objectives']
        if num_objectives >= 5:
            score += 2.0
        elif num_objectives >= 4:
            score += 1.8
        elif num_objectives >= 3:
            score += 1.4
        elif num_objectives >= 2:
            score += 0.8
        elif num_objectives >= 1:
            score += 0.3
        
        # Materials (0-1.5 points)
        num_materials = features_dict['num_materials']
        if num_materials >= 5:
            score += 1.5
        elif num_materials >= 4:
            score += 1.2
        elif num_materials >= 3:
            score += 0.9
        elif num_materials >= 2:
            score += 0.5
        elif num_materials >= 1:
            score += 0.1
        
        # Activities (0-2 points)
        num_activities = features_dict['num_activities']
        if num_activities >= 5:
            score += 2.0
        elif num_activities >= 4:
            score += 1.6
        elif num_activities >= 3:
            score += 1.2
        elif num_activities >= 2:
            score += 0.7
        elif num_activities >= 1:
            score += 0.2
        
        # Assessment methods (0-2 points)
        num_assessments = features_dict['num_assessments']
        if num_assessments >= 4:
            score += 2.0
        elif num_assessments >= 3:
            score += 1.5
        elif num_assessments >= 2:
            score += 1.0
        elif num_assessments >= 1:
            score += 0.3
        
        # Differentiation (0-1.5 points)
        has_differentiation = features_dict['has_differentiation']
        if has_differentiation:
            score += 1.5
        else:
            score += 0.0
        
        # Engagement level - based on activity types (0-1)
        engagement_types = {'Group Discussion', 'Hands-on Experiment', 'Role Play', 'Project Work', 'Debate'}
        if any(activity_type in str(features_dict['activities']) for activity_type in engagement_types):
            score += 1.0
        else:
            score += 0.3
        
        # Content coverage - based on duration and word count (0-1)
        duration = features_dict['duration']
        content_words = features_dict.get('content_words', 500)
        content_density = content_words / max(1, duration)
        
        if 8 <= content_density <= 25:  # Good density
            score += 1.0
        elif 5 <= content_density <= 8 or 25 <= content_density <= 40:  # Acceptable
            score += 0.5
        elif duration >= 60:  # Enough time allocated
            score += 0.3
        else:
            score += 0.0
        
        # Add some realistic noise (but less than before)
        noise = random.gauss(0, 0.25)
        score += noise
        
        # Clamp to 1-10 range
        return max(1.0, min(10.0, round(score, 1)))
    
    def generate_lesson_plan(self):
        """Generate a single synthetic lesson plan"""
        num_objectives = random.randint(1, 6)
        num_materials = random.randint(1, 6)
        num_activities = random.randint(1, 5)
        num_assessments = random.randint(1, 4)
        duration = random.randint(30, 90)  # minutes
        has_differentiation = random.choice([True, False])
        
        objectives = self.generate_objectives(num_objectives)
        materials = self.generate_materials(num_materials)
        activities = self.generate_activities(num_activities)
        assessments = self.generate_assessment_methods(num_assessments)
        differentiation = self.generate_differentiation() if has_differentiation else []
        
        content_text = f"""
        Objectives: {' '.join(objectives)}
        Materials: {', '.join(materials)}
        Activities: {' '.join(activities)}
        Assessment: {', '.join(assessments)}
        Differentiation: {' '.join(differentiation)}
        """
        
        content_words = len(content_text.split())
        
        features_dict = {
            'num_objectives': num_objectives,
            'num_materials': num_materials,
            'num_activities': num_activities,
            'num_assessments': num_assessments,
            'has_differentiation': int(has_differentiation),
            'duration': duration,
            'content_words': content_words,
            'activities': activities,
        }
        
        health_score = self.calculate_health_score(features_dict)
        
        lesson_plan = {
            'id': f"plan_{datetime.now().timestamp()}_{random.randint(1000, 9999)}",
            'title': f"{random.choice(self.subjects)} Lesson - {random.choice(self.grades)}",
            'subject': random.choice(self.subjects),
            'grade': random.choice(self.grades),
            'topic': f"Topic {random.randint(1, 20)}",
            'duration': duration,
            'objectives': objectives,
            'materials': materials,
            'activities': activities,
            'assessments': assessments,
            'differentiation': differentiation,
            'content_complexity': 'high' if content_words > 500 else 'medium' if content_words > 200 else 'low',
            'engagement_level': 'high' if num_activities >= 3 else 'medium' if num_activities >= 2 else 'low',
        }
        
        return lesson_plan, features_dict, health_score
    
    def generate_dataset(self):
        """Generate complete dataset"""
        lessons = []
        features_list = []
        scores = []
        
        print(f"🔄 Generating {self.num_samples} synthetic lesson plans...")
        
        for i in range(self.num_samples):
            lesson, features, score = self.generate_lesson_plan()
            lessons.append(lesson)
            features_list.append(features)
            scores.append(score)
            
            if (i + 1) % 100 == 0:
                print(f"  ✓ Generated {i + 1}/{self.num_samples}")
        
        print(f"✅ Generated {len(lessons)} lesson plans successfully!")
        
        return lessons, features_list, scores
    
    def save_dataset(self, lessons, features_list, scores, output_dir='data'):
        """Save dataset to CSV and JSON"""
        os.makedirs(output_dir, exist_ok=True)
        
        # Create DataFrame
        df = pd.DataFrame(features_list)
        df['health_score'] = scores
        
        # Save to CSV
        csv_path = os.path.join(output_dir, 'training_data.csv')
        df.to_csv(csv_path, index=False)
        print(f"✅ Saved training data to {csv_path}")
        
        # Save raw lesson plans to JSON
        json_path = os.path.join(output_dir, 'lesson_plans.json')
        with open(json_path, 'w') as f:
            json.dump(lessons, f, indent=2)
        print(f"✅ Saved lesson plans to {json_path}")
        
        return df, csv_path


if __name__ == "__main__":
    # Generate dataset
    generator = LessonPlanDataGenerator(num_samples=500)
    lessons, features, scores = generator.generate_dataset()
    
    # Save dataset
    df, csv_path = generator.save_dataset(lessons, features, scores)
    
    # Display statistics
    print("\n📊 Dataset Statistics:")
    print(f"Total samples: {len(df)}")
    print(f"\nHealth Score Distribution:")
    print(df['health_score'].describe())
    
    # Calculate correlations only for numeric columns
    numeric_cols = ['health_score', 'num_objectives', 'num_activities', 'num_assessments', 
                   'duration_minutes', 'word_count']
    if all(col in df.columns for col in numeric_cols):
        print(f"\nFeature Correlations with Health Score:")
        numeric_df = df[numeric_cols]
        print(numeric_df.corr()['health_score'].sort_values(ascending=False))
