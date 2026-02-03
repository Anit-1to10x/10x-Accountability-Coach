# 10X Accountability Coach - Installation Script
# For Windows (PowerShell)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "  ══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "                                                            "
Write-Host "         10X ACCOUNTABILITY COACH                          "
Write-Host "         Installation Script                                "
Write-Host "                                                            "
Write-Host "  ══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check for Node.js
Write-Host "Checking prerequisites..." -ForegroundColor Blue

try {
    $nodeVersion = node -v 2>$null
    if (-not $nodeVersion) {
        throw "not found"
    }
    $majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($majorVersion -lt 18) {
        Write-Host "Error: Node.js version 18+ is required." -ForegroundColor Red
        Write-Host "Current version: $nodeVersion"
        exit 1
    }
    Write-Host "[OK] Node.js $nodeVersion found" -ForegroundColor Green
}
catch {
    Write-Host "Error: Node.js is not installed." -ForegroundColor Red
    Write-Host "Please install Node.js 18+ from https://nodejs.org"
    exit 1
}

# Check for npm
try {
    $npmVersion = npm -v 2>$null
    if (-not $npmVersion) {
        throw "not found"
    }
    Write-Host "[OK] npm $npmVersion found" -ForegroundColor Green
}
catch {
    Write-Host "Error: npm is not installed." -ForegroundColor Red
    exit 1
}

# Install root dependencies
Write-Host ""
Write-Host "Installing root dependencies..." -ForegroundColor Blue
npm install

# Install UI dependencies
Write-Host ""
Write-Host "Installing UI dependencies..." -ForegroundColor Blue
Set-Location ui
npm install

# Check for API key
Write-Host ""
Write-Host "Checking API configuration..." -ForegroundColor Blue

$envFile = ".env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "No .env.local file found." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You need an OpenAnalyst API key to use 10X Coach."
    Write-Host "Get one at: " -NoNewline
    Write-Host "https://10x.in/dashboard" -ForegroundColor Blue
    Write-Host ""
    $apiKey = Read-Host "Enter your API key (or press Enter to skip)"

    if ($apiKey) {
        @"
# OpenAnalyst AI API (Required)
OPENANALYST_API_URL=https://api.openanalyst.com/api
OPENANALYST_API_KEY=$apiKey
OPENANALYST_MODEL=openanalyst-beta

# Gemini AI (Optional - for image generation)
# GEMINI_API_KEY=your-gemini-key-here
"@ | Out-File -FilePath $envFile -Encoding utf8
        Write-Host "[OK] API key configured" -ForegroundColor Green
    }
    else {
        Write-Host "[!] Skipped API key configuration." -ForegroundColor Yellow
        Write-Host "You can add your API key later in ui/.env.local"
    }
}
else {
    Write-Host "[OK] .env.local file found" -ForegroundColor Green
}

# Done!
Write-Host ""
Write-Host "  ══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "                                                            "
Write-Host "         Installation Complete!                             "
Write-Host "                                                            "
Write-Host "  ══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "To start the app:"
Write-Host ""
Write-Host "  npm run dev" -ForegroundColor Blue
Write-Host ""
Write-Host "Then open http://localhost:3000 in your browser."
Write-Host ""
Write-Host "Developed by Team 10X | Powered by OpenAnalyst"
Write-Host ""
