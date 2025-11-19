#!/bin/bash

# PieraChat Installation Script for Linux
# Automated installation of PieraChat backend on Ubuntu/Debian

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🚀 PieraChat Backend Installation${NC}"
echo -e "${CYAN}=================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Please run as root or with sudo${NC}"
    exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
else
    echo -e "${RED}❌ Cannot detect OS version${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Detected OS: $OS $VER${NC}"
echo ""

# Install .NET 8 Runtime
echo -e "${CYAN}📦 Installing .NET 8 Runtime...${NC}"

if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    # Add Microsoft repository
    wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
    dpkg -i packages-microsoft-prod.deb
    rm packages-microsoft-prod.deb

    # Install .NET runtime
    apt-get update
    apt-get install -y aspnetcore-runtime-8.0

elif [[ "$OS" == *"Fedora"* ]] || [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]]; then
    dnf install -y aspnetcore-runtime-8.0

elif [[ "$OS" == *"Arch"* ]]; then
    pacman -S --noconfirm aspnet-runtime

else
    echo -e "${RED}❌ Unsupported OS: $OS${NC}"
    echo -e "${YELLOW}Please install .NET 8 Runtime manually${NC}"
    exit 1
fi

echo -e "${GREEN}✅ .NET Runtime installed${NC}"
echo ""

# Create installation directory
echo -e "${CYAN}📁 Creating installation directory...${NC}"
INSTALL_DIR="/opt/pierachat"
mkdir -p "$INSTALL_DIR/backend"
mkdir -p "$INSTALL_DIR/backend/uploads"

# Copy backend files
echo -e "${CYAN}📦 Copying backend files...${NC}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd .. && pwd)"

if [ -d "$SCRIPT_DIR/backend/PieraServer/publish" ]; then
    # Find the most recent publish directory
    PUBLISH_DIR=$(find "$SCRIPT_DIR/backend/PieraServer/publish" -mindepth 1 -maxdepth 1 -type d | head -n 1)

    if [ -n "$PUBLISH_DIR" ]; then
        cp -r "$PUBLISH_DIR"/* "$INSTALL_DIR/backend/"
        echo -e "${GREEN}✅ Backend files copied${NC}"
    else
        echo -e "${RED}❌ No publish directory found${NC}"
        echo -e "${YELLOW}Please run ./build-all.sh --backend first${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Backend not built${NC}"
    echo -e "${YELLOW}Please run ./build-all.sh --backend first${NC}"
    exit 1
fi

# Set permissions
echo -e "${CYAN}🔐 Setting permissions...${NC}"
chown -R www-data:www-data "$INSTALL_DIR"
chmod 755 "$INSTALL_DIR/backend"
chmod 775 "$INSTALL_DIR/backend/uploads"

# Install systemd service
echo -e "${CYAN}⚙️ Installing systemd service...${NC}"
cp "$SCRIPT_DIR/deploy/pierachat.service" /etc/systemd/system/pierachat.service

# Reload systemd
systemctl daemon-reload

# Enable and start service
echo -e "${CYAN}🚀 Starting PieraChat service...${NC}"
systemctl enable pierachat
systemctl start pierachat

# Wait for service to start
sleep 3

# Check status
if systemctl is-active --quiet pierachat; then
    echo -e "${GREEN}✅ PieraChat service started successfully${NC}"
else
    echo -e "${RED}❌ Failed to start PieraChat service${NC}"
    echo -e "${YELLOW}Check logs with: sudo journalctl -u pierachat -f${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}=================================${NC}"
echo -e "${GREEN}✅ Installation completed!${NC}"
echo ""
echo -e "${YELLOW}📚 Service management:${NC}"
echo -e "   sudo systemctl status pierachat   # Check status"
echo -e "   sudo systemctl stop pierachat     # Stop service"
echo -e "   sudo systemctl start pierachat    # Start service"
echo -e "   sudo systemctl restart pierachat  # Restart service"
echo ""
echo -e "${YELLOW}📝 View logs:${NC}"
echo -e "   sudo journalctl -u pierachat -f   # Follow logs"
echo ""
echo -e "${YELLOW}🌐 Service running on:${NC}"
echo -e "   http://localhost:8080"
echo ""
echo -e "${YELLOW}📖 Next steps:${NC}"
echo -e "   1. Configure Nginx reverse proxy (see DEPLOYMENT.md)"
echo -e "   2. Set up SSL with Let's Encrypt"
echo -e "   3. Configure firewall rules"
echo ""
