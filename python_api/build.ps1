# Build script for NotebookLM Backend
# This script builds the executable with bundled Playwright browsers

Write-Host "Building NotebookLM Backend..." -ForegroundColor Cyan

# Terminate running backend if any
Write-Host "Checking for running backend processes..." -ForegroundColor Yellow
$backendProcesses = Get-Process "notebooklm_backend" -ErrorAction SilentlyContinue
if ($backendProcesses) {
    Write-Host "Found running backend process. Terminating..." -ForegroundColor Red
    $backendProcesses | Stop-Process -Force
    Start-Sleep -Seconds 2 # Wait for process to fully release handles
}

# Clean previous builds
if (Test-Path "dist") {
    Write-Host "Cleaning previous build..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "dist"
}

if (Test-Path "build") {
    Write-Host "Cleaning build cache..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "build"
}

# Run PyInstaller
Write-Host "`nRunning PyInstaller..." -ForegroundColor Cyan
python -m PyInstaller notebooklm_backend.spec

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ Build completed successfully!" -ForegroundColor Green
    Write-Host "`nExecutable location: $(Get-Location)\dist\notebooklm_backend.exe" -ForegroundColor Green
    
    # Show file size
    $exeSize = (Get-Item "dist\notebooklm_backend.exe").Length / 1MB
    Write-Host "Executable size: $([math]::Round($exeSize, 2)) MB" -ForegroundColor Cyan
} else {
    Write-Host "`n✗ Build failed!" -ForegroundColor Red
    exit 1
}
