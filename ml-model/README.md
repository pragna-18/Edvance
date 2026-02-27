# Health Score ML Model Training

This directory contains everything needed to train a custom ML model for predicting lesson plan health scores.

## 🚀 Quick Start

### Step 1: Setup Python Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Generate Training Data

```bash
python data_generator.py
```

This creates:
- `data/training_data.csv` - Feature matrix with health scores
- `data/lesson_plans.json` - Synthetic lesson plans (for reference)

**Output:** 500 synthetic lesson plans with extracted features

### Step 3: Train the Model

```bash
python train_model.py
```

This will:
1. Load the training data
2. Train a Random Forest model
3. Evaluate performance (R², RMSE, MAE)
4. Generate visualizations
5. Save model to `models/health_score_model.pkl`

**Expected Performance:**
- R² Score: 0.85-0.95 (model explains 85-95% of variance)
- RMSE: 0.3-0.5 (average prediction error 0.3-0.5 points on 1-10 scale)

## 📊 What Gets Trained

The model learns to predict health scores (1-10) based on:

| Feature | Importance |
|---------|-----------|
| num_objectives | High |
| num_activities | High |
| num_assessments | High |
| num_materials | Medium |
| has_differentiation | Medium |
| duration | Medium |
| content_words | Medium |

### Health Score Rubric (What Model Learns)

```
1-3 Points:  Poor lesson - missing key components
4-6 Points:  Average lesson - has basic structure
7-8 Points:  Good lesson - well-planned with variety
9-10 Points: Excellent - comprehensive, engaging, differentiated
```

## 📁 Directory Structure

```
ml-model/
├── requirements.txt          # Python dependencies
├── data_generator.py         # Generates synthetic training data
├── train_model.py            # Main training pipeline
├── predict.py               # Prediction utility (standalone)
├── data/
│   ├── training_data.csv    # Generated training dataset
│   └── lesson_plans.json    # Synthetic lesson plans
├── models/
│   ├── health_score_model.pkl      # Trained model
│   ├── model_metadata.json         # Model info & metrics
│   ├── feature_importance.png      # Feature ranking chart
│   └── predictions_plot.png        # Actual vs Predicted plot
└── README.md                # This file
```

## 🔄 Workflow

```
1. Generate Data (data_generator.py)
   ↓
2. Train Model (train_model.py)
   ↓
3. Evaluate Results (automatic)
   ↓
4. Integrate into Backend (predict.py in Node.js)
```

## 💡 Key Files Explained

### `data_generator.py`
- Creates synthetic lesson plans with realistic features
- Calculates health scores using rule-based rubric
- Outputs CSV for training
- **Run once to generate initial dataset**

### `train_model.py`
- Loads training data
- Trains Random Forest regression model
- Evaluates with cross-validation
- Generates visualizations
- Saves model and metadata
- **Run after generating data**

### `predict.py`
- Loads trained model
- Makes predictions on new lesson plans
- Called from Node.js backend
- **Used during production inference**

## 📈 Performance Interpretation

**Good Model Performance Indicators:**
- ✅ R² > 0.8 (explains >80% variance)
- ✅ RMSE < 0.5 (typical error < half point)
- ✅ No large residuals (no systematic bias)
- ✅ CV scores close to test scores (not overfitting)

**If Performance is Poor:**
1. Generate more data: `num_samples=1000` in data_generator.py
2. Adjust model hyperparameters in train_model.py
3. Check feature correlation: `print(df.corr())`

## 🔧 Advanced Usage

### Generate More Data

```python
from data_generator import LessonPlanDataGenerator

generator = LessonPlanDataGenerator(num_samples=1000)  # 1000 instead of 500
lessons, features, scores = generator.generate_dataset()
generator.save_dataset(lessons, features, scores)
```

### Retrain with Different Parameters

```python
from train_model import HealthScoreModelTrainer

trainer = HealthScoreModelTrainer()
X, y = trainer.load_data()
X_train, X_test, y_train, y_test = trainer.prepare_data(X, y)

# Custom hyperparameters
params = {'n_estimators': 200, 'max_depth': 20}
trainer.train_random_forest(X_train, y_train, params)
```

## 🚀 Integration with Backend

See `INTEGRATION_GUIDE.md` for instructions on:
1. Creating Node.js prediction endpoint
2. Replacing Gemini API calls with model predictions
3. Testing model in production

## 📚 Model Details

**Algorithm:** Random Forest Regressor
- Ensemble of decision trees
- Fast predictions (< 1ms per prediction)
- Handles non-linear relationships
- Provides feature importance scores

**Alternative Models Available:**
- Gradient Boosting (slightly better accuracy, slower)
- Linear Regression (faster, lower accuracy)

## ⚙️ System Requirements

- Python 3.8+
- 4GB RAM minimum
- 1GB disk space (for data + model)

## 🐛 Troubleshooting

**Error: "Module not found"**
```bash
pip install -r requirements.txt
```

**Error: "No such file or directory: data/training_data.csv"**
```bash
python data_generator.py  # Generate data first
```

**Model accuracy too low:**
1. Increase training data: `num_samples=1000`
2. Check data quality: `python -c "import pandas as pd; print(pd.read_csv('data/training_data.csv').describe())"`
3. Tune hyperparameters in `train_model.py`

## 📝 Next Steps

1. ✅ Run `python data_generator.py`
2. ✅ Run `python train_model.py`
3. ⬜ Create `predict.py` (standalone prediction script)
4. ⬜ Create Node.js integration (`health-score-predictor.js`)
5. ⬜ Update backend routes to use local model
6. ⬜ Run benchmark tests comparing Gemini vs local model
