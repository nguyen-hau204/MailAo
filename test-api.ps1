# Test API PowerShell Script
Write-Host "🧪 Testing Temp Mail System API..." -ForegroundColor Cyan

try {
    # Test tạo email
    Write-Host "`n📧 Creating temp email..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/create-email" -Method POST -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "✅ Email created successfully!" -ForegroundColor Green
        Write-Host "📮 Email: $($response.data.email)" -ForegroundColor White
        Write-Host "🆔 ID: $($response.data.id)" -ForegroundColor White
        Write-Host "⏰ Expires: $($response.data.expiresAt)" -ForegroundColor White
        
        $emailId = $response.data.id
        $emailAddress = $response.data.email
        
        # Test lấy thông tin email
        Write-Host "`n📋 Getting email info..." -ForegroundColor Yellow
        $emailInfo = Invoke-RestMethod -Uri "http://localhost:3000/api/email/$emailId" -Method GET
        Write-Host "✅ Email info retrieved successfully!" -ForegroundColor Green
        
        # Test lấy messages
        Write-Host "`n📬 Getting messages..." -ForegroundColor Yellow
        $messages = Invoke-RestMethod -Uri "http://localhost:3000/api/email/$emailId/messages" -Method GET
        Write-Host "✅ Messages retrieved! Count: $($messages.data.Count)" -ForegroundColor Green
        
        Write-Host "`n🎯 Test completed successfully!" -ForegroundColor Green
        Write-Host "🌐 Open browser: http://localhost:3000" -ForegroundColor Cyan
        Write-Host "📧 Test email address: $emailAddress" -ForegroundColor White
        
    } else {
        Write-Host "❌ Failed to create email: $($response.message)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Error connecting to server: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Make sure server is running with: npm start" -ForegroundColor Yellow
}
