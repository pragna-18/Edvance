@echo off
REM Quick start script for Health Score ML Model training (Windows)
REM Run this to generate data and train the model

echo.
echo ========================================================
echo 🚀 PrepSmart-C Health Score ML Model - Quick Start
echo ========================================================
echo.

REM Check Python installation
echo 📋 Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found! Please install Python 3.8+
    echo    Download from: https://www.python.org/downloads/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
echo ✅ %PYTHON_VERSION% found
echo.

REM Navigate to ml-model directory
cd ml-model
if errorlevel 1 (
    echo ❌ Failed to navigate to ml-model directory
    pause
    exit /b 1
)

REM Create virtual environment
echo 📦 Setting up virtual environment...
if not exist "venv" (
    python -m venv venv
    echo ✅ Virtual environment created
) else (
    echo ✅ Virtual environment already exists
)
echo.

REM Activate virtual environment
echo 🔌 Activating virtual environment...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ❌ Failed to activate virtual environment
    pause
    exit /b 1
)
echo ✅ Virtual environment activated
echo.

REM Install dependencies
echo 📚 Installing dependencies...
pip install -r requirements.txt >nul 2>&1
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    echo Try running: pip install -r requirements.txt
    pause
    exit /b 1
)
echo ✅ Dependencies installed
echo.

REM Generate training data
echo 🔄 Generating synthetic training data (500 samples)...
echo    This may take 1-2 minutes...
python data_generator.py

REM Train model
echo.
echo ⏳ Training model...
echo    This may take 2-5 minutes...
python train_model.py

REM Test prediction
echo.
echo 🧪 Testing prediction...
python predict.py

echo.
echo ✅ SETUP COMPLETE!
echo.
echo 📋 Next Steps:
echo    1. Review model performance metrics above
echo    2. Check generated files:
echo       - models\health_score_model.pkl (trained model)
echo       - models\model_metadata.json (metrics)
echo       - models\feature_importance.png (feature ranking)
echo    3. Read integration guide: HEALTH_SCORE_INTEGRATION.md
echo    4. Update server routes as shown in guide
echo.
echo 🚀 You're ready to integrate the model into your backend!
echo.
pause
