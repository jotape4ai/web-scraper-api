# 🔥 Web Scraper API MCP Server

A Model Context Protocol (MCP) server that provides web scraping capabilities for AI assistants and IDEs like Cursor. Powered by the Web Scraper API.

## What is MCP?

Model Context Protocol (MCP) is an open protocol that enables AI applications to access external tools and data sources in a standardized way. This MCP server exposes web scraping functionality to AI models.

## Features

- 🔥 **Individual URL Scraping**: Extract content from specific web pages
- 📚 **Batch Scraping**: Process multiple URLs simultaneously (up to 10)
- 🕷️ **Complete Website Crawling**: Crawl entire websites following links
- 📊 **Progress Monitoring**: Check status of crawling jobs
- 🏥 **Health Check**: Verify service availability
- 🛡️ **Error Handling**: Robust error management and validation

## Available Tools

### 1. `scrape_url`
Extract content from a specific URL.

**Parameters:**
- `url` (required): URL to scrape
- `includeMarkdown` (optional): Include Markdown content (default: true)
- `includeHtml` (optional): Include raw HTML (default: false)
- `includeScreenshot` (optional): Include screenshot in base64 (default: false)
- `onlyMainContent` (optional): Extract only main content (default: false)
- `waitFor` (optional): Additional wait time in milliseconds
- `timeout` (optional): Request timeout in milliseconds
- `userAgent` (optional): Custom User-Agent
- `excludeSelectors` (optional): CSS selectors to exclude

### 2. `scrape_batch`
Extract content from multiple URLs in a single operation.

**Parameters:**
- `urls` (required): Array of URLs to scrape (maximum 10)
- `includeMarkdown` (optional): Include Markdown content (default: true)
- `includeHtml` (optional): Include raw HTML (default: false)
- `onlyMainContent` (optional): Extract only main content (default: false)
- `timeout` (optional): Timeout per request in milliseconds

### 3. `crawl_website`
Crawl a complete website following links.

**Parameters:**
- `url` (required): Base URL of the website
- `maxPages` (optional): Maximum pages to crawl (default: 10, max: 50)
- `maxDepth` (optional): Maximum crawling depth (default: 3)
- `includeSubdomains` (optional): Include subdomains (default: false)
- `includeMarkdown` (optional): Include Markdown content (default: true)
- `excludePatterns` (optional): URL patterns to exclude
- `allowedDomains` (optional): Specific allowed domains

### 4. `check_crawl_status`
Check the status of an ongoing crawling job.

**Parameters:**
- `jobId` (required): ID of the crawling job to check

### 5. `health_check`
Check that the scraping service is available and working.

**Parameters:** None

## Installation

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

3. Configure environment variables:
```bash
export WEB_SCRAPER_API_URL="http://localhost:3002"
export WEB_SCRAPER_API_KEY="your-api-key"  # Optional
```

## Usage

### Manual execution
```bash
npm start
```

### Use with Cursor

Add the following configuration to your Cursor settings:

```json
{
  "mcp.servers": {
    "web-scraper-api": {
      "command": "node",
      "args": ["/absolute/path/to/web-scraper-api/mcp-server/dist/index.js"],
      "env": {
        "WEB_SCRAPER_API_URL": "http://localhost:3002"
      }
    }
  }
}
```

### Example usage in Cursor

Once configured, you can use natural language commands in Cursor:

- "Extract content from https://example.com"
- "Scrape these URLs: url1, url2, url3"
- "Crawl the entire website https://example.com"
- "Check if the scraping service is working"

## Requirements

- Node.js 18+
- Web Scraper API running on the configured URL (default: http://localhost:3002)
- Model Context Protocol compatible client (like Cursor)

## Error Handling

The MCP server includes robust error handling for:
- Invalid URLs
- Connection timeouts
- API service unavailability
- Invalid parameters
- Network errors

All errors are properly formatted and returned to the AI client for appropriate handling.

## Development

### Build
```bash
npm run build
```

### Development mode with auto-reload
```bash
npm run dev
```

### Lint
```bash
npm run lint
```

## Environment Variables

- `WEB_SCRAPER_API_URL`: Base URL of the Web Scraper API (default: http://localhost:3002)
- `WEB_SCRAPER_API_KEY`: API key for authentication (optional)

## License

MIT

## Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request