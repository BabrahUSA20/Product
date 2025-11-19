# Instagram Posting Setup for Social Publisher
Write-Host "🚀 Social Publisher - Instagram Setup" -ForegroundColor Green
Write-Host ""

# Check if ngrok is available
try {
    $ngrokVersion = & ngrok version 2>$null
    Write-Host "✅ ngrok found: $ngrokVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ ngrok not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install ngrok:" -ForegroundColor Yellow
    Write-Host "1. Go to https://ngrok.com/download" -ForegroundColor White
    Write-Host "2. Download ngrok for Windows" -ForegroundColor White
    Write-Host "3. Extract to a folder in your PATH" -ForegroundColor White
    Write-Host "4. Get auth token from https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor White
    Write-Host "5. Run: ngrok authtoken YOUR_AUTH_TOKEN" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit
}

Write-Host ""
Write-Host "🌐 Starting ngrok tunnel on port 5000..." -ForegroundColor Blue

# Start ngrok in background
Start-Process -FilePath "ngrok" -ArgumentList "http", "5000" -WindowStyle Minimized

# Wait for ngrok to start
Write-Host "⏳ Waiting for ngrok to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Try to get tunnel info
try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -Method Get
    $httpsUrl = $response.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1
    
    if ($httpsUrl) {
        $publicUrl = $httpsUrl.public_url
        Write-Host ""
        Write-Host "✅ ngrok tunnel is running!" -ForegroundColor Green
        Write-Host "🌐 Public URL: $publicUrl" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "📋 To enable Instagram automatic posting:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "1. Copy this command and run it:" -ForegroundColor White
        Write-Host "   `$env:PUBLIC_BASE_URL='$publicUrl'; npm start" -ForegroundColor Green
        Write-Host ""
        Write-Host "2. Or set the environment variable and restart:" -ForegroundColor White
        Write-Host "   `$env:PUBLIC_BASE_URL='$publicUrl'" -ForegroundColor Green
        Write-Host "   npm start" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎉 Your server will now be able to post to Instagram automatically!" -ForegroundColor Green
        Write-Host ""
        Write-Host "💡 Keep ngrok running while using Instagram posting" -ForegroundColor Yellow
        Write-Host "💡 ngrok dashboard: http://127.0.0.1:4040" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Could not get ngrok URL" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Could not connect to ngrok. Please check if it's running." -ForegroundColor Red
    Write-Host "💡 Open http://127.0.0.1:4040 in your browser to see ngrok dashboard" -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Press Enter to continue"