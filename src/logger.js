/**
 * Structured leveled logger for Gold Arbitrage Analyzer.
 * Outputs JSON-formatted structured logs across browser and Node.js runtimes.
 */
export const logger = {
  info(message, context = {}) {
    const entry = {
      level: 'INFO',
      timestamp: new Date().toISOString(),
      message,
      ...context,
    };
    console.info(JSON.stringify(entry));
  },

  warn(message, context = {}) {
    const entry = {
      level: 'WARN',
      timestamp: new Date().toISOString(),
      message,
      ...context,
    };
    console.warn(JSON.stringify(entry));
  },

  error(message, context = {}) {
    const entry = {
      level: 'ERROR',
      timestamp: new Date().toISOString(),
      message,
      ...context,
    };
    console.error(JSON.stringify(entry));
  },
};
