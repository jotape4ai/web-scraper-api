export interface ScrapeRequest {
  url: string;
  options?: ScrapeOptions;
}

export interface ScrapeOptions {
  includeHtml?: boolean;
  includeMarkdown?: boolean;
  includeScreenshot?: boolean;
  waitFor?: number;
  timeout?: number;
  userAgent?: string;
  headers?: Record<string, string>;
  excludeSelectors?: string[];
  onlyMainContent?: boolean;
}

export interface CrawlRequest {
  url: string;
  options?: CrawlOptions;
}

export interface CrawlOptions extends ScrapeOptions {
  maxPages?: number;
  maxDepth?: number;
  allowedDomains?: string[];
  excludePatterns?: string[];
  includeSubdomains?: boolean;
  respectRobotsTxt?: boolean;
}

export interface ScrapeResult {
  success: boolean;
  data?: {
    url: string;
    title?: string;
    description?: string;
    markdown?: string;
    html?: string;
    screenshot?: string;
    links?: string[];
    metadata?: {
      statusCode: number;
      headers: Record<string, string>;
      loadTime: number;
      wordCount: number;
    };
  };
  error?: string;
}

export interface CrawlJob {
  id: string;
  url: string;
  options: CrawlOptions;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
  results: ScrapeResult[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface MapRequest {
  url: string;
  options?: {
    maxDepth?: number;
    includeSubdomains?: boolean;
    respectRobotsTxt?: boolean;
  };
}

export interface MapResult {
  success: boolean;
  data?: {
    url: string;
    links: string[];
    sitemap?: string[];
  };
  error?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface BatchScrapeResult {
  results: ScrapeResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}