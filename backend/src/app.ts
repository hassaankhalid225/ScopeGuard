import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { aiEnabled } from './lib/anthropic';
import { stripeEnabled } from './lib/stripe';
import { errorHandler, notFoundHandler } from './middleware/error';

import authRoutes from './routes/auth.routes';
import clientRoutes from './routes/client.routes';
import projectRoutes from './routes/project.routes';
import invoiceRoutes from './routes/invoice.routes';
import contractRoutes from './routes/contract.routes';
import dashboardRoutes from './routes/dashboard.routes';
import portalRoutes from './routes/portal.routes';
import webhookRoutes from './routes/webhook.routes';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigins.length ? env.corsOrigins : true,
      credentials: true,
    }),
  );
  app.use(morgan(env.isProd ? 'combined' : 'dev'));

  // Stripe webhook needs the raw body — mount BEFORE the JSON parser.
  app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));

  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.isProd ? 300 : 1000,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', apiLimiter);

  // Health / capability probe
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'scopeguard-api',
      version: '1.0.0',
      ai: aiEnabled ? 'live' : 'demo',
      payments: stripeEnabled ? 'live' : 'demo',
    });
  });

  // Authenticated app routes
  app.use('/api/auth', authRoutes);
  app.use('/api/clients', clientRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/invoices', invoiceRoutes);
  app.use('/api/contracts', contractRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  // Public, token-authenticated client portal
  app.use('/api/portal', portalRoutes);

  // Webhooks
  app.use('/api/webhooks', webhookRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
