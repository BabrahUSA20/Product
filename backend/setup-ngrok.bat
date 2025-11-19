@echo off
echo 🚀 Setting up ngrok for Instagram automatic posting...
echo.

REM Check if ngrok is installed
ngrok version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ngrok not found. Please install it first:
    echo.
    echo 1. Go to https://ngrok.com/download
    echo 2. Download ngrok for Windows
    echo 3. Extract ngrok.exe to a folder in your PATH
    echo 4. Run: ngrok authtoken YOUR_AUTH_TOKEN
    echo.
    pause
    exit /b 1
)

echo ✅ ngrok found!
echo.
echo 🌐 Starting ngrok tunnel...
start /B ngrok http 5000

echo.
echo ⏳ Waiting for ngrok to start...
timeout /t 3 /nobreak >nul

echo.
echo 📋 Getting ngrok URL...
curl -s http://127.0.0.1:4040/api/tunnels | findstr "https" >nul
if %errorlevel% neq 0 (
    echo ❌ Could not get ngrok URL. Please check if ngrok is running.
    echo Open http://127.0.0.1:4040 in your browser to see ngrok dashboard
) else (
    echo ✅ ngrok is running!
    echo.
    echo 🌐 Your ngrok URL is available at: http://127.0.0.1:4040
    echo.
    echo 📝 To start your server with Instagram posting enabled:
    echo    1. Copy the https URL from ngrok dashboard
    echo    2. Run: set PUBLIC_BASE_URL=https://your-ngrok-url.ngrok.io
    echo    3. Run: npm start
)

echo.
echo 💡 Keep this window open to maintain the ngrok tunnel
pause