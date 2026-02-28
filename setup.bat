@echo off
echo ======================================
echo RCC Voting System - Setup Script
echo ======================================
echo.

echo [1/5] Setting up Backend...
cd backend

echo Creating virtual environment...
python -m venv venv

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing Python dependencies...
pip install -r requirements.txt

echo Creating .env file...
if not exist .env (
    copy .env.example .env
    echo .env file created. Please update SECRET_KEY in .env
) else (
    echo .env file already exists
)

echo Running migrations...
python manage.py migrate

echo Initializing database...
python manage.py init_db

echo.
echo Backend setup complete!
echo.
echo ======================================
echo.

cd ..

echo [2/5] Setting up Frontend...
cd frontend

echo Installing Node dependencies...
call npm install

echo Creating .env.local file...
if not exist .env.local (
    copy .env.local.example .env.local
    echo .env.local file created
) else (
    echo .env.local file already exists
)

echo.
echo Frontend setup complete!
echo.

cd ..

echo [3/5] Copying images to frontend public folder...
if not exist "frontend\public" mkdir "frontend\public"
copy "hero.png" "frontend\public\hero.png" >nul
copy "rcc_placeholder.png" "frontend\public\rcc_placeholder.png" >nul
echo Images copied successfully!
echo.

echo ======================================
echo [4/5] Setup Complete!
echo ======================================
echo.
echo Next steps:
echo.
echo 1. Create a Django superuser:
echo    cd backend
echo    venv\Scripts\activate
echo    python manage.py createsuperuser
echo.
echo 2. Start the backend server:
echo    cd backend
echo    venv\Scripts\activate
echo    python manage.py runserver
echo.
echo 3. Start the frontend server (in a new terminal):
echo    cd frontend
echo    npm run dev
echo.
echo 4. Access the application:
echo    - Frontend: http://localhost:3000
echo    - Backend API: http://localhost:8000
echo    - Django Admin: http://localhost:8000/admin
echo.
echo ======================================
pause
