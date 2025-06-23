import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import {
  ScrapeRequest,
  ScrapeOptions,
  CrawlRequest,
  CrawlOptions,
  ScrapeResult,
  CrawlJob,
  BatchScrapeResult,
  ApiResponse,
  WebScraperApiClientConfig
} from './types';

export class WebScraperApiClient {
  private http: AxiosInstance;
  private baseUrl: string;

  constructor(config: WebScraperApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:3002';
    
    this.http = axios.create({
      baseURL: this.baseUrl,
      timeout: config.timeout || 30000,
    });

    // Configurar headers si se proporciona API key
    if (config.apiKey) {
      this.http.defaults.headers.common['Authorization'] = `Bearer ${config.apiKey}`;
    }
  }

  /**
   * Check the health status of the API
   */
  async health(): Promise<ApiResponse> {
    const response = await this.http.get('/health');
    return response.data;
  }

  /**
   * Scrape an individual URL
   */
  async scrape(url: string, options: ScrapeOptions = {}): Promise<ScrapeResult> {
    const request: ScrapeRequest = { url, options };
    const response = await this.http.post<ApiResponse<ScrapeResult['data']>>('/api/scrape', request);
    
    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        error: response.data.error,
      };
    }
  }

  /**
   * Scrape multiple URLs in batch
   */
  async scrapeBatch(urls: string[], options: ScrapeOptions = {}): Promise<BatchScrapeResult> {
    const response = await this.http.post<ApiResponse<BatchScrapeResult>>('/api/scrape/batch', {
      urls,
      options,
    });
    
    if (response.data.success) {
      return response.data.data!;
    } else {
      throw new Error(response.data.error || 'Batch scrape failed');
    }
  }

  /**
   * Start a crawling job
   */
  async startCrawl(url: string, options: CrawlOptions = {}): Promise<string> {
    const request: CrawlRequest = { url, options };
    const response = await this.http.post<ApiResponse<{ id: string }>>('/api/crawl', request);
    
    if (response.data.success) {
      return response.data.data!.id;
    } else {
      throw new Error(response.data.error || 'Failed to start crawl');
    }
  }

  /**
   * Get the status of a crawling job
   */
  async getCrawlStatus(jobId: string): Promise<CrawlJob> {
    const response = await this.http.get<ApiResponse<CrawlJob>>(`/api/crawl/${jobId}`);
    
    if (response.data.success) {
      return response.data.data!;
    } else {
      throw new Error(response.data.error || 'Failed to get crawl status');
    }
  }

  /**
   * Wait for a crawling job to complete
   */
  async waitForCrawl(jobId: string, maxWaitTimeMs = 60000, checkIntervalMs = 1000): Promise<CrawlJob> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTimeMs) {
      const job = await this.getCrawlStatus(jobId);
      
      if (job.status === 'completed' || job.status === 'failed') {
        return job;
      }
      
      await new Promise(resolve => setTimeout(resolve, checkIntervalMs));
    }
    
    throw new Error('Timeout waiting for crawl to complete');
  }

  /**
   * Scrape with URL validation
   */
  async safeScrape(url: string, options: ScrapeOptions = {}): Promise<ScrapeResult> {
    if (!this.isValidUrl(url)) {
      return {
        success: false,
        error: 'Invalid URL provided',
      };
    }
    
    try {
      return await this.scrape(url, options);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Complete crawl with automatic waiting
   */
  async crawlComplete(url: string, options: CrawlOptions = {}): Promise<CrawlJob> {
    const jobId = await this.startCrawl(url, options);
    return await this.waitForCrawl(jobId);
  }

  /**
   * Utility to validate URLs
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}