#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  CallToolRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { WebScraperApiClient, ScrapeOptions, CrawlOptions } from 'web-scraper-api-sdk';

// MCP server configuration
const server = new Server(
  {
    name: 'web-scraper-api',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Scraping API client
let webScraperApiClient: WebScraperApiClient;

// Initialize the client
function initializeClient(): WebScraperApiClient {
  if (!webScraperApiClient) {
    const baseUrl = process.env.WEB_SCRAPER_API_URL || 'http://localhost:3002';
    const apiKey = process.env.WEB_SCRAPER_API_KEY;
    
    webScraperApiClient = new WebScraperApiClient({
      baseUrl,
      apiKey,
      timeout: 60000, // 60 seconds
    });
  }
  return webScraperApiClient;
}

// Handler to list available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'scrape_url',
        description: 'Extract content from a specific URL. Convert web pages to clean text, Markdown or HTML.',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The URL to scrape (must be valid and accessible)',
            },
            includeMarkdown: {
              type: 'boolean',
              description: 'Include content converted to Markdown (default: true)',
              default: true,
            },
            includeHtml: {
              type: 'boolean',
              description: 'Include raw HTML (default: false)',
              default: false,
            },
            includeScreenshot: {
              type: 'boolean',
              description: 'Include screenshot in base64 (default: false)',
              default: false,
            },
            onlyMainContent: {
              type: 'boolean',
              description: 'Extract only the main content of the page (default: false)',
              default: false,
            },
            waitFor: {
              type: 'number',
              description: 'Additional wait time in milliseconds before extracting content',
            },
            timeout: {
              type: 'number',
              description: 'Request timeout in milliseconds (default: 30000)',
            },
            userAgent: {
              type: 'string',
              description: 'Custom User-Agent for the request',
            },
            excludeSelectors: {
              type: 'array',
              items: { type: 'string' },
              description: 'CSS selectors of elements to exclude from content',
            },
          },
          required: ['url'],
        },
      },
      {
        name: 'scrape_batch',
        description: 'Extract content from multiple URLs in a single operation (maximum 10 URLs).',
        inputSchema: {
          type: 'object',
          properties: {
            urls: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of URLs to scrape (maximum 10)',
              maxItems: 10,
            },
            includeMarkdown: {
              type: 'boolean',
              description: 'Include content converted to Markdown (default: true)',
              default: true,
            },
            includeHtml: {
              type: 'boolean',
              description: 'Include raw HTML (default: false)',
              default: false,
            },
            onlyMainContent: {
              type: 'boolean',
              description: 'Extract only the main content of pages (default: false)',
              default: false,
            },
            timeout: {
              type: 'number',
              description: 'Timeout per request in milliseconds (default: 30000)',
            },
          },
          required: ['urls'],
        },
      },
      {
        name: 'crawl_website',
        description: 'Crawl a complete website following links. Useful for extracting all content from a site.',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The base URL of the website to crawl',
            },
            maxPages: {
              type: 'number',
              description: 'Maximum number of pages to crawl (default: 10, max: 50)',
              default: 10,
              maximum: 50,
            },
            maxDepth: {
              type: 'number',
              description: 'Maximum crawling depth (default: 3)',
              default: 3,
            },
            includeSubdomains: {
              type: 'boolean',
              description: 'Include subdomains in crawling (default: false)',
              default: false,
            },
            includeMarkdown: {
              type: 'boolean',
              description: 'Include content converted to Markdown (default: true)',
              default: true,
            },
            excludePatterns: {
              type: 'array',
              items: { type: 'string' },
              description: 'URL patterns to exclude from crawling',
            },
            allowedDomains: {
              type: 'array',
              items: { type: 'string' },
              description: 'Specific domains allowed for crawling',
            },
          },
          required: ['url'],
        },
      },
      {
        name: 'check_crawl_status',
        description: 'Check the status of an ongoing crawling job.',
        inputSchema: {
          type: 'object',
          properties: {
            jobId: {
              type: 'string',
              description: 'ID of the crawling job to check',
            },
          },
          required: ['jobId'],
        },
      },
      {
        name: 'health_check',
        description: 'Check that the scraping service is available and working.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Handler to execute tools
server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  const { name, arguments: args } = request.params;

  try {
    const client = initializeClient();

    switch (name) {
      case 'health_check': {
        const health = await client.health();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(health, null, 2),
            },
          ],
        };
      }

      case 'scrape_url': {
        const { url, ...options } = (args as unknown) as { url: string } & ScrapeOptions;
        
        if (!url) {
          throw new McpError(ErrorCode.InvalidParams, 'URL is required');
        }

        const result = await client.scrape(url, options);
        
        if (!result.success) {
          throw new McpError(ErrorCode.InternalError, `Scraping error: ${result.error}`);
        }

        const content = [];
        
        // Basic information
        content.push({
          type: 'text',
          text: `🔥 **Scraping Successful**\n\n` +
                `**URL:** ${result.data?.url}\n` +
                `**Title:** ${result.data?.title || 'Not available'}\n` +
                `**Description:** ${result.data?.description || 'Not available'}\n\n` +
                `**Metadata:**\n` +
                `- Status code: ${result.data?.metadata?.statusCode}\n` +
                `- Load time: ${result.data?.metadata?.loadTime}ms\n` +
                `- Word count: ${result.data?.metadata?.wordCount}\n` +
                `- Links found: ${result.data?.links?.length || 0}\n\n`,
        });

        // Markdown content
        if (result.data?.markdown) {
          content.push({
            type: 'text',
            text: `**Content (Markdown):**\n\n${result.data.markdown}`,
          });
        }

        // HTML if requested
        if (result.data?.html) {
          content.push({
            type: 'text',
            text: `**HTML:**\n\`\`\`html\n${result.data.html.substring(0, 2000)}${result.data.html.length > 2000 ? '...' : ''}\n\`\`\``,
          });
        }

        // Links
        if (result.data?.links && result.data.links.length > 0) {
          content.push({
            type: 'text',
            text: `**Links found (${result.data.links.length}):**\n${result.data.links.slice(0, 20).map((link: string) => `- ${link}`).join('\n')}${result.data.links.length > 20 ? '\n... and more' : ''}`,
          });
        }

        return { content };
      }

      case 'scrape_batch': {
        const { urls, ...options } = (args as unknown) as { urls: string[] } & ScrapeOptions;
        
        if (!urls || !Array.isArray(urls) || urls.length === 0) {
          throw new McpError(ErrorCode.InvalidParams, 'URLs array is required');
        }

        if (urls.length > 10) {
          throw new McpError(ErrorCode.InvalidParams, 'Maximum 10 URLs allowed per batch');
        }

        const result = await client.scrapeBatch(urls, options);
        
        let content = `🔥 **Batch Scraping Completed**\n\n` +
                     `**Summary:**\n` +
                     `- Total: ${result.summary.total}\n` +
                     `- Successful: ${result.summary.successful}\n` +
                     `- Failed: ${result.summary.failed}\n\n`;

        // Process each result
        result.results.forEach((res: any, index: number) => {
          if (res.success && res.data) {
            content += `### ${index + 1}. ${res.data.url} ✅\n`;
            content += `**Title:** ${res.data.title || 'Not available'}\n`;
            content += `**Word count:** ${res.data.metadata?.wordCount || 0}\n`;
            if (res.data.markdown) {
              content += `**Content:**\n${res.data.markdown.substring(0, 500)}${res.data.markdown.length > 500 ? '...' : ''}\n\n`;
            }
          } else {
            content += `### ${index + 1}. ${urls[index]} ❌\n`;
            content += `**Error:** ${res.error}\n\n`;
          }
        });

        return {
          content: [
            {
              type: 'text',
              text: content,
            },
          ],
        };
      }

      case 'crawl_website': {
        const { url, ...options } = (args as unknown) as { url: string } & CrawlOptions;
        
        if (!url) {
          throw new McpError(ErrorCode.InvalidParams, 'URL is required');
        }

        const jobId = await client.startCrawl(url, options);
        
        // Wait for the crawl to complete (maximum 5 minutes)
        const job = await client.waitForCrawl(jobId, 300000, 2000);
        
        let content = `🔥 **Crawling Completed**\n\n` +
                     `**Base URL:** ${job.url}\n` +
                     `**Status:** ${job.status}\n` +
                     `**Pages processed:** ${job.progress.completed}\n` +
                     `**Successful:** ${job.results.filter((r: any) => r.success).length}\n` +
                     `**Failed:** ${job.progress.failed}\n\n`;

        if (job.status === 'completed') {
          content += `**Results per page:**\n\n`;
          
          job.results.forEach((result: any, index: number) => {
            if (result.success && result.data) {
              content += `### ${index + 1}. ${result.data.url} ✅\n`;
              content += `**Title:** ${result.data.title || 'Not available'}\n`;
              content += `**Word count:** ${result.data.metadata?.wordCount || 0}\n`;
              if (result.data.markdown) {
                content += `**Content:**\n${result.data.markdown.substring(0, 300)}${result.data.markdown.length > 300 ? '...' : ''}\n\n`;
              }
            } else {
              content += `### ${index + 1}. Error ❌\n`;
              content += `**Error:** ${result.error}\n\n`;
            }
          });
        } else {
          content += `**Status:** ${job.status}\n`;
          if (job.status === 'failed') {
            content += `Crawling failed. Check configuration and connectivity.\n`;
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: content,
            },
          ],
        };
      }

      case 'check_crawl_status': {
        const { jobId } = args as { jobId: string };
        
        if (!jobId) {
          throw new McpError(ErrorCode.InvalidParams, 'Job ID is required');
        }

        const job = await client.getCrawlStatus(jobId);
        
        const content = `🔥 **Crawling Status**\n\n` +
                       `**Job ID:** ${job.id}\n` +
                       `**URL:** ${job.url}\n` +
                       `**Status:** ${job.status}\n` +
                       `**Progress:** ${job.progress.completed}/${job.progress.total}\n` +
                       `**Successful:** ${job.results.filter((r: any) => r.success).length}\n` +
                       `**Failed:** ${job.progress.failed}\n` +
                       `**Created:** ${job.createdAt}\n` +
                       `**Updated:** ${job.updatedAt}\n` +
                       (job.completedAt ? `**Completed:** ${job.completedAt}\n` : '');

        return {
          content: [
            {
              type: 'text',
              text: content,
            },
          ],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    
    throw new McpError(
      ErrorCode.InternalError,
      `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
});

// Initialize the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🔥 Web Scraper API MCP Server started');
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

main().catch((error) => {
  console.error('Error starting server:', error);
  process.exit(1);
});