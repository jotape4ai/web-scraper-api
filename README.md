# 🔥 Web Scraper API

A comprehensive web scraping API with MCP server integration, SDK, and Docker support. Converts any website into clean, structured data.

## 🌟 Features

- **🕷️ Individual Scraping**: Extract content from a specific URL
- **🔄 Complete Crawling**: Crawl all accessible pages of a website
- **📝 Multiple Formats**: Markdown, HTML, screenshots
- **⚡ Asynchronous**: Queue system with Redis for background processing
- **🛡️ Robust**: Error handling, rate limiting and validation
- **🎯 Customizable**: Flexible scraping and filtering options

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Redis
- npm or pnpm

### Installation

1. **Clone and setup**:
```bash
cd web-scraper-api
npm run install:all
```

2. **Configure environment variables**:
```bash
cp api/env.example api/.env
# Edit api/.env as needed
```

3. **Start Redis**:
```bash
redis-server
```

4. **Start the server**:
```bash
npm run start:dev
```

The API will be available at `http://localhost:3002`

## 📋 API Endpoints

### System Health

```bash
# Check that the API is working
curl http://localhost:3002/health
```

### Individual Scraping

```bash
# Basic scrape
curl -X POST http://localhost:3002/api/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com"
  }'

# Scrape with options
curl -X POST http://localhost:3002/api/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "options": {
      "includeHtml": true,
      "includeMarkdown": true,
      "includeScreenshot": false,
      "waitFor": 2000,
      "onlyMainContent": true
    }
  }'
```

### Batch Scraping

```bash
curl -X POST http://localhost:3002/api/scrape/batch \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://example.com",
      "https://example.com/about",
      "https://example.com/contact"
    ],
    "options": {
      "includeMarkdown": true
    }
  }'
```

### Crawling

```bash
# Start crawl
curl -X POST http://localhost:3002/api/crawl \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "options": {
      "maxPages": 10,
      "maxDepth": 2,
      "includeSubdomains": false
    }
  }'

# Check crawl status
curl http://localhost:3002/api/crawl/{job-id}
```

## ⚙️ Configuration Options

### Scraping Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `includeHtml` | boolean | false | Include raw HTML |
| `includeMarkdown` | boolean | true | Include content in Markdown |
| `includeScreenshot` | boolean | false | Include screenshot |
| `waitFor` | number | 0 | Wait time in ms |
| `timeout` | number | 30000 | Request timeout |
| `userAgent` | string | - | Custom User-Agent |
| `headers` | object | - | Custom HTTP headers |
| `excludeSelectors` | string[] | - | CSS selectors to exclude |
| `onlyMainContent` | boolean | false | Only main content |

### Crawling Options

Includes all scraping options plus:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxPages` | number | 10 | Maximum pages to crawl |
| `maxDepth` | number | 3 | Maximum depth |
| `allowedDomains` | string[] | - | Allowed domains |
| `excludePatterns` | string[] | - | URL patterns to exclude |
| `includeSubdomains` | boolean | false | Include subdomains |
| `respectRobotsTxt` | boolean | false | Respect robots.txt |

## 🏗️ Architecture

```
web-scraper-api/
├── api/                    # API Server
│   ├── src/
│   │   ├── routes/        # HTTP routes
│   │   ├── services/      # Business logic
│   │   ├── types/         # Type definitions
│   │   ├── utils/         # Utilities
│   │   └── workers/       # Queue workers
│   └── package.json
├── sdk/                   # TypeScript SDK
│   ├── src/               # API client
│   └── package.json
├── mcp-server/            # MCP Server for Cursor
│   ├── src/               # MCP server
│   └── package.json
├── examples/              # Usage examples
├── docs/                  # Documentation
├── install-mcp.sh         # MCP installation script
└── start-mcp-server.sh    # MCP startup script
```

## 🛠️ Development

### Available Scripts

```bash
# Install all dependencies
npm run install:all

# Development (with hot reload)
npm run start:dev

# Production
npm run build
npm start

# Tests
npm test

# Start workers
cd api && npm run workers
```

### Development Configuration

The `api/.env` file should include:

```env
PORT=3002
HOST=0.0.0.0
REDIS_URL=redis://localhost:6379
NUM_WORKERS=4
PUPPETEER_HEADLESS=true
LOG_LEVEL=info
```

## 🤖 MCP Server for Cursor

Now you can use Web Scraper API directly in Cursor with our MCP server!

### Quick Installation

```bash
# Install everything automatically
./install-mcp.sh

# Start server
./start-mcp-server.sh
```

### Cursor Configuration

Add this to your Cursor `settings.json`:

```json
{
  "mcp.servers": {
    "web-scraper-api": {
      "command": "node",
      "args": ["/full/path/to/web-scraper-api/mcp-server/dist/index.js"],
      "env": {
        "WEB_SCRAPER_API_URL": "http://localhost:3002"
      }
    }
  }
}
```

### Usage in Cursor

Once configured, you can use commands like:

- "Extract content from https://example.com"
- "Scrape these URLs in batch: [urls]"  
- "Crawl the entire website https://blog.example.com"

**Complete documentation:** [mcp-server/README.md](mcp-server/README.md)

## 🚀 Deployment

### With Docker

```bash
# Coming soon - Docker Compose
docker-compose up
```

### Manual

1. Configure Redis in production
2. Set environment variables
3. Build the project: `npm run build`
4. Start server: `npm start`
5. Start workers: `npm run workers`

## 🔧 Technologies

- **Backend**: Node.js, TypeScript, Express
- **Web Scraping**: Puppeteer, Cheerio
- **Queues**: BullMQ + Redis
- **Processing**: TurndownService (HTML → Markdown)
- **Security**: Helmet, CORS, Rate Limiting

## 📝 Roadmap

- [ ] JavaScript/TypeScript SDK
- [ ] Python SDK  
- [ ] Web administration interface
- [ ] Authentication support
- [ ] Webhook notifications
- [ ] Docker containers
- [ ] Metrics and monitoring
- [ ] Smart caching
- [ ] Proxy support

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for more details.

## 🙏 Inspiration

This project is inspired by [Firecrawl](https://github.com/mendableai/firecrawl) and serves as a simplified proof of concept to understand the concepts of web scraping at scale.