# Server Status Check Script
# Run this to check if the backend server is running properly

Write-Host "=== Backend Server Status Check ===" -ForegroundColor Cyan
Write-Host ""

# Check if Node processes are running
Write-Host "Checking for Node.js processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "✅ Found Node.js processes:" -ForegroundColor Green
    $nodeProcesses | Select-Object Id, ProcessName, StartTime, @{Name='Memory(MB)';Expression={[math]::Round($_.WorkingSet64/1MB,2)}} | Format-Table
} else {
    Write-Host "❌ No Node.js processes found" -ForegroundColor Red
}

Write-Host ""

# Check if port 5000 is in use
Write-Host "Checking port 5000..." -ForegroundColor Yellow
try {
    $connection = Get-NetTCPConnection -LocalPort 5000 -ErrorAction Stop
    Write-Host "✅ Port 5000 is in use:" -ForegroundColor Green
    $connection | Select-Object LocalAddress, LocalPort, State, OwningProcess | Format-Table
} catch {
    Write-Host "❌ Port 5000 is not in use" -ForegroundColor Red
}

Write-Host ""

# Try to connect to the server
Write-Host "Testing server connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Server is responding!" -ForegroundColor Green
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "❌ Server is not responding" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Check Complete ===" -ForegroundColor Cyan
