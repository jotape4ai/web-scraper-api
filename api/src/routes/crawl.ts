import { Router, Request, Response } from 'express';
import { CrawlerService } from '../services/crawler';
import { isValidUrl } from '../utils/url';
import { ApiResponse, CrawlRequest } from '../types';

const router = Router();
const crawlerService = new CrawlerService();

// POST /crawl - Iniciar un crawl
router.post('/crawl', async (req: Request, res: Response) => {
  try {
    const { url, options = {} }: CrawlRequest = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required',
      } as ApiResponse);
    }

    if (!isValidUrl(url)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format',
      } as ApiResponse);
    }

    const jobId = await crawlerService.startCrawl(url, options);

    res.json({
      success: true,
      data: {
        id: jobId,
        url: `/api/crawl/${jobId}`,
        message: 'Crawl job started successfully',
      },
    } as ApiResponse);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    } as ApiResponse);
  }
});

// GET /crawl/:jobId - Obtener el estado de un crawl
router.get('/crawl/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required',
      } as ApiResponse);
    }

    const job = await crawlerService.getCrawlStatus(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Crawl job not found',
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: job,
    } as ApiResponse);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    } as ApiResponse);
  }
});

export default router;