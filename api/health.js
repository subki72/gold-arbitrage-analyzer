/**
 * api/health.js — Liveness & readiness probe (/api/health) with centralized ErrorHandler.
 */
import { CONFIG } from '../js/config.js';
import { logger } from '../src/logger.js';

/**
 * Centralized error handler wrapper for Vercel Serverless API handlers.
 * Prevents internal stack trace leakage while recording structured error logs.
 */
export function ErrorHandler(fn) {
  return async function wrappedHandler(req, res) {
    try {
      return await fn(req, res);
    } catch (err) {
      logger.error('Unhandled API exception', {
        endpoint: req?.url || '/api/health',
        error: err?.message || String(err),
      });
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        timestamp: new Date().toISOString(),
      });
    }
  };
}

/**
 * Health check handler for `/health` and `/api/health` readiness probes.
 */
async function healthHandler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Security-Policy', "default-src 'none'");

  logger.info('Health probe requested', { path: req?.url || '/api/health' });

  return res.status(200).json({
    status: 'healthy',
    service: 'gold-arbitrage-analyzer',
    version: '1.0.0',
    supportedTokens: Object.keys(CONFIG.tokens),
    timestamp: new Date().toISOString(),
  });
}

export default ErrorHandler(healthHandler);
