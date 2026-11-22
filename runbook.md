# Operational Runbook — Gold Arbitrage Analyzer

## 1. Health & Diagnostics
- **Liveness Probe**: `GET /api/health` -> expects HTTP `200` with `{"status": "healthy"}`.
- **Market Proxy Probe**: `GET /api/prices?token=PAXG` -> expects HTTP `200` with `count >= 2`.

## 2. Common Incidents & Remediation
| Symptom | Probable Cause | Remediation |
|---|---|---|
| Exchange feed displays `Offline` | Exchange API maintenance or regional rate-limiting | Confirm upstream status; CoinGecko fallback automatically covers missing pairs. |
| Fewer than 2 active exchanges | Upstream network outage or ISP DNS filtering | Verify Vercel Edge region remains pinned to `sin1` in `vercel.json`. |
| HTTP `500` from serverless API | Uncaught runtime exception | Inspect Vercel structured JSON logs emitted by `src/logger.js` and `ErrorHandler`. |

## 3. Rollback Procedure
Promote the previous verified deployment in Vercel Dashboard or redeploy pinned semantic git tag `v1.0.0`.
