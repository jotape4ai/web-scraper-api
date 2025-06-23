import puppeteer, { Browser } from 'puppeteer';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import { ScrapeOptions, ScrapeResult } from '../types';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { isValidUrl, normalizeUrl, resolveUrl } from '../utils/url';

export class ScraperService {
  private browser: Browser | null = null;
  private turndownService: TurndownService;

  constructor() {
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });
  }

  async initialize(): Promise<void> {
    if (!this.browser) {
      try {
        this.browser = await puppeteer.launch({
          headless: config.puppeteer.headless,
          args: config.puppeteer.args,
        });
        logger.info('Puppeteer browser initialized');
      } catch (error) {
        logger.error('Failed to initialize Puppeteer browser:', error);
        throw error;
      }
    }
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('Puppeteer browser closed');
    }
  }

  async scrape(url: string, options: ScrapeOptions = {}): Promise<ScrapeResult> {
    const startTime = Date.now();
    
    try {
      if (!isValidUrl(url)) {
        return {
          success: false,
          error: 'Invalid URL provided',
        };
      }

      const normalizedUrl = normalizeUrl(url);
      
      await this.initialize();
      
      if (!this.browser) {
        throw new Error('Browser not initialized');
      }

      const page = await this.browser.newPage();
      
      // Configurar headers personalizados
      if (options.headers) {
        await page.setExtraHTTPHeaders(options.headers);
      }

      // Configurar User-Agent
      await page.setUserAgent(options.userAgent || config.scraping.userAgent);

      // Navegar a la página
      const response = await page.goto(normalizedUrl, {
        waitUntil: 'networkidle2',
        timeout: options.timeout || config.puppeteer.timeout,
      });

      if (!response) {
        throw new Error('Failed to load page');
      }

      // Esperar tiempo adicional si se especifica 
      if (options.waitFor) {
        await new Promise(resolve => setTimeout(resolve, options.waitFor));
      }

      // Obtener el contenido HTML
      const html = await page.content();
      const statusCode = response.status();
      const headers = response.headers();

      // Procesar con Cheerio
      const $ = cheerio.load(html);
      
      // Remover scripts y estilos
      $('script, style, noscript').remove();
      
      // Remover selectores excluidos
      if (options.excludeSelectors) {
        options.excludeSelectors.forEach(selector => {
          $(selector).remove();
        });
      }

      // Extraer metadatos
      const title = $('title').text().trim() || $('h1').first().text().trim();
      const description = $('meta[name="description"]').attr('content') || 
                         $('meta[property="og:description"]').attr('content') || '';

      // Extraer contenido principal si se especifica
      let contentHtml = html;
      if (options.onlyMainContent) {
        const mainContent = $('main, article, .content, #content, .main').first();
        if (mainContent.length > 0) {
          contentHtml = mainContent.html() || html;
        }
      }

      // Convertir a Markdown si se solicita
      let markdown = '';
      if (options.includeMarkdown !== false) {
        const cleanHtml = $('body').html() || contentHtml;
        markdown = this.turndownService.turndown(cleanHtml);
      }

      // Extraer enlaces
      const links: string[] = [];
      $('a[href]').each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          const resolvedUrl = resolveUrl(normalizedUrl, href);
          if (isValidUrl(resolvedUrl)) {
            links.push(resolvedUrl);
          }
        }
      });

      // Tomar captura de pantalla si se solicita
      let screenshot = '';
      if (options.includeScreenshot) {
        const screenshotBuffer = await page.screenshot({ 
          fullPage: true,
          type: 'png',
        });
        screenshot = screenshotBuffer.toString('base64');
      }

      await page.close();

      const loadTime = Date.now() - startTime;
      const wordCount = markdown.split(/\s+/).length;

      return {
        success: true,
        data: {
          url: normalizedUrl,
          title,
          description,
          ...(options.includeMarkdown !== false && { markdown }),
          ...(options.includeHtml && { html: contentHtml }),
          ...(options.includeScreenshot && { screenshot }),
          links: [...new Set(links)],
          metadata: {
            statusCode,
            headers,
            loadTime,
            wordCount,
          },
        },
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Scraping failed:', { url, error: errorMessage });
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async scrapeMultiple(urls: string[], options: ScrapeOptions = {}): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = [];
    
    for (const url of urls) {
      const result = await this.scrape(url, options);
      results.push(result);
    }
    
    return results;
  }
}