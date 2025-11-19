# PieraChat Build Script for Windows
# PowerShell script to build PieraChat for production deployment

param(
    [switch]$Backend,
    [switch]$Frontend,
    [switch]$All,
    [ValidateSet('win-x64', 'win-x86', 'win-arm64')]
    [string]$Architecture = 'win-x64',
    [switch]$Clean
)

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot

Write-Host "🚀 PieraChat Build Script v2.0" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if command exists
function Test-Command {
    param($Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

if (-not (Test-Command "dotnet")) {
    Write-Host "❌ .NET SDK not found. Please install .NET 8 SDK" -ForegroundColor Red
    Write-Host "   Download: https://dotnet.microsoft.com/download/dotnet/8.0" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Command "node")) {
    Write-Host "❌ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    Write-Host "   Download: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Prerequisites OK" -ForegroundColor Green
Write-Host ""

# Build Backend
if ($Backend -or $All) {
    Write-Host "🔧 Building Backend (.NET 8)..." -ForegroundColor Cyan
    Write-Host "Target: Windows $Architecture" -ForegroundColor Gray
    Write-Host ""

    Push-Location "$ProjectRoot\backend\PieraServer"

    try {
        if ($Clean) {
            Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Yellow
            if (Test-Path "bin") { Remove-Item -Recurse -Force "bin" }
            if (Test-Path "obj") { Remove-Item -Recurse -Force "obj" }
            if (Test-Path "publish") { Remove-Item -Recurse -Force "publish" }
        }

        Write-Host "📦 Restoring packages..." -ForegroundColor Yellow
        dotnet restore

        Write-Host "🔨 Building Release configuration..." -ForegroundColor Yellow
        dotnet build -c Release

        Write-Host "📤 Publishing for $Architecture..." -ForegroundColor Yellow
        dotnet publish -c Release -r $Architecture --self-contained true -p:PublishSingleFile=true -o ".\publish\$Architecture"

        Write-Host ""
        Write-Host "✅ Backend build completed!" -ForegroundColor Green
        Write-Host "📂 Output: backend\PieraServer\publish\$Architecture\" -ForegroundColor Green
        Write-Host "   Main executable: PieraServer.exe" -ForegroundColor Gray

        # Create ZIP archive
        Write-Host ""
        Write-Host "📦 Creating ZIP archive..." -ForegroundColor Yellow
        $ZipPath = "$ProjectRoot\builds\PieraChat-Backend-$Architecture-v2.0.0.zip"
        New-Item -ItemType Directory -Force -Path "$ProjectRoot\builds" | Out-Null

        if (Test-Path $ZipPath) { Remove-Item $ZipPath }
        Compress-Archive -Path ".\publish\$Architecture\*" -DestinationPath $ZipPath

        Write-Host "✅ Archive created: $ZipPath" -ForegroundColor Green

        # Calculate size
        $Size = (Get-Item $ZipPath).Length / 1MB
        Write-Host "   Size: $([math]::Round($Size, 2)) MB" -ForegroundColor Gray

    } catch {
        Write-Host "❌ Backend build failed: $_" -ForegroundColor Red
        Pop-Location
        exit 1
    }

    Pop-Location
    Write-Host ""
}

# Build Frontend
if ($Frontend -or $All) {
    Write-Host "🎨 Building Frontend (React + Vite)..." -ForegroundColor Cyan
    Write-Host ""

    Push-Location "$ProjectRoot\frontend"

    try {
        if ($Clean) {
            Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Yellow
            if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
            if (Test-Path "node_modules") {
                Write-Host "   Removing node_modules (this may take a while)..." -ForegroundColor Gray
                Remove-Item -Recurse -Force "node_modules"
            }
        }

        Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
        npm install

        Write-Host "🔨 Building production bundle..." -ForegroundColor Yellow
        npm run build

        Write-Host ""
        Write-Host "✅ Frontend build completed!" -ForegroundColor Green
        Write-Host "📂 Output: frontend\dist\" -ForegroundColor Green

        # Show bundle size
        if (Test-Path "dist") {
            $DistSize = (Get-ChildItem -Recurse "dist" | Measure-Object -Property Length -Sum).Sum / 1KB
            Write-Host "   Total size: $([math]::Round($DistSize, 2)) KB" -ForegroundColor Gray

            # List main files
            Write-Host ""
            Write-Host "📄 Main files:" -ForegroundColor Gray
            Get-ChildItem "dist" -Recurse -Include *.html,*.js,*.css | ForEach-Object {
                $FileSize = $_.Length / 1KB
                Write-Host "   - $($_.Name) ($([math]::Round($FileSize, 2)) KB)" -ForegroundColor Gray
            }
        }

        # Create ZIP archive
        Write-Host ""
        Write-Host "📦 Creating ZIP archive..." -ForegroundColor Yellow
        $ZipPath = "$ProjectRoot\builds\PieraChat-Frontend-v2.0.0.zip"
        New-Item -ItemType Directory -Force -Path "$ProjectRoot\builds" | Out-Null

        if (Test-Path $ZipPath) { Remove-Item $ZipPath }
        Compress-Archive -Path "dist\*" -DestinationPath $ZipPath

        Write-Host "✅ Archive created: $ZipPath" -ForegroundColor Green

        $Size = (Get-Item $ZipPath).Length / 1KB
        Write-Host "   Size: $([math]::Round($Size, 2)) KB" -ForegroundColor Gray

    } catch {
        Write-Host "❌ Frontend build failed: $_" -ForegroundColor Red
        Pop-Location
        exit 1
    }

    Pop-Location
    Write-Host ""
}

# Summary
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ Build completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Build artifacts:" -ForegroundColor Cyan
if (Test-Path "$ProjectRoot\builds") {
    Get-ChildItem "$ProjectRoot\builds" | ForEach-Object {
        $Size = $_.Length / 1MB
        Write-Host "   - $($_.Name) ($([math]::Round($Size, 2)) MB)" -ForegroundColor White
    }
}
Write-Host ""
Write-Host "📚 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Test the builds locally" -ForegroundColor Gray
Write-Host "   2. Deploy to production server" -ForegroundColor Gray
Write-Host "   3. Configure environment variables" -ForegroundColor Gray
Write-Host "   4. Set up HTTPS/WSS" -ForegroundColor Gray
Write-Host ""
Write-Host "📖 See DEPLOYMENT.md for deployment instructions" -ForegroundColor Cyan
Write-Host ""

# Usage instructions
if (-not ($Backend -or $Frontend -or $All)) {
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "   .\build-all.ps1 -All              # Build everything" -ForegroundColor White
    Write-Host "   .\build-all.ps1 -Backend          # Build backend only" -ForegroundColor White
    Write-Host "   .\build-all.ps1 -Frontend         # Build frontend only" -ForegroundColor White
    Write-Host "   .\build-all.ps1 -All -Clean       # Clean build" -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "   -Architecture <arch>   Target architecture (win-x64, win-x86, win-arm64)" -ForegroundColor White
    Write-Host "   -Clean                 Clean before build" -ForegroundColor White
    Write-Host ""
    exit 0
}
