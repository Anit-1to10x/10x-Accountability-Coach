#!/bin/bash

# 10X Accountability Coach - Installation Script
# For macOS and Linux

set -e

echo ""
echo "  ╔══════════════════════════════════════════════════════════╗"
echo "  ║                                                          ║"
echo "  ║       10X ACCOUNTABILITY COACH                          ║"
echo "  ║       Installation Script                                ║"
echo "  ║                                                          ║"
echo "  ╚══════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check for Node.js
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed.${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js version 18+ is required.${NC}"
    echo "Current version: $(node -v)"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) found${NC}"

# Check for npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm $(npm -v) found${NC}"

# Install root dependencies
echo ""
echo -e "${BLUE}Installing root dependencies...${NC}"
npm install

# Install UI dependencies
echo ""
echo -e "${BLUE}Installing UI dependencies...${NC}"
cd ui
npm install

# Check for API key
echo ""
echo -e "${BLUE}Checking API configuration...${NC}"

if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}No .env.local file found.${NC}"
    echo ""
    echo "You need an OpenAnalyst API key to use 10X Coach."
    echo -e "Get one at: ${BLUE}https://10x.in/dashboard${NC}"
    echo ""
    read -p "Enter your API key (or press Enter to skip): " API_KEY

    if [ -n "$API_KEY" ]; then
        cat > .env.local << EOF
# OpenAnalyst AI API (Required)
OPENANALYST_API_URL=https://api.openanalyst.com/api
OPENANALYST_API_KEY=$API_KEY
OPENANALYST_MODEL=openanalyst-beta

# Gemini AI (Optional - for image generation)
# GEMINI_API_KEY=your-gemini-key-here
EOF
        echo -e "${GREEN}✓ API key configured${NC}"
    else
        echo -e "${YELLOW}⚠ Skipped API key configuration.${NC}"
        echo "You can add your API key later in ui/.env.local"
    fi
else
    echo -e "${GREEN}✓ .env.local file found${NC}"
fi

# Done!
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}║       Installation Complete!                             ║${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "To start the app:"
echo ""
echo -e "  ${BLUE}cd ui && npm run dev${NC}"
echo ""
echo "Then open http://localhost:3000 in your browser."
echo ""
echo "Developed by Team 10X | Powered by OpenAnalyst"
echo ""
