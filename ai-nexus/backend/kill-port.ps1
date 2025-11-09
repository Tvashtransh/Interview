# PowerShell script to kill process on port 5000 (or specified port)
param(
    [int]$Port = 5000
)

Write-Host "🔍 Checking for processes on port $Port..." -ForegroundColor Cyan

$connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue

if ($connections) {
    $processes = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    
    foreach ($pid in $processes) {
        if ($pid -gt 0) {
            $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "🛑 Killing process: $($process.ProcessName) (PID: $pid)" -ForegroundColor Yellow
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                Write-Host "✅ Process $pid terminated" -ForegroundColor Green
            }
        }
    }
    
    Start-Sleep -Seconds 1
    Write-Host "✅ Port $Port is now free!" -ForegroundColor Green
} else {
    Write-Host "✅ Port $Port is already free!" -ForegroundColor Green
}

