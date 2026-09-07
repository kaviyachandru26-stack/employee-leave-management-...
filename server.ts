import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { config } from './server/src/config/index.js';
import { logger } from './server/src/utils/logger.js';
import apiRouter from './server/src/routes/index.js';
import { errorHandler } from './server/src/middleware/errorHandler.js';

async function startServer() {
  const app = express();
  const PORT = config.port;

  // Basic security and request parsing
  app.use(cors({
    origin: config.cors.origin,
    credentials: true,
  }));
  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logger
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (req.path.startsWith('/api')) {
        logger.info(`${req.method} ${req.originalUrl} [${res.statusCode}] - ${duration}ms`);
      }
    });
    next();
  });

  // Mount API routes FIRST
  app.use('/api', apiRouter);

  // Centralized Error Handling for API routes
  app.use(errorHandler);

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`HRFlow Server running on http://0.0.0.0:${PORT} [${config.env}]`);
  });
}

startServer().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
