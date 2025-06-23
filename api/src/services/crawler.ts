import { ScraperService } from './scraper';
import { CrawlOptions, ScrapeResult, CrawlJob } from '../types';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { isValidUrl, getDomain, isSubdomain, isSameDomain } from '../utils/url';
import { v4 as uuidv4 } from 'uuid';

export class CrawlerService {
  private scraper: ScraperService;
  private jobs: Map<string, CrawlJob> = new Map();

  constructor() {
    this.scraper = new ScraperService();
  }

  async startCrawl(url: string, options: CrawlOptions = {}): Promise<string> {
    if (!isValidUrl(url)) {
      throw new Error('Invalid URL provided');
    }

    const jobId = uuidv4();
    const job: CrawlJob = {
      id: jobId,
      url,
      options,
      status: 'pending',
      progress: {
        total: 0,
        completed: 0,
        failed: 0,
      },
      results: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.jobs.set(jobId, job);
    
    // Iniciar el crawling de forma asíncrona
    this.performCrawl(jobId).catch((error: Error) => {
      logger.error('Crawl failed:', { jobId, error: error.message });
      const job = this.jobs.get(jobId);
      if (job) {
        job.status = 'failed';
        job.updatedAt = new Date();
        this.jobs.set(jobId, job);
      }
    });

    return jobId;
  }

  async getCrawlStatus(jobId: string): Promise<CrawlJob | null> {
    return this.jobs.get(jobId) || null;
  }

  private async performCrawl(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    try {
      job.status = 'running';
      job.updatedAt = new Date();
      this.jobs.set(jobId, job);

      const { url, options } = job;
      const maxPages = Math.min(options.maxPages || 10, config.scraping.maxPagesPerCrawl);
      const maxDepth = options.maxDepth || 3;
      const domain = getDomain(url);

      if (!domain) {
        throw new Error('Could not extract domain from URL');
      }

      const visited = new Set<string>();
      const toVisit: Array<{ url: string; depth: number }> = [{ url, depth: 0 }];
      const results: ScrapeResult[] = [];

      while (toVisit.length > 0 && results.length < maxPages) {
        const current = toVisit.shift();
        if (!current || visited.has(current.url)) continue;

        visited.add(current.url);
        
        logger.info('Crawling:', { url: current.url, depth: current.depth });

        // Scrape la página actual
        const result = await this.scraper.scrape(current.url, {
          includeHtml: options.includeHtml,
          includeMarkdown: options.includeMarkdown,
          includeScreenshot: options.includeScreenshot,
          timeout: options.timeout,
          userAgent: options.userAgent,
          headers: options.headers,
          excludeSelectors: options.excludeSelectors,
          onlyMainContent: options.onlyMainContent,
        });

        results.push(result);

        // Actualizar progreso
        job.progress.completed++;
        if (!result.success) {
          job.progress.failed++;
        }
        job.progress.total = Math.max(job.progress.total, visited.size + toVisit.length);
        job.results = results;
        job.updatedAt = new Date();
        this.jobs.set(jobId, job);

        // Si el scraping fue exitoso y no hemos alcanzado la profundidad máxima
        if (result.success && result.data && current.depth < maxDepth) {
          const links = result.data.links || [];
          
          for (const link of links) {
            if (visited.has(link) || toVisit.some(item => item.url === link)) {
              continue;
            }

            // Verificar si el enlace cumple con los criterios
            if (this.shouldCrawlUrl(link, domain, options)) {
              toVisit.push({ url: link, depth: current.depth + 1 });
            }
          }
        }
      }

      job.status = 'completed';
      job.completedAt = new Date();
      job.updatedAt = new Date();
      job.progress.total = results.length;
      this.jobs.set(jobId, job);

      logger.info('Crawl completed:', { 
        jobId, 
        totalPages: results.length, 
        successful: results.filter(r => r.success).length 
      });

    } catch (error) {
      job.status = 'failed';
      job.updatedAt = new Date();
      this.jobs.set(jobId, job);
      throw error;
    }
  }

  private shouldCrawlUrl(url: string, baseDomain: string, options: CrawlOptions): boolean {
    try {
      if (!isValidUrl(url)) return false;

      // Verificar dominios permitidos
      if (options.allowedDomains && options.allowedDomains.length > 0) {
        const urlDomain = getDomain(url);
        if (!urlDomain || !options.allowedDomains.includes(urlDomain)) {
          return false;
        }
      } else {
        // Si no se especifican dominios permitidos, verificar si es el mismo dominio o subdominio
        if (options.includeSubdomains) {
          if (!isSubdomain(url, baseDomain)) return false;
        } else {
          if (!isSameDomain(url, `https://${baseDomain}`)) return false;
        }
      }

      // Verificar patrones excluidos
      if (options.excludePatterns) {
        for (const pattern of options.excludePatterns) {
          if (url.includes(pattern)) return false;
        }
      }

      // Excluir archivos comunes que no queremos crawlear
      const excludedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.zip', '.rar', '.exe', '.dmg'];
      const lowerUrl = url.toLowerCase();
      if (excludedExtensions.some(ext => lowerUrl.endsWith(ext))) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  async cleanup(): Promise<void> {
    await this.scraper.cleanup();
  }

  // Limpiar trabajos antiguos (llamar periódicamente)
  cleanupOldJobs(maxAgeHours = 24): void {
    const maxAge = maxAgeHours * 60 * 60 * 1000;
    const now = Date.now();
    
    for (const [jobId, job] of this.jobs.entries()) {
      if (now - job.createdAt.getTime() > maxAge) {
        this.jobs.delete(jobId);
      }
    }
  }
}