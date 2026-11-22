import { describe, it, expect, vi } from 'vitest';
import healthHandler, { ErrorHandler } from '../api/health.js';

function createMockRes() {
  const headers = {};
  return {
    statusCode: 200,
    body: null,
    headers,
    setHeader(key, val) {
      headers[key] = val;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe('api/health endpoint & ErrorHandler', () => {
  it('returns HTTP 200 healthy status with supported tokens', async () => {
    const req = { url: '/api/health', method: 'GET' };
    const res = createMockRes();
    await healthHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.supportedTokens).toContain('PAXG');
    expect(res.body.supportedTokens).toContain('XAUT');
    expect(res.headers['Cache-Control']).toBe('no-store');
  });

  it('catches unhandled errors cleanly via ErrorHandler without leaking traces', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const failing = ErrorHandler(async () => {
      throw new Error('sensitive internal failure');
    });
    const res = createMockRes();
    await failing({ url: '/api/test' }, res);

    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Internal server error');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
