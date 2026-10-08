# Gold Arbitrage Analyzer

**Gold Arbitrage Analyzer** is a real-time fintech web application engineered to monitor, compare, and identify cross-exchange spatial arbitrage opportunities for gold-backed cryptocurrency tokens (**PAXG** and **XAUT**) across 8 centralized cryptocurrency exchanges (Binance, OKX, Bybit, KuCoin, HTX, Gate.io, MEXC, Bitfinex) with automated fallback.

---

## Key Features

- **Real-Time Market Data Aggregation**: Direct and edge-cached serverless polling of spot bid, ask, last price, and 24h turnover across 8 major exchanges.
- **Realistic Arbitrage Mathematical Engine**:
  - Taker-on-taker order execution model (hitting bid and lifting ask).
  - Configurable fee deductions including on-chain token transfer fees (0.02% Paxos transfer fee), CEX withdrawal fees, and Ethereum gas fees.
  - IEEE 754 precision safeguards preventing binary floating rounding artifacts.
- **Zero Phantom Spreads & Data Integrity**:
  - Live data only; zero synthetic mock merging or fabricated trading signals.
  - Transparent degraded/offline state indication for unreachable markets.
- **Edge-Cached Serverless BFF Proxy (`/api/prices`)**:
  - Pinned to Singapore (`sin1`) Edge network.
  - HTTP `Cache-Control: public, s-maxage=30, stale-while-revalidate=30` eliminates CORS blocks and regional ISP DNS restrictions while protecting public rate limits.
- **Interactive Visualizations**:
  - Real-time price comparison bar chart.
  - Optimized $O(n^2)$ spread heatmap matrix.
  - Historical price trends and spread duration tracking.
  - 24h market volume turnover doughnut distribution.
- **Institutional English Standard**: 100% standardized English UI, typography, metadata, and telemetry.
- **Hardened Browser Security**:
  - Cryptographic Subresource Integrity (SRI) hashes on all pinned external CDN dependencies.
  - Strict Content Security Policy (CSP), HSTS, and Referrer-Policy headers in `vercel.json`.
  - Safe DOM element construction eliminating XSS injection vectors.

---

## Supported Tokens & Exchanges

| Token | Symbol | Contract Fee | Supported Exchanges |
|---|:---:|:---:|---|
| **PAX Gold** | `PAXG` | 0.02% Paxos Transfer Fee | Binance, OKX, KuCoin, Gate.io, MEXC |
| **Tether Gold** | `XAUT` | 0.00% | OKX, Bybit, KuCoin, HTX, Gate.io, MEXC, Bitfinex |

---

## Architecture

```
[ Browser Client ]
        │
        ├── 1. Primary: GET /api/prices?token=PAXG (Vercel Edge Proxy, sin1)
        │         ├── Cache Hit (<30s): Instant Edge CDN delivery ($0)
        │         └── Cache Miss: Server-side fetch to CEX APIs + CoinGecko
        │
        └── 2. Fallback: Direct Browser-to-CEX calls (for local standalone testing)
```

---

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/subki72/gold-arbitrage-analyzer.git
   cd gold-arbitrage-analyzer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the automated test suite:
   ```bash
   npm test
   ```

4. Serve the application locally:
   ```bash
   npx serve .
   ```
   Open `http://localhost:3000` in your web browser.

---

## Testing

The project uses [Vitest](https://vitest.dev/) for unit testing core financial math, normalizers, and state stores.

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch
```

Automated verification is enforced via GitHub Actions on every pull request and push to `main` (`.github/workflows/ci.yml`).

---

## License

This project is licensed under the MIT License.
