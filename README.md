# Gold Arbitrage Analyzer

[![CI](https://github.com/subki72/gold-arbitrage-analyzer/actions/workflows/ci.yml/badge.svg)](https://github.com/subki72/gold-arbitrage-analyzer/actions/workflows/ci.yml)
[![Maturity Grade: Production](https://img.shields.io/badge/Maturity%20Grade-Production%20(71.8%2F100)-success.svg)](https://github.com/subki72/gold-arbitrage-analyzer)
[![Tests](https://img.shields.io/badge/tests-67%20passed-success?logo=vitest)](https://github.com/subki72/gold-arbitrage-analyzer/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-gold.svg)](LICENSE)

**Gold Arbitrage Analyzer** is an institutional-grade, real-time fintech web application engineered to monitor, compare, and identify cross-exchange spatial arbitrage opportunities for gold-backed cryptocurrency tokens (**PAXG** and **XAUT**) across 8 centralized cryptocurrency exchanges (Binance, OKX, Bybit, KuCoin, HTX, Gate.io, MEXC, Bitfinex).

Built with a high-performance **Serverless Backend-for-Frontend (BFF)** proxy and a responsive, **full-width fluid dark trading terminal**, the application provides institutional data accuracy, transparent market status indicators, and realistic net profit calculations factoring in execution slippage, withdrawal costs, and blockchain fees.

---

## Key Features

### 1. Zero Synthetic Data & Absolute Data Integrity
- **100% Real Market Data**: Complete elimination of fabricated mock data or synthetic price generators.
- **Zero Phantom Spreads**: Direct protection against artificial arbitrage hallucinations by exclusively matching live ticker order book quotes.
- **Transparent Degraded State**: Unreachable exchange feeds display clear `Offline` badges and placeholders (`—`) rather than vanishing or falsifying prices.
- **Global Alert Banner**: Dynamically warns users whenever fewer than 2 active exchanges respond, preventing misleading arbitrage signals.

### 2. Realistic Arbitrage Financial Model
- **Taker-on-Taker Execution**: Automatically charges taker fee rates when executing against market bids and asks, preventing overstated profit projections.
- **Best Ask vs. Best Bid Matching**: Pair selection matches the lowest available `ask` (Buy) against the highest available `bid` (Sell) rather than lagging `last` prices.
- **Comprehensive Cost Deduction**: The built-in interactive calculator models:
  - **Paxos Smart Contract Transfer Fee** (0.02% burned on-chain for PAXG ERC-20 transfers).
  - **CEX Withdrawal Fees** (configurable fixed dollar deduction, e.g. 0.003 PAXG ≈ $12.50).
  - **Ethereum Network Gas Fees** (customizable on-chain gas costs).
- **IEEE 754 Precision Safeguards**: Numerical calculations utilize precision rounding to avoid floating-point display artifacts.

### 3. Edge-Cached Serverless BFF Proxy (`/api/prices`)
- **Regional ISP DNS Filtering & CORS Bypass**: Requests routed through a Vercel Serverless Function deployed to the Singapore (`sin1`) Edge network, ensuring seamless connectivity for users in restricted jurisdictions (e.g. Indonesia *TrustPositif* / *Internet Baik*).
- **Public CDN Edge Caching**: Configured with `Cache-Control: public, s-maxage=30, stale-while-revalidate=30`, caching market snapshots at the Edge for 30 seconds.
- **Zero-Cost Operation ($0/mo)**: Caps origin serverless invocations to ~86,400 per month, operating comfortably within Vercel's free Hobby Tier (100,000 monthly quota) regardless of traffic volume.
- **Automatic Multi-Tier Fallback**: Queries primary CEX APIs concurrently server-side, with automated fallback to CoinGecko for unlisted/missing pairs.

### 4. Full-Width Ultrawide Trading Terminal UI
- **Fluid Edge-to-Edge Layout**: Completely unconstrained by arbitrary 1440px limits; dynamically stretches across standard, widescreen (1440p, 4K), and 21:9 / 32:9 ultrawide displays.
- **Interactive Visualizations**:
  - **Price Comparison Bar Chart**: Horizontal bar chart comparing spot prices with custom scaling.
  - **Spread Heatmap Matrix**: $O(n^2)$ pre-calculated matrix with color-coded positive/negative arbitrage spreads and highest-spread highlighting.
  - **Historical Price Trend Line Chart**: Multi-timeframe trend view (1H, 4H, 24H, 7D).
  - **24h Volume Turnover Chart**: Market volume doughnut distribution across active exchanges.
- **Perfect Header Alignment**: Logo on the left, token selector (PAXG ↔ XAUT) mathematically centered in the viewport, and controls/clock on the right.

### 5. Enterprise State Isolation & Caching
- **Reactive Pub/Sub Architecture**: Centralized store (`appState`) coordinates state across components without cross-contamination.
- **Asset State Isolation**: Toggling between PAXG and XAUT completely isolates and resets historical line series, preventing cross-asset price contamination and dropdown lockups.
- **Inverted Cache Fix**: Manual "Refresh Now" button immediately purges cache before querying, while background intervals respect the 30-second TTL.

### 6. Hardened Browser Security
- **Subresource Integrity (SRI)**: Pinned external CDN scripts (Lucide Icons, Chart.js) secured with cryptographic SHA-384 integrity hashes.
- **Strict HTTP Security Headers**: Production `vercel.json` enforces:
  - `Content-Security-Policy` (CSP)
  - `Strict-Transport-Security` (HSTS) with `max-age=63072000; includeSubDomains; preload`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `X-Content-Type-Options: nosniff` and `X-Frame-Options: DENY`
- **XSS-Immune DOM Manipulation**: Dynamic elements constructed via safe `createElement()` and `replaceChildren()` rather than unsanitized `innerHTML`.

### 7. 100% Institutional English Standard
- Complete internationalization across all UI labels, KPI cards, table columns, tooltips, alert banners, and code documentation.

---

## Supported Tokens & Exchanges

| Token | Symbol | Contract Fee | Underlying Asset | Supported Exchanges |
|---|:---:|:---:|:---:|---|
| **PAX Gold** | `PAXG` | 0.02% (Paxos On-Chain) | 1 Fine Troy Ounce LBMA Gold | Binance, OKX, KuCoin, Gate.io, MEXC |
| **Tether Gold** | `XAUT` | 0.00% | 1 Fine Troy Ounce Gold | OKX, Bybit, KuCoin, HTX, Gate.io, MEXC, Bitfinex |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Client Web Browser                            │
│           (Full-width Trading Terminal: Charts, Heatmap, Table)         │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                 GET /api/prices?token=PAXG (every 30s)
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Vercel Edge CDN Cache (sin1)                         │
│             Cache-Control: public, s-maxage=30, swr=30                  │
└──────────────────┬──────────────────────────────────┬───────────────────┘
                   │ Cache HIT (<30s)                 │ Cache MISS
                   ▼                                  ▼
        [ Instant JSON Response ]         ┌───────────────────────────────┐
             ($0 / Zero Delay)            │ Vercel Serverless Function    │
                                          │ (/api/prices.js, Node.js ES)  │
                                          └───────────────┬───────────────┘
                                                          │
                         ┌────────────────────────────────┴────────────────┐
                         ▼                                                 ▼
             ┌───────────────────────┐                         ┌───────────────────────┐
             │ Exchange REST APIs    │                         │ CoinGecko API         │
             │ (Binance, OKX, Bybit, │                         │ (Ticker Fallback)     │
             │  KuCoin, Gate.io, etc)│                         └───────────────────────┘
             └───────────────────────┘
```

---

## Project Structure

```
gold-arbitrage-analyzer/
├── .github/
│   ├── workflows/ci.yml         # GitHub Actions CI (lint, Vitest, build, Semgrep SAST, Trivy)
│   └── dependabot.yml           # Automated weekly npm & GitHub Actions security updates
├── api/
│   ├── health.js                # Liveness endpoint (/api/health) & centralized ErrorHandler
│   └── prices.js                # Vercel Serverless BFF Proxy (sin1 Edge cached)
├── assets/
│   └── favicon.svg              # Application icon
├── doc/
│   └── ARCHITECTURE.md          # System architecture & API specification
├── src/
│   ├── index.js                 # Modular package facade entrypoint
│   └── logger.js                # Structured JSON leveled logger (INFO/WARN/ERROR)
├── js/
│   ├── api/
│   │   ├── coingecko.js         # CoinGecko ticker & market chart API integration
│   │   ├── exchanges.js         # Direct exchange fetchers & config-driven fetcher
│   │   └── normalizer.js        # Universal ticker response normalization
│   ├── components/
│   │   ├── calculator.js        # Realistic arbitrage net profit calculator
│   │   ├── charts.js            # Chart.js instances (Bar, Line, Doughnut)
│   │   ├── header.js            # Controls, token switcher, auto-refresh, clock
│   │   ├── heatmap.js           # O(n^2) spatial spread heatmap matrix
│   │   ├── statsCards.js        # Best Buy, Best Sell, Max Spread, 24h Volume KPIs
│   │   └── table.js             # Exchange comparison table with offline badges
│   ├── services/
│   │   ├── arbitrage.js         # Financial math (spread, taker profit, rankings)
│   │   ├── cache.js             # Client in-memory TTL caching service
│   │   └── state.js             # Reactive Pub/Sub application state store
│   ├── utils/
│   │   ├── constants.js         # Tokens, color palettes, exchange registry
│   │   ├── formatters.js        # Currency, percentage, volume formatters
│   │   └── helpers.js           # Safe DOM manipulation & color interpolation
│   ├── app.js                   # Application coordinator & event bindings
│   └── config.js                # Centralized exchange API endpoints & parameters
├── tests/
│   ├── arbitrage.test.js        # Financial calculations & ranking tests
│   ├── cache.test.js            # Cache TTL & invalidation tests
│   ├── formatters.test.js       # Formatting function tests
│   ├── health.test.js           # Health probe & ErrorHandler tests
│   ├── helpers.test.js          # DOM utility & helper tests
│   ├── normalizer.test.js       # API payload normalization tests
│   └── state.test.js            # Reactive state isolation tests
├── .dockerignore                # Docker context exclusions
├── .eslintrc.json               # ESLint code quality rules
├── .gitignore                   # Git exclusion rules
├── .pre-commit-config.yaml      # Pre-commit lint & secret hooks
├── .vercelignore                # Static hosting distribution exclusion rules
├── CHANGELOG.md                 # Semantic release changelog
├── CONTRIBUTING.md              # Developer contribution guide
├── Dockerfile                   # Hardened multi-stage non-root Node containerfile
├── index.css                    # Design system & full-width fluid layout styles
├── index.html                   # HTML5 shell with SRI hashes & semantic layout
├── LICENSE                      # MIT License
├── Makefile                     # Single-command workflow targets
├── package.json                 # Node.js project manifest & Vitest configuration
├── README.md                    # Comprehensive technical documentation
├── runbook.md                   # Production operational runbook
├── SECURITY.md                  # Vulnerability disclosure policy
└── vercel.json                  # Edge region pinning, CSP, HSTS, security headers
```

---

## Getting Started

### Single-Command Workflow (Makefile)

```bash
git clone https://github.com/subki72/gold-arbitrage-analyzer.git
cd gold-arbitrage-analyzer

# 1. Install locked dependencies
make install

# 2. Run linter & syntax checks
make lint

# 3. Run automated Vitest suite (67 tests)
make test

# 4. Run local static server
make run

# 5. Build hardened non-root Docker image
make docker-build
```

### Prerequisites
- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0

### Local Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/subki72/gold-arbitrage-analyzer.git
   cd gold-arbitrage-analyzer
   ```

2. Install development dependencies:
   ```bash
   npm install
   ```

3. Run the automated test suite:
   ```bash
   npm test
   ```

4. Launch the local development server:
   ```bash
   npx serve .
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Automated Testing & Quality Assurance

The project enforces automated test verification using [Vitest](https://vitest.dev/).

```bash
# Run test suite once
npm test

# Run tests in interactive watch mode
npm run test:watch
```

### Test Coverage Highlights (65 Unit Tests Passed)
- `tests/arbitrage.test.js`: Validates taker fee deductions, net profit formulas with Paxos/gas/withdrawal fees, best buy/sell matching, and spread matrices.
- `tests/normalizer.test.js`: Validates universal normalization across Binance, OKX, Bybit, KuCoin, HTX, Gate.io, MEXC, Bitfinex, and CoinGecko payloads.
- `tests/state.test.js`: Validates reactive Pub/Sub listeners and cross-asset state isolation.
- `tests/cache.test.js`: Validates TTL expiration, key isolation, and manual flush behaviors.
- `tests/formatters.test.js`: Validates currency formatting, spread badges, and numerical safeguards.
- `tests/helpers.test.js`: Validates safe DOM element generation, attributes, and events.

Continuous Integration runs automatically via GitHub Actions on all pushes and pull requests to `main` (`.github/workflows/ci.yml`).

---

## Production Deployment

### Vercel Deployment

The application is natively configured for zero-configuration deployment on **Vercel**:

1. Import the repository into your Vercel Dashboard.
2. Vercel automatically detects static assets and the `/api/prices.js` Serverless Function.
3. The build uses [`vercel.json`](./vercel.json) to enforce:
   - Function execution in region `sin1` (Singapore Edge).
   - Strict Content Security Policy (CSP) and HSTS headers.
   - Public Edge Caching headers.

Alternatively, deploy via the Vercel CLI:
```bash
npx vercel --prod
```

---

## Contributing

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Ensure all tests pass (`npm test`).
4. Commit your changes (`git commit -m "feat: add amazing feature"`).
5. Push to the branch (`git push origin feature/amazing-feature`).
6. Open a Pull Request.

---

## Security & Governance

- **Vulnerability Disclosure**: Review our security reporting guidelines in [SECURITY.md](SECURITY.md).
- **Operational Runbook**: Production health diagnostics and incident procedures in [runbook.md](runbook.md).
- **Architecture Specification**: System topology and data integrity guarantees in [doc/ARCHITECTURE.md](doc/ARCHITECTURE.md).
- **Contribution Guidelines**: Development setup and pull request etiquette in [CONTRIBUTING.md](CONTRIBUTING.md).
- **Release Changelog**: Track semantic releases and version updates in [CHANGELOG.md](CHANGELOG.md).
- **License**: Explicit open source licensing under the [MIT License](LICENSE).

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## Disclaimer

*Market data displayed by Gold Arbitrage Analyzer is for informational and educational purposes only and does not constitute financial, investment, or legal advice. Indicative prices may differ from real-time execution quotes due to exchange latency and market volatility. Always conduct your own research (DYOR) before engaging in cryptocurrency or gold arbitrage trading.*
