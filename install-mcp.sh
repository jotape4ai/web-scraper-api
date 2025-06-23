#!/bin/bash

set -e

echo "🔥 Web Scraper API MCP Server Installation"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get current directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$SCRIPT_DIR"

echo -e "${BLUE}📦 Installing dependencies...${NC}"

# Install SDK dependencies
echo -e "${YELLOW}Installing SDK dependencies...${NC}"
cd "$PROJECT_ROOT/sdk"
npm install

# Install MCP server dependencies
echo -e "${YELLOW}Installing MCP server dependencies...${NC}"
cd "$PROJECT_ROOT/mcp-server"
npm install

# Build the projects
echo -e "${BLUE}🏗️  Building projects...${NC}"

# Build SDK
echo -e "${YELLOW}Building SDK...${NC}"
cd "$PROJECT_ROOT/sdk"
npm run build

# Build MCP server
echo -e "${YELLOW}Building MCP server...${NC}"
cd "$PROJECT_ROOT/mcp-server"
npm run build

# Create startup script
echo -e "${BLUE}📝 Creating startup script...${NC}"
cat > "$PROJECT_ROOT/start-mcp-server.sh" << 'EOF'
#!/bin/bash

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Set environment variables
export WEB_SCRAPER_API_URL="${WEB_SCRAPER_API_URL:-http://localhost:3002}"

# Start MCP server
echo "🔥 Starting Web Scraper API MCP Server..."
echo "API URL: $WEB_SCRAPER_API_URL"

node "$SCRIPT_DIR/mcp-server/dist/index.js"
EOF

chmod +x "$PROJECT_ROOT/start-mcp-server.sh"

# Create Cursor configuration file
echo -e "${BLUE}⚙️  Creating Cursor configuration...${NC}"
cat > "$PROJECT_ROOT/cursor-mcp-config.json" << EOF
{
  "mcp.servers": {
    "web-scraper-api": {
      "command": "node",
      "args": ["$PROJECT_ROOT/mcp-server/dist/index.js"],
      "env": {
        "WEB_SCRAPER_API_URL": "http://localhost:3002"
      }
    }
  }
}
EOF

echo -e "\n${GREEN}✅ Installation completed successfully!${NC}"
echo -e "\n${BLUE}📋 Next steps:${NC}"
echo -e "1. Make sure your Web Scraper API is running on http://localhost:3002"
echo -e "2. Add the following configuration to your Cursor settings:"
echo -e "\n${YELLOW}Configuration for Cursor:${NC}"
cat "$PROJECT_ROOT/cursor-mcp-config.json"

echo -e "\n${BLUE}🚀 To test the server manually:${NC}"
echo -e "   cd $PROJECT_ROOT"
echo -e "   ./start-mcp-server.sh"

echo -e "\n${GREEN}🎉 Ready to use Web Scraper API in Cursor!${NC}"
echo -e "Now you can use commands like:"
echo -e "- Extract content from https://example.com"
echo -e "- Scrape these URLs: url1, url2, url3"
echo -e "- Crawl the entire website https://example.com"