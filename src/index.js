/**
 * Modular package entrypoint facade for Gold Arbitrage Analyzer.
 * Re-exports core configuration, normalizers, arbitrage engine, and structured logger
 * without altering existing Vercel Serverless Function routes under api/.
 */
export { CONFIG } from '../js/config.js';
export { logger } from './logger.js';
export * from '../js/api/normalizer.js';
export * from '../js/services/arbitrage.js';
export { cache } from '../js/services/cache.js';
export { appState } from '../js/services/state.js';
