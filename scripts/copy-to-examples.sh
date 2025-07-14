#!/bin/bash
# Copy the built library to the Chrome Extension example

# Exit on any error
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Copying sidepanel-fallback.umd.js to Chrome Extension example...${NC}"

# Check if the dist file exists
if [ ! -f "dist/sidepanel-fallback.umd.js" ]; then
    echo "Error: dist/sidepanel-fallback.umd.js not found. Run 'npm run build' first."
    exit 1
fi

# Create the examples directory if it doesn't exist
mkdir -p examples/chrome-extension

# Copy the UMD build to the example
cp dist/sidepanel-fallback.umd.js examples/chrome-extension/

echo -e "${GREEN}✓ Library copied successfully!${NC}"
echo -e "${BLUE}Chrome Extension example is ready to use.${NC}"
echo -e "${BLUE}Load examples/chrome-extension/ in chrome://extensions/ to test.${NC}"