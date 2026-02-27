#!/bin/bash
# Quick start script for Health Score ML Model training
# Run this to generate data and train the model

echo "🚀 PrepSmart-C Health Score ML Model - Quick Start"
echo "=================================================="
echo ""

# Check Python installation
echo "📋 Checking Python installation..."
if ! command -v python &> /dev/null; then
    echo "❌ Python not found! Please install Python 3.8+"
    echo "   Download from: https://www.python.org/downloads/"
    exit 1
fi

PYTHON_VERSION=$(python --version 2>&1 | awk '{print $2}')
echo "✅ Python $PYTHON_VERSION found"
echo ""

# Navigate to ml-model directory
cd ml-model || exit 1

# Create virtual environment
echo "📦 Setting up virtual environment..."
if [ ! -d "venv" ]; then
    python -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo ""
echo "🔌 Activating virtual environment..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows
    source venv/Scripts/activate
else
    # macOS/Linux
    source venv/bin/activate
fi
echo "✅ Virtual environment activated"

# Install dependencies
echo ""
echo "📚 Installing dependencies..."
pip install -r requirements.txt > /dev/null 2>&1
echo "✅ Dependencies installed"

# Generate training data
echo ""
echo "🔄 Generating synthetic training data (500 samples)..."
echo "   This may take 1-2 minutes..."
python data_generator.py

echo ""
echo "⏳ Training model..."
echo "   This may take 2-5 minutes..."
python train_model.py

echo ""
echo "🧪 Testing prediction..."
python predict.py

echo ""
echo "✅ SETUP COMPLETE!"
echo ""
echo "📋 Next Steps:"
echo "   1. Review model performance metrics above"
echo "   2. Check generated files:"
echo "      - models/health_score_model.pkl (trained model)"
echo "      - models/model_metadata.json (metrics)"
echo "      - models/feature_importance.png (feature ranking)"
echo "   3. Read integration guide: HEALTH_SCORE_INTEGRATION.md"
echo "   4. Update server routes as shown in guide"
echo ""
echo "📊 Model Files Created:"
ls -lh models/ 2>/dev/null | tail -n +2 | awk '{print "   - " $9 " (" $5 ")"}'
echo ""
echo "🚀 You're ready to integrate the model into your backend!"
