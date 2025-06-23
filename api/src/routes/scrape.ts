import { Router, Request, Response } from 'express';
import { ScraperService } from '../services/scraper';
import { isValidUrl } from '../utils/url';
import { ApiResponse, ScrapeRequest } from '../types';

const router = Router();
const scraperService = new ScraperService();

// POST /scrape - Scrape una URL individual
router.post('/scrape', async (req: Request, res: Response) => {
  try {
    const { url, options = {} }: ScrapeRequest = req.body;

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

    const result = await scraperService.scrape(url, options);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: result.data,
    } as ApiResponse);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    } as ApiResponse);
  }
});

// POST /scrape/batch - Scrape múltiples URLs
router.post('/scrape/batch', async (req: Request, res: Response) => {
  try {
    const { urls, options = {} } = req.body;

    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'URLs array is required and must not be empty',
      } as ApiResponse);
    }

    if (urls.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 10 URLs allowed per batch request',
      } as ApiResponse);
    }

    // Validar todas las URLs
    for (const url of urls) {
      if (!isValidUrl(url)) {
        return res.status(400).json({
          success: false,
          error: `Invalid URL format: ${url}`,
        } as ApiResponse);
      }
    }

    const results = await scraperService.scrapeMultiple(urls, options);

    res.json({
      success: true,
      data: {
        results,
        summary: {
          total: results.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
        },
      },
    } as ApiResponse);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    } as ApiResponse);
  }
});

export default router;