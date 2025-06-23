import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './utils/config';
import { logger } from './utils/logger';
import scrapeRoutes from './routes/scrape';
import crawlRoutes from './routes/crawl';

// Configure rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.requests,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
  },
});

// Create Express application
const app = express();

// Security middlewares
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting
app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Web Scraper API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Hello, world!',
  });
});

// API routes
app.use('/api', scrapeRoutes);
app.use('/api', crawlRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Start server
const server = app.listen(config.server.port, config.server.host, () => {
  logger.info(`Web Scraper API running on http://${config.server.host}:${config.server.port}`);
  logger.info(`Health check: http://${config.server.host}:${config.server.port}/health`);
  logger.info(`Test endpoint: http://${config.server.host}:${config.server.port}/test`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;