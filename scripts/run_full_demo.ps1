# ==============================================================================
# UNSEEN — One-Click Full Demo Launcher
# Windows PowerShell Execution Script
# ==============================================================================

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " UNSEEN — Agentic AI Network Intelligence Platform" -ForegroundColor Cyan
Write-Host " One-Click Demo Environment Launcher" -ForegroundColor Cyan
Write-Host "======================================================================`n" -ForegroundColor Cyan

$ProjectRoot = Resolve-Path "$PSScriptRoot\.."
Set-Location $ProjectRoot

# 1. Check Python
try {
    $py = python --version
    Write-Host "[✓] Python Environment: $py" -ForegroundColor Green
} catch {
    Write-Error "Python 3.10+ required. Not found in PATH."
    exit 1
}

# 2. Check Node
try {
    $node = node --version
    Write-Host "[✓] Node.js Environment: $node" -ForegroundColor Green
} catch {
    Write-Error "Node.js 18+ required. Not found in PATH."
    exit 1
}

# 3. Start Backend in separate window
Write-Host "`n[1/3] Launching FastAPI Backend on http://localhost:8000..." -ForegroundColor Yellow
$backendJob = Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "$PSScriptRoot\run_backend.ps1" -PassThru

# Wait for backend health check
Write-Host "[2/3] Waiting for Backend to report operational status..." -ForegroundColor Yellow
$maxAttempts = 15
$attempt = 0
$backendReady = $false

while ($attempt -lt $maxAttempts -and -not $backendReady) {
    Start-Sleep -Seconds 1
    $attempt++
    try {
        $resp = Invoke-RestMethod -Uri "http://localhost:8000/api/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($resp.status -eq "operational") {
            $backendReady = $true
            Write-Host "[✓] Backend is operational! (5 specialized agents initialized)" -ForegroundColor Green
        }
    } catch {
        Write-Host -NoNewline "."
    }
}

if (-not $backendReady) {
    Write-Host "`n[!] Backend took longer than expected to start. Proceeding with frontend..." -ForegroundColor Yellow
}

# 4. Start Frontend in separate window
Write-Host "`n[3/3] Launching React+Vite Frontend on http://localhost:5173..." -ForegroundColor Yellow
$frontendJob = Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "$PSScriptRoot\run_frontend.ps1" -PassThru

Start-Sleep -Seconds 3

# 5. Open Browser
Write-Host "`n[✓] Opening Browser to UNSEEN Landing Page..." -ForegroundColor Cyan
Start-Process "http://localhost:5173"

Write-Host "`n======================================================================" -ForegroundColor Green
Write-Host " UNSEEN Demo Environment Running Successfully!" -ForegroundColor Green
Write-Host " Landing Page:   http://localhost:5173/" -ForegroundColor White
Write-Host " Console Mode:   http://localhost:5173/app" -ForegroundColor White
Write-Host " Backend Docs:   http://localhost:8000/docs" -ForegroundColor White
Write-Host " Presentation:   Click 'Enter Presentation' in Console Header" -ForegroundColor White
Write-Host "======================================================================`n" -ForegroundColor Green
