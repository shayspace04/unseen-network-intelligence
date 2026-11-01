# ==============================================================================
# UNSEEN — Launch React + Vite Frontend Console
# Windows PowerShell Execution Script
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host "`n[UNSEEN] Starting Frontend Console on http://localhost:5173..." -ForegroundColor Cyan

# Navigate to frontend folder
$FrontendDir = Resolve-Path "$PSScriptRoot\..\frontend"
Set-Location $FrontendDir

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "[UNSEEN] Found Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Error "[UNSEEN] Node.js is not installed or not in PATH. Please install Node.js 18+."
}

# Install dependencies if node_modules is missing
if (-not (Test-Path "node_modules") -or ($args -contains "--install")) {
    Write-Host "[UNSEEN] Installing npm dependencies..." -ForegroundColor Yellow
    npm install
}

# Launch Vite dev server
Write-Host "[UNSEEN] Launching Vite development server..." -ForegroundColor Green
npm run dev
