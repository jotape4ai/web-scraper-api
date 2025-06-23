import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { ScraperService } from './scraper';
import { CrawlerService } from './crawler';
import { ScrapeRequest, CrawlRequest } from '../types';

export class QueueService {
  private redis: Redis;
  private scrapeQueue: Queue;
  private crawlQueue: Queue;
  private scrapeWorker!: Worker;
  private crawlWorker!: Worker;
  private scraperService: ScraperService;
  private crawlerService: CrawlerService;

  constructor() {
    this.redis = new Redis(config.redis.url);
    
    this.scrapeQueue = new Queue('scrape', { 
      connection: this.redis,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    this.crawlQueue = new Queue('crawl', { 
      connection: this.redis,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 25,
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    });

    this.scraperService = new ScraperService();
    this.crawlerService = new CrawlerService();

    this.setupWorkers();
  }

  private setupWorkers(): void {
    // Worker para scraping individual
    this.scrapeWorker = new Worker(
      'scrape',
      async (job: Job<ScrapeRequest>) => {
        const { url, options } = job.data;
        logger.info('Processing scrape job:', { jobId: job.id, url });
        
        const result = await this.scraperService.scrape(url, options);
        
        if (!result.success) {
          throw new Error(result.error || 'Scraping failed');
        }
        
        return result;
      },
      {
        connection: this.redis,
        concurrency: config.workers.numWorkers,
      }
    );

    // Worker para crawling
    this.crawlWorker = new Worker(
      'crawl',
      async (job: Job<CrawlRequest>) => {
        const { url, options } = job.data;
        logger.info('Processing crawl job:', { jobId: job.id, url });
        
        const crawlId = await this.crawlerService.startCrawl(url, options);
        
        // Esperar a que termine el crawl
        let crawlJob;
        do {
          await new Promise(resolve => setTimeout(resolve, 1000));
          crawlJob = await this.crawlerService.getCrawlStatus(crawlId);
        } while (crawlJob && crawlJob.status === 'running');
        
        if (!crawlJob || crawlJob.status === 'failed') {
          throw new Error('Crawling failed');
        }
        
        return crawlJob;
      },
      {
        connection: this.redis,
        concurrency: Math.max(1, Math.floor(config.workers.numWorkers / 2)),
      }
    );

    // Event handlers
    this.scrapeWorker.on('completed', (job) => {
      logger.info('Scrape job completed:', { jobId: job.id });
    });

    this.scrapeWorker.on('failed', (job, err) => {
      logger.error('Scrape job failed:', { jobId: job?.id, error: err.message });
    });

    this.crawlWorker.on('completed', (job) => {
      logger.info('Crawl job completed:', { jobId: job.id });
    });

    this.crawlWorker.on('failed', (job, err) => {
      logger.error('Crawl job failed:', { jobId: job?.id, error: err.message });
    });
  }

  async addScrapeJob(request: ScrapeRequest): Promise<string> {
    const job = await this.scrapeQueue.add('scrape', request);
    return job.id!;
  }

  async addCrawlJob(request: CrawlRequest): Promise<string> {
    const job = await this.crawlQueue.add('crawl', request);
    return job.id!;
  }

  async getJobStatus(jobId: string, queueType: 'scrape' | 'crawl') {
    const queue = queueType === 'scrape' ? this.scrapeQueue : this.crawlQueue;
    const job = await queue.getJob(jobId);
    
    if (!job) {
      return null;
    }

    return {
      id: job.id,
      status: await job.getState(),
      progress: job.progress,
      data: job.returnvalue,
      error: job.failedReason,
      createdAt: new Date(job.timestamp),
      processedAt: job.processedOn ? new Date(job.processedOn) : null,
      finishedAt: job.finishedOn ? new Date(job.finishedOn) : null,
    };
  }

  async getQueueStats() {
    const scrapeStats = await this.scrapeQueue.getWaiting();
    const crawlStats = await this.crawlQueue.getWaiting();

    return {
      scrapeQueue: {
        waiting: scrapeStats.length,
        active: (await this.scrapeQueue.getActive()).length,
        completed: (await this.scrapeQueue.getCompleted()).length,
        failed: (await this.scrapeQueue.getFailed()).length,
      },
      crawlQueue: {
        waiting: crawlStats.length,
        active: (await this.crawlQueue.getActive()).length,
        completed: (await this.crawlQueue.getCompleted()).length,
        failed: (await this.crawlQueue.getFailed()).length,
      },
    };
  }

  async cleanup(): Promise<void> {
    await this.scrapeWorker.close();
    await this.crawlWorker.close();
    await this.scrapeQueue.close();
    await this.crawlQueue.close();
    await this.scraperService.cleanup();
    await this.crawlerService.cleanup();
    this.redis.disconnect();
  }
}