@echo off
echo.
echo ===============================================
echo   🚀 Instagram Auto-Posting Setup for 
echo      Social Publisher
echo ===============================================
echo.

echo 💡 This script will help you enable automatic Instagram posting
echo    by setting up ngrok to make your local server publicly accessible.
echo.

REM Check if ngrok is installed
echo 🔍 Checking if ngrok is installed...
ngrok version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ ngrok is not installed or not in PATH
    echo.
    echo 📥 Please install ngrok:
    echo    1. Go to https://ngrok.com/download
    echo    2. Download ngrok for Windows
    echo    3. Extract ngrok.exe to a folder
    echo    4. Add the folder to your PATH, or copy ngrok.exe to this folder
    echo    5. Get your auth token from https://dashboard.ngrok.com/get-started/your-authtoken
    echo    6. Run: ngrok authtoken YOUR_AUTH_TOKEN
    echo.
    pause
    exit /b 1
)

echo ✅ ngrok found!
echo.

echo 🌐 Starting ngrok tunnel for port 5000...
echo    This will create a public URL that Instagram can access.
echo.

REM Start ngrok in background
start /B "" ngrok http 5000

echo ⏳ Waiting for ngrok to initialize...
timeout /t 5 /nobreak >nul

echo.
echo 🎯 Getting your public URL...

REM Try to get the tunnel URL using PowerShell
powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://127.0.0.1:4040/api/tunnels' -Method Get; $tunnel = $response.tunnels | Where-Object { $_.proto -eq 'https' } | Select-Object -First 1; if ($tunnel) { Write-Host '✅ ngrok tunnel is running!' -ForegroundColor Green; Write-Host '🌐 Public URL:' $tunnel.public_url -ForegroundColor Cyan; Write-Host ''; Write-Host '📋 Now run this command to start your server:' -ForegroundColor Yellow; Write-Host '   set PUBLIC_BASE_URL=' -NoNewline -ForegroundColor Green; Write-Host $tunnel.public_url -NoNewline -ForegroundColor Green; Write-Host ' && npm start' -ForegroundColor Green; Write-Host ''; Write-Host '🎉 Instagram automatic posting will be ENABLED!' -ForegroundColor Green; } else { Write-Host '❌ Could not get tunnel URL' -ForegroundColor Red; } } catch { Write-Host '❌ Could not connect to ngrok' -ForegroundColor Red; }"

echo.
echo 💡 Keep this terminal window open to maintain the ngrok tunnel.
echo 💡 Open http://127.0.0.1:4040 in your browser to see ngrok dashboard.
echo.
echo 🚪 Press Ctrl+C to stop ngrok when you're done.
echo.

REM Keep the script running
:loop
timeout /t 30 /nobreak >nul
goto loop