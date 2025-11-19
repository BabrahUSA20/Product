@echo off
echo 🚀 Quick Instagram Setup for Automatic Posting
echo.
echo The issue: Instagram can't access localhost URLs
echo The solution: Use ngrok to create a public tunnel
echo.

echo 📥 Step 1: Download ngrok
echo Go to: https://ngrok.com/download
echo Download the Windows version
echo.

echo 🔑 Step 2: Get ngrok auth token
echo 1. Sign up free at: https://ngrok.com/signup
echo 2. Get token from: https://dashboard.ngrok.com/get-started/your-authtoken
echo.

echo 🌐 Step 3: Setup ngrok
echo 1. Extract ngrok.exe to any folder
echo 2. Open Command Prompt in that folder
echo 3. Run: ngrok authtoken YOUR_TOKEN_HERE
echo 4. Run: ngrok http 5000
echo.

echo 🔗 Step 4: Copy the public URL
echo Copy the https URL (e.g., https://abc123.ngrok.io)
echo.

echo 🚀 Step 5: Restart server with public URL
echo PUBLIC_BASE_URL=https://your-ngrok-url.ngrok.io npm start
echo.

echo ✅ After this setup, Instagram posting will work automatically!
echo.
pause