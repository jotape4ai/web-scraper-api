import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3002'),
    host: process.env.HOST || '0.0.0.0',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  workers: {
    numWorkers: parseInt(process.env.NUM_WORKERS || '4'),
  },
  rateLimit: {
    requests: parseInt(process.env.RATE_LIMIT_REQUESTS || '100'),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  },
  scraping: {
    maxPagesPerCrawl: parseInt(process.env.MAX_PAGES_PER_CRAWL || '50'),
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '30000'),
    userAgent: process.env.USER_AGENT || 'ScrapeBot/1.0',
  },
  puppeteer: {
    headless: process.env.PUPPETEER_HEADLESS === 'true',
    timeout: parseInt(process.env.PUPPETEER_TIMEOUT || '30000'),
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
    ],
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};