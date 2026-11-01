# ==============================================================================
# UNSEEN — Run Automated Backend & Interoperability Test Suite
# Windows PowerShell Execution Script
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host "`n[UNSEEN] Running Automated Test Suite..." -ForegroundColor Cyan

$ProjectRoot = Resolve-Path "$PSScriptRoot\.."
Set-Location $ProjectRoot

# Execute pytest on backend tests
Write-Host "[UNSEEN] Executing pytest backend/tests -v..." -ForegroundColor Yellow
python -m pytest backend/tests -v

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[UNSEEN] All automated tests PASSED successfully!`n" -ForegroundColor Green
} else {
    Write-Error "`n[UNSEEN] Automated tests FAILED. Please inspect output above."
}
