#!/bin/bash

# PieraChat Build Script for Linux/macOS
# Bash script to build PieraChat for production deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Default values
BUILD_BACKEND=false
BUILD_FRONTEND=false
BUILD_ALL=false
CLEAN=false
ARCHITECTURE="linux-x64"

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    ARCHITECTURE="osx-x64"
    if [[ $(uname -m) == "arm64" ]]; then
        ARCHITECTURE="osx-arm64"
    fi
fi

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --backend)
            BUILD_BACKEND=true
            shift
            ;;
        --frontend)
            BUILD_FRONTEND=true
            shift
            ;;
        --all)
            BUILD_ALL=true
            shift
            ;;
        --clean)
            CLEAN=true
            shift
            ;;
        --arch)
            ARCHITECTURE="$2"
            shift 2
            ;;
        --help)
            echo "Usage: ./build-all.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --all           Build everything"
            echo "  --backend       Build backend only"
            echo "  --frontend      Build frontend only"
            echo "  --clean         Clean before build"
            echo "  --arch <arch>   Target architecture (linux-x64, linux-arm64, osx-x64, osx-arm64)"
            echo "  --help          Show this help message"
            echo ""
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# If no specific build selected, show help
if [[ "$BUILD_BACKEND" == false && "$BUILD_FRONTEND" == false && "$BUILD_ALL" == false ]]; then
    echo -e "${YELLOW}No build target specified. Use --help for usage information${NC}"
    exit 0
fi

echo -e "${CYAN}🚀 PieraChat Build Script v2.0${NC}"
echo -e "${CYAN}================================${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

if ! command -v dotnet &> /dev/null; then
    echo -e "${RED}❌ .NET SDK not found. Please install .NET 8 SDK${NC}"
    echo -e "${YELLOW}   Download: https://dotnet.microsoft.com/download/dotnet/8.0${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+${NC}"
    echo -e "${YELLOW}   Download: https://nodejs.org/${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites OK${NC}"
echo ""

# Build Backend
if [[ "$BUILD_BACKEND" == true || "$BUILD_ALL" == true ]]; then
    echo -e "${CYAN}🔧 Building Backend (.NET 8)...${NC}"
    echo -e "${GRAY}Target: $ARCHITECTURE${NC}"
    echo ""

    cd "$PROJECT_ROOT/backend/PieraServer"

    if [[ "$CLEAN" == true ]]; then
        echo -e "${YELLOW}🧹 Cleaning previous builds...${NC}"
        rm -rf bin obj publish
    fi

    echo -e "${YELLOW}📦 Restoring packages...${NC}"
    dotnet restore

    echo -e "${YELLOW}🔨 Building Release configuration...${NC}"
    dotnet build -c Release

    echo -e "${YELLOW}📤 Publishing for $ARCHITECTURE...${NC}"
    dotnet publish -c Release -r "$ARCHITECTURE" --self-contained true -p:PublishSingleFile=true -o "./publish/$ARCHITECTURE"

    echo ""
    echo -e "${GREEN}✅ Backend build completed!${NC}"
    echo -e "${GREEN}📂 Output: backend/PieraServer/publish/$ARCHITECTURE/${NC}"
    echo -e "${GRAY}   Main executable: PieraServer${NC}"

    # Create tar.gz archive
    echo ""
    echo -e "${YELLOW}📦 Creating tar.gz archive...${NC}"
    mkdir -p "$PROJECT_ROOT/builds"

    ARCHIVE_NAME="PieraChat-Backend-$ARCHITECTURE-v2.0.0.tar.gz"
    cd "./publish/$ARCHITECTURE"
    tar -czf "$PROJECT_ROOT/builds/$ARCHIVE_NAME" ./*
    cd "$PROJECT_ROOT"

    echo -e "${GREEN}✅ Archive created: builds/$ARCHIVE_NAME${NC}"

    # Calculate size
    SIZE=$(du -h "$PROJECT_ROOT/builds/$ARCHIVE_NAME" | cut -f1)
    echo -e "${GRAY}   Size: $SIZE${NC}"

    cd "$PROJECT_ROOT"
    echo ""
fi

# Build Frontend
if [[ "$BUILD_FRONTEND" == true || "$BUILD_ALL" == true ]]; then
    echo -e "${CYAN}🎨 Building Frontend (React + Vite)...${NC}"
    echo ""

    cd "$PROJECT_ROOT/frontend"

    if [[ "$CLEAN" == true ]]; then
        echo -e "${YELLOW}🧹 Cleaning previous builds...${NC}"
        rm -rf dist node_modules
    fi

    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install

    echo -e "${YELLOW}🔨 Building production bundle...${NC}"
    npm run build

    echo ""
    echo -e "${GREEN}✅ Frontend build completed!${NC}"
    echo -e "${GREEN}📂 Output: frontend/dist/${NC}"

    # Show bundle size
    if [[ -d "dist" ]]; then
        DIST_SIZE=$(du -sh dist | cut -f1)
        echo -e "${GRAY}   Total size: $DIST_SIZE${NC}"

        # List main files
        echo ""
        echo -e "${GRAY}📄 Main files:${NC}"
        find dist -type f \( -name "*.html" -o -name "*.js" -o -name "*.css" \) -exec ls -lh {} \; | awk '{print "   - " $9 " (" $5 ")"}'
    fi

    # Create tar.gz archive
    echo ""
    echo -e "${YELLOW}📦 Creating tar.gz archive...${NC}"
    mkdir -p "$PROJECT_ROOT/builds"

    ARCHIVE_NAME="PieraChat-Frontend-v2.0.0.tar.gz"
    cd dist
    tar -czf "$PROJECT_ROOT/builds/$ARCHIVE_NAME" ./*
    cd "$PROJECT_ROOT"

    echo -e "${GREEN}✅ Archive created: builds/$ARCHIVE_NAME${NC}"

    SIZE=$(du -h "$PROJECT_ROOT/builds/$ARCHIVE_NAME" | cut -f1)
    echo -e "${GRAY}   Size: $SIZE${NC}"

    cd "$PROJECT_ROOT"
    echo ""
fi

# Summary
echo ""
echo -e "${CYAN}================================${NC}"
echo -e "${GREEN}✅ Build completed successfully!${NC}"
echo ""
echo -e "${CYAN}📦 Build artifacts:${NC}"
if [[ -d "$PROJECT_ROOT/builds" ]]; then
    ls -lh "$PROJECT_ROOT/builds" | grep -v '^total' | awk '{print "   - " $9 " (" $5 ")"}'
fi
echo ""
echo -e "${YELLOW}📚 Next steps:${NC}"
echo -e "${GRAY}   1. Test the builds locally${NC}"
echo -e "${GRAY}   2. Deploy to production server${NC}"
echo -e "${GRAY}   3. Configure environment variables${NC}"
echo -e "${GRAY}   4. Set up HTTPS/WSS${NC}"
echo ""
echo -e "${CYAN}📖 See DEPLOYMENT.md for deployment instructions${NC}"
echo ""
