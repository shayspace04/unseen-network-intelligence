# ==============================================================================
# UNSEEN — Launch FastAPI Backend Server
# Windows PowerShell Execution Script
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host "`n[UNSEEN] Starting FastAPI Backend on http://localhost:8000..." -ForegroundColor Cyan

# Navigate to project root
$ProjectRoot = Resolve-Path "$PSScriptRoot\.."
Set-Location $ProjectRoot

# Check if Python is installed
try {
    $pythonVersion = python --version
    Write-Host "[UNSEEN] Found $pythonVersion" -ForegroundColor Green
} catch {
    Write-Error "[UNSEEN] Python is not installed or not in PATH. Please install Python 3.10+."
}

# Install dependencies if needed
if ($args -contains "--install") {
    Write-Host "[UNSEEN] Installing Python dependencies from backend/requirements.txt..." -ForegroundColor Yellow
    python -m pip install -r backend/requirements.txt
}

# Launch Uvicorn server
Write-Host "[UNSEEN] Launching Uvicorn ASGI server..." -ForegroundColor Green
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
