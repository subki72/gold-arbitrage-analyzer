# Architecture Specification — Gold Arbitrage Analyzer

## 1. System Topology
- **Client Terminal (`index.html`, `index.css`, `js/`)**: Full-width reactive dark trading dashboard with Chart.js visualizations, spread matrix heatmap, and realistic net-profit calculator.
- **Modular Facade (`src/index.js`, `src/logger.js`)**: Standard library export surface and structured JSON leveled logger (`INFO`, `WARN`, `ERROR`).
- **Serverless BFF Proxy (`api/prices.js`, `api/health.js`)**: Vercel Serverless Functions pinned to Singapore (`sin1`) edge network with 30-second public CDN caching (`s-maxage=30, stale-while-revalidate=30`) and CoinGecko ticker fallback.

## 2. API Endpoints
- `GET /api/prices?token=PAXG|XAUT`: Aggregates normalized live bid/ask order book quotes across 8 centralized exchanges with strict 7-second per-exchange timeout protection.
- `GET /api/health`: Liveness and readiness JSON diagnostic endpoint wrapped with centralized `ErrorHandler`.

## 3. Data Integrity & Security Invariants
- Zero synthetic or mocked prices in live production pipelines.
- Taker-on-taker best ask vs. best bid spread calculation with explicit on-chain Paxos fee (0.02%), withdrawal cost, and gas fee deductions.
- Hardened CSP, HSTS, and SRI protections configured via `vercel.json`.
