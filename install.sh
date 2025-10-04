#!/bin/bash

# kai installation script

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

REPO="kirana-labs/kai"  # Update this to your GitHub username/repo
INSTALL_DIR="$HOME/.local/bin"
BINARY_NAME="kai"

echo -e "${CYAN}🚀 Installing kai...${NC}"
echo ""

# Detect OS and architecture
OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  Linux*)
    PLATFORM="linux"
    ;;
  Darwin*)
    PLATFORM="darwin"
    ;;
  *)
    echo -e "${RED}✗ Unsupported operating system: $OS${NC}"
    exit 1
    ;;
esac

case "$ARCH" in
  x86_64|amd64)
    ARCH_NAME="x64"
    ;;
  arm64|aarch64)
    ARCH_NAME="arm64"
    ;;
  *)
    echo -e "${RED}✗ Unsupported architecture: $ARCH${NC}"
    exit 1
    ;;
esac

BINARY_FILE="kai-${PLATFORM}-${ARCH_NAME}"

echo -e "${YELLOW}→${NC} Detected platform: $PLATFORM-$ARCH_NAME"

# Get latest release version
echo -e "${YELLOW}→${NC} Fetching latest release..."
LATEST_RELEASE=$(curl -s "https://api.github.com/repos/$REPO/releases/latest" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')

if [ -z "$LATEST_RELEASE" ]; then
  echo -e "${RED}✗ Could not fetch latest release${NC}"
  exit 1
fi

echo -e "${YELLOW}→${NC} Latest version: $LATEST_RELEASE"

# Download URL
DOWNLOAD_URL="https://github.com/$REPO/releases/download/$LATEST_RELEASE/$BINARY_FILE"

# Create install directory if it doesn't exist
mkdir -p "$INSTALL_DIR"

# Download the binary
echo -e "${YELLOW}→${NC} Downloading binary..."
if ! curl -L -o "$INSTALL_DIR/$BINARY_NAME" "$DOWNLOAD_URL"; then
  echo -e "${RED}✗ Failed to download binary${NC}"
  exit 1
fi

# Make it executable
chmod +x "$INSTALL_DIR/$BINARY_NAME"

echo ""
echo -e "${GREEN}✓ kai has been installed to $INSTALL_DIR/$BINARY_NAME${NC}"
echo ""

# Check if install dir is in PATH
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
  echo -e "${YELLOW}⚠ Note: $INSTALL_DIR is not in your PATH${NC}"
  echo ""
  echo "Add this to your ~/.zshrc or ~/.bashrc:"
  echo ""
  echo -e "  ${CYAN}export PATH=\"\$HOME/.local/bin:\$PATH\"${NC}"
  echo ""
fi

# Detect shell
SHELL_NAME=$(basename "$SHELL")

echo -e "${GREEN}Next steps:${NC}"
echo ""
echo "1. Add the shell integration to your shell config:"
echo ""

if [ "$SHELL_NAME" = "fish" ]; then
  echo -e "   ${CYAN}echo 'eval (kai init | string collect)' >> ~/.config/fish/config.fish${NC}"
else
  echo -e "   ${CYAN}echo 'eval \"\$(kai init)\"' >> ~/.zshrc${NC}"
fi

echo ""
echo "2. Reload your shell:"
echo ""

if [ "$SHELL_NAME" = "fish" ]; then
  echo -e "   ${CYAN}source ~/.config/fish/config.fish${NC}"
else
  echo -e "   ${CYAN}source ~/.zshrc${NC}"
fi

echo ""
echo "3. Run kai:"
echo ""
echo -e "   ${CYAN}kai${NC}"
echo ""
echo -e "${GREEN}Done! 🎉${NC}"
echo ""
