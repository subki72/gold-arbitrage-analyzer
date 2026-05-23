# 🎨 Design Document — Gold Arbitrage Analyzer

## 1. Arsitektur Sistem

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND (SPA)                    │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐ │
│  │ Dashboard │  │  Charts  │  │  Comparison Table │ │
│  │  Header   │  │ Section  │  │     Section       │ │
│  └──────────┘  └──────────┘  └───────────────────┘ │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │            Data Service Layer                 │   │
│  │  ┌────────────┐  ┌──────────┐  ┌──────────┐ │   │
│  │  │ API Fetcher │  │ Data     │  │ Cache    │ │   │
│  │  │ (per CEX)  │  │ Normalizer│  │ Manager  │ │   │
│  │  └────────────┘  └──────────┘  └──────────┘ │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
          │               │               │
          ▼               ▼               ▼
   ┌──────────┐    ┌──────────┐    ┌──────────┐
   │ Binance  │    │   OKX    │    │  Bybit   │  ...
   │   API    │    │   API    │    │   API    │
   └──────────┘    └──────────┘    └──────────┘
```

### 1.2 Data Flow

```
CEX APIs ──► Fetch Module ──► Normalize ──► State Store ──► UI Components
                  │                              │
                  ▼                              ▼
            Error Handler              Chart.js / Visualizations
                  │
                  ▼
          Fallback (CoinGecko)
```

---

## 2. Tech Stack

### 2.1 Frontend
| Layer | Technology | Justifikasi |
|-------|-----------|-------------|
| **Structure** | HTML5 Semantic | SEO-friendly, accessible |
| **Styling** | Vanilla CSS (Custom Properties) | Maximum kontrol, no dependency |
| **Logic** | Vanilla JavaScript (ES6+) | Lightweight, tanpa build step |
| **Charts** | Chart.js v4 (CDN) | Ringan (~60KB gzip), rich chart types |
| **Icons** | Lucide Icons (CDN) | Modern, clean icons |
| **Fonts** | Google Fonts: Inter + JetBrains Mono | Modern typography |

### 2.2 API Strategy
| Strategy | Detail |
|----------|--------|
| **Primary** | Direct REST API calls ke masing-masing exchange |
| **Fallback** | CoinGecko aggregated data |
| **CORS Handling** | Menggunakan proxy jika diperlukan, atau exchange yang support CORS |
| **Polling** | `setInterval` dengan configurable interval (default: 30s) |
| **Caching** | In-memory cache dengan TTL untuk menghindari rate limiting |

---

## 3. Design System

### 3.1 Color Palette

```css
/* ── Base (Dark Theme) ── */
--bg-primary:       hsl(225, 25%, 8%);      /* #0f1118 — deep navy black */
--bg-secondary:     hsl(225, 22%, 12%);     /* #171b26 — card background */
--bg-tertiary:      hsl(225, 20%, 16%);     /* #1f2333 — elevated surface */
--bg-hover:         hsl(225, 18%, 20%);     /* #2a2e3f — hover state */

/* ── Text ── */
--text-primary:     hsl(220, 20%, 95%);     /* #eef0f6 — white-ish */
--text-secondary:   hsl(220, 15%, 65%);     /* #9399a8 — muted */
--text-tertiary:    hsl(220, 12%, 45%);     /* #646a7a — subtle */

/* ── Accent & Status ── */
--accent-gold:      hsl(43, 96%, 56%);      /* #f5b820 — gold primary */
--accent-gold-dim:  hsl(43, 80%, 40%);      /* #b8891a — gold muted */
--accent-gold-glow: hsla(43, 96%, 56%, 0.15); /* gold glow effect */

--color-profit:     hsl(152, 69%, 50%);     /* #2ecc71 — green (profit/up) */
--color-loss:       hsl(0, 75%, 58%);       /* #e04848 — red (loss/down) */
--color-warning:    hsl(35, 95%, 55%);      /* #f0932b — orange (alert) */
--color-info:       hsl(210, 80%, 60%);     /* #4a90d9 — blue (info) */

/* ── Border & Divider ── */
--border-primary:   hsl(225, 15%, 20%);     /* subtle border */
--border-accent:    hsla(43, 96%, 56%, 0.3); /* gold accent border */

/* ── Gradient ── */
--gradient-gold:    linear-gradient(135deg, hsl(43, 96%, 56%), hsl(35, 95%, 45%));
--gradient-card:    linear-gradient(145deg, hsla(225, 22%, 14%, 0.8), hsla(225, 22%, 10%, 0.6));
--gradient-hero:    linear-gradient(180deg, hsla(43, 96%, 56%, 0.08) 0%, transparent 40%);
```

### 3.2 Typography

```css
/* ── Font Family ── */
--font-primary:   'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono:      'JetBrains Mono', 'Fira Code', monospace;

/* ── Font Sizes ── */
--text-xs:    0.75rem;    /* 12px — labels, badges */
--text-sm:    0.875rem;   /* 14px — secondary text */
--text-base:  1rem;       /* 16px — body text */
--text-lg:    1.125rem;   /* 18px — subheadings */
--text-xl:    1.5rem;     /* 24px — section titles */
--text-2xl:   2rem;       /* 32px — page titles */
--text-3xl:   2.5rem;     /* 40px — hero numbers */
--text-4xl:   3.5rem;     /* 56px — big price display */

/* ── Font Weights ── */
--font-regular:   400;
--font-medium:    500;
--font-semibold:  600;
--font-bold:      700;
```

### 3.3 Spacing & Layout

```css
/* ── Spacing Scale ── */
--space-1:  0.25rem;   /* 4px */
--space-2:  0.5rem;    /* 8px */
--space-3:  0.75rem;   /* 12px */
--space-4:  1rem;      /* 16px */
--space-5:  1.25rem;   /* 20px */
--space-6:  1.5rem;    /* 24px */
--space-8:  2rem;      /* 32px */
--space-10: 2.5rem;    /* 40px */
--space-12: 3rem;      /* 48px */

/* ── Border Radius ── */
--radius-sm:  6px;
--radius-md:  10px;
--radius-lg:  16px;
--radius-xl:  24px;
--radius-full: 9999px;

/* ── Shadows ── */
--shadow-sm:   0 1px 3px hsla(0, 0%, 0%, 0.3);
--shadow-md:   0 4px 12px hsla(0, 0%, 0%, 0.4);
--shadow-lg:   0 8px 32px hsla(0, 0%, 0%, 0.5);
--shadow-gold: 0 4px 20px hsla(43, 96%, 56%, 0.15);

/* ── Layout ── */
--container-max:  1400px;
--sidebar-width:  280px;
```

### 3.4 Animations

```css
/* ── Transitions ── */
--transition-fast:   150ms ease;
--transition-base:   250ms ease;
--transition-slow:   400ms ease;
--transition-spring: 300ms cubic-bezier(0.34, 1.56, 0.64, 1);

/* ── Keyframes yang akan digunakan ── */
/* fadeIn, slideUp, pulse, shimmer, countUp, glowPulse */
```

---

## 4. Component Design

### 4.1 Layout Structure

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER / NAVBAR                                             │
│  [Logo] Gold Arbitrage Analyzer    [PAXG|XAUT] [Auto-refresh]│
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────┐  │
│  │  Best Buy  │ │ Best Sell  │ │  Max Spread│ │  Volume  │  │
│  │  $3,245.20 │ │ $3,248.50 │ │   0.10%    │ │  $45.2M  │  │
│  │  Binance   │ │  OKX      │ │ BIN→OKX    │ │  24h     │  │
│  └────────────┘ └────────────┘ └────────────┘ └──────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │            PRICE COMPARISON CHART                     │    │
│  │  █████████████████████████  Binance  $3,245.20       │    │
│  │  ████████████████████████   OKX      $3,248.50       │    │
│  │  ███████████████████████    Bybit    $3,246.80       │    │
│  │  ██████████████████████     KuCoin   $3,247.10       │    │
│  │  █████████████████████      HTX      $3,244.90       │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────┐ ┌──────────────────────────┐    │
│  │   SPREAD HEATMAP        │ │   PRICE HISTORY CHART    │    │
│  │                         │ │                          │    │
│  │  BIN  OKX  BYB  KUC    │ │   ────/\──────/\────     │    │
│  │  BIN  ──  0.10  0.05   │ │       \/      \/         │    │
│  │  OKX 0.10  ──   0.05   │ │                          │    │
│  │  BYB 0.05 0.05   ──    │ │   [1H] [4H] [24H] [7D]  │    │
│  └─────────────────────────┘ └──────────────────────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              EXCHANGE COMPARISON TABLE                │    │
│  │ Exchange │ Price  │ 24h Chg │ Volume │ Fee  │ Action │    │
│  │ Binance  │ 3245.2 │ +1.2%   │ $20M   │ 0.1% │ ★     │    │
│  │ OKX      │ 3248.5 │ +1.4%   │ $12M   │ 0.1% │       │    │
│  │ ...      │ ...    │ ...     │ ...    │ ...  │       │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────┐ ┌──────────────────────────┐    │
│  │  ARBITRAGE CALCULATOR   │ │  VOLUME COMPARISON       │    │
│  │                         │ │                          │    │
│  │  Buy:  [Exchange ▼]     │ │   ██████ Binance 45%    │    │
│  │  Sell: [Exchange ▼]     │ │   ████   OKX     25%    │    │
│  │  Amount: [____] oz      │ │   ███    Bybit   15%    │    │
│  │                         │ │   ██     Others  15%    │    │
│  │  Profit: +$3.30 (0.10%) │ │                          │    │
│  └─────────────────────────┘ └──────────────────────────┘    │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  FOOTER — Disclaimer, Last Updated, Data Sources             │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Component Hierarchy

```
App
├── Header
│   ├── Logo + Title
│   ├── TokenSelector (PAXG / XAUT toggle)
│   ├── RefreshControl (auto/manual toggle + interval)
│   └── LastUpdated timestamp
│
├── StatsCards (4-column grid)
│   ├── BestBuyCard (harga terendah + exchange name)
│   ├── BestSellCard (harga tertinggi + exchange name)
│   ├── MaxSpreadCard (spread % terbesar)
│   └── TotalVolumeCard (total volume 24h)
│
├── ChartsSection
│   ├── PriceComparisonChart (horizontal bar chart)
│   ├── SpreadHeatmap (matrix grid with color intensity)
│   ├── PriceHistoryChart (multi-line chart with timeframe selector)
│   ├── SpreadTrendChart (area chart)
│   └── VolumeChart (doughnut/pie chart)
│
├── ComparisonTable
│   ├── TableHeader (sortable columns)
│   ├── TableRow (per exchange data)
│   └── TableFooter (aggregated stats)
│
├── ArbitrageCalculator
│   ├── ExchangeSelector (buy/sell dropdowns)
│   ├── AmountInput
│   └── ProfitDisplay
│
└── Footer
    ├── Disclaimer
    ├── DataSources
    └── RefreshInfo
```

---

## 5. File Structure

```
Data Analyst Gold/
├── index.html              # Main HTML file
├── index.css               # Global styles + design system
├── js/
│   ├── app.js              # Main application entry point
│   ├── config.js           # Configuration (API URLs, intervals, fees)
│   ├── api/
│   │   ├── exchanges.js    # Exchange API fetcher (all CEX)
│   │   ├── coingecko.js    # CoinGecko fallback API
│   │   └── normalizer.js   # Data normalization layer
│   ├── services/
│   │   ├── arbitrage.js    # Arbitrage calculation logic
│   │   ├── cache.js        # In-memory cache manager
│   │   └── state.js        # Application state management
│   ├── components/
│   │   ├── header.js       # Header component
│   │   ├── statsCards.js   # Stats cards component
│   │   ├── charts.js       # All chart components
│   │   ├── heatmap.js      # Spread heatmap component
│   │   ├── table.js        # Comparison table component
│   │   └── calculator.js   # Arbitrage calculator component
│   └── utils/
│       ├── formatters.js   # Number/currency/percentage formatters
│       ├── helpers.js      # Utility functions
│       └── constants.js    # Application constants
├── assets/
│   └── favicon.svg         # Gold-themed favicon
├── requirements.md         # This file
├── design.md              # Design document
└── task.md                # Task tracking
```

---

## 6. API Response Schema (Normalized)

Setiap exchange data akan dinormalisasi ke format berikut:

```javascript
{
  exchange: "binance",           // Exchange ID
  displayName: "Binance",       // Display name
  symbol: "PAXG/USDT",         // Trading pair
  price: {
    last: 3245.20,             // Last traded price
    bid: 3245.10,              // Best bid
    ask: 3245.30,              // Best ask
    high24h: 3260.00,          // 24h high
    low24h: 3230.00,           // 24h low
  },
  change24h: {
    absolute: +15.20,          // Absolute change
    percentage: +0.47,         // Percentage change
  },
  volume24h: {
    base: 6150.5,              // Volume in base (PAXG)
    quote: 19968873.60,        // Volume in quote (USDT)
  },
  fees: {
    maker: 0.10,               // Maker fee %
    taker: 0.10,               // Taker fee %
  },
  timestamp: 1716451200000,    // Data timestamp
  status: "active",            // "active" | "error" | "stale"
}
```

---

## 7. Arbitrage Calculation Formula

```
Gross Profit    = Sell Price - Buy Price
Buy Fee         = Buy Price × Taker Fee Rate
Sell Fee        = Sell Price × Maker Fee Rate
Net Profit      = Gross Profit - Buy Fee - Sell Fee
Profit %        = (Net Profit / Buy Price) × 100
ROI per Ounce   = Net Profit (dalam USDT per 1 oz)
```

---

## 8. Error Handling Strategy

| Scenario | Handling |
|----------|----------|
| API timeout | Retry 2x dengan exponential backoff, lalu mark sebagai "stale" |
| Rate limiting | Implement request queue dengan delay antar request |
| CORS error | Gunakan CORS proxy atau fallback ke CoinGecko |
| Invalid data | Validate schema, skip data yang tidak valid |
| All APIs down | Tampilkan cached data dengan warning "Data may be outdated" |
| Network offline | Tampilkan pesan offline dan data terakhir yang tersedia |
