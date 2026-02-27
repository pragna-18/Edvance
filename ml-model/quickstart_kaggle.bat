@echo off
REM Quick Start Script for Kaggle ML Model Training (Windows)
REM Run this after setting up Kaggle credentials

echo.
echo ======================================================
echo  KAGGLE EDUCATION ML MODEL - QUICK START
echo ======================================================
echo.

cd /d "%~dp0"

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.8+ first
    pause
    exit /b 1
)

echo [1/4] Installing dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo [OK] Dependencies installed

echo.
echo [2/4] Downloading 10 Kaggle education datasets...
echo This may take 5-10 minutes depending on your connection
python download_kaggle_datasets.py
if errorlevel 1 (
    echo [ERROR] Failed to download datasets
    echo Make sure you have Kaggle API credentials in ~/.kaggle/kaggle.json
    pause
    exit /b 1
)
echo [OK] Datasets downloaded

echo.
echo [3/4] Processing datasets...
python load_kaggle_datasets.py
if errorlevel 1 (
    echo [ERROR] Failed to process datasets
    pause
    exit /b 1
)
echo [OK] Datasets processed

echo.
echo [4/4] Training model on Kaggle data...
python train_model.py
if errorlevel 1 (
    echo [ERROR] Failed to train model
    pause
    exit /b 1
)
echo [OK] Model trained

echo.
echo ======================================================
echo SUCCESS! Model trained on 10 Kaggle datasets
echo ======================================================
echo.
echo Model saved to: models\health_score_model.pkl
echo Metadata saved to: models\model_metadata.json
echo.
echo Next steps:
echo - Backend will automatically use the new model
echo - Test with: npm run dev (in server/)
echo - Check health scores on lesson plans
echo.
pause
