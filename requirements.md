# 📋 Requirements Document — Gold Arbitrage Analyzer

## 1. Ringkasan Proyek

**Nama Proyek:** Gold Arbitrage Analyzer  
**Tujuan:** Membangun website analisa perbandingan harga emas (gold-backed tokens) dari berbagai Centralized Exchange (CEX) untuk mengidentifikasi peluang arbitrase berdasarkan harga terendah dan tertinggi.

---

## 2. Functional Requirements

### 2.1 Data Fetching & Aggregation
| ID | Requirement | Prioritas |
|----|-------------|-----------|
| FR-01 | Sistem harus mengambil harga real-time gold-backed tokens dari minimal 5 CEX | **High** |
| FR-02 | Token yang didukung: **PAXG/USDT**, **XAUT/USDT** | **High** |
| FR-03 | Data harus mencakup: harga bid, ask, last price, volume 24h, dan perubahan 24h | **High** |
| FR-04 | Sistem harus menghitung spread (selisih harga) antar exchange secara otomatis | **High** |
| FR-05 | Sistem harus menampilkan harga spot emas (XAU/USD) sebagai benchmark | **Medium** |
| FR-06 | Data di-refresh secara periodik (interval 30 detik - 1 menit) | **High** |
| FR-07 | Mendukung data historis harga untuk analisa tren | **Medium** |

### 2.2 Arbitrage Analysis
| ID | Requirement | Prioritas |
|----|-------------|-----------|
| FR-08 | Identifikasi otomatis harga **terendah** (best buy) dan **tertinggi** (best sell) dari seluruh CEX | **High** |
| FR-09 | Kalkulasi profit arbitrase: `(Harga Jual - Harga Beli) - Total Fee` | **High** |
| FR-10 | Tampilkan estimasi fee trading per exchange (maker/taker fee) | **Medium** |
| FR-11 | Alert visual ketika spread melebihi threshold tertentu (misal > 0.5%) | **Medium** |
| FR-12 | Ranking exchange berdasarkan harga dari terendah ke tertinggi | **High** |

### 2.3 Data Visualization
| ID | Requirement | Prioritas |
|----|-------------|-----------|
| FR-13 | **Price Comparison Chart** — Bar/Column chart perbandingan harga antar exchange | **High** |
| FR-14 | **Spread Heatmap** — Matrix heatmap menunjukkan spread antar setiap pasangan exchange | **High** |
| FR-15 | **Price History Line Chart** — Grafik garis pergerakan harga per exchange (1h, 4h, 24h, 7d) | **High** |
| FR-16 | **Volume Bar Chart** — Perbandingan volume trading 24h per exchange | **Medium** |
| FR-17 | **Arbitrage Opportunity Indicator** — Gauge/meter visual menunjukkan potensi profit | **Medium** |
| FR-18 | **Spread Trend Chart** — Tren perubahan spread dari waktu ke waktu | **Medium** |

### 2.4 User Interface
| ID | Requirement | Prioritas |
|----|-------------|-----------|
| FR-19 | Dashboard utama dengan ringkasan semua data di satu halaman | **High** |
| FR-20 | Dark mode sebagai tema default (sesuai standar trading platform) | **High** |
| FR-21 | Responsive design untuk desktop dan mobile | **High** |
| FR-22 | Filter dan sorting berdasarkan exchange, token, atau timeframe | **Medium** |
| FR-23 | Tabel perbandingan harga yang sortable dan searchable | **High** |
| FR-24 | Real-time update indicator (loading/refresh status) | **Medium** |

---

## 3. Sumber Data (CEX APIs)

### 3.1 Exchange yang Didukung

| Exchange | API Type | Endpoint Utama | Auth Required |
|----------|----------|---------------|---------------|
| **Binance** | REST + WebSocket | `/api/v3/ticker/24hr`, `/api/v3/klines` | No (public data) |
| **OKX** | REST + WebSocket | `/api/v5/market/ticker`, `/api/v5/market/candles` | No (public data) |
| **Bybit** | REST + WebSocket | `/v5/market/tickers`, `/v5/market/kline` | No (public data) |
| **KuCoin** | REST + WebSocket | `/api/v1/market/orderbook/level1`, `/api/v1/market/stats` | No (public data) |
| **HTX (Huobi)** | REST + WebSocket | `/market/detail/merged`, `/market/history/kline` | No (public data) |
| **Gate.io** | REST + WebSocket | `/api/v4/spot/tickers`, `/api/v4/spot/candlesticks` | No (public data) |
| **MEXC** | REST | `/api/v3/ticker/24hr`, `/api/v3/klines` | No (public data) |

### 3.2 Data Aggregator (Fallback)

| Provider | Endpoint | Kegunaan |
|----------|----------|----------|
| **CoinGecko API** | `/api/v3/simple/price` | Harga agregat, data historis |
| **Metals-API** | `/api/latest` | Harga spot emas (XAU) sebagai benchmark |

### 3.3 Trading Pairs

| Token | Pair | Deskripsi |
|-------|------|-----------|
| **PAXG** | PAXG/USDT | Pax Gold — 1 token = 1 troy ounce emas |
| **XAUT** | XAUT/USDT | Tether Gold — 1 token = 1 troy ounce emas |

---

## 4. Non-Functional Requirements

| ID | Requirement | Detail |
|----|-------------|--------|
| NFR-01 | **Performance** | Halaman harus load < 3 detik, data refresh < 2 detik |
| NFR-02 | **Reliability** | Fallback ke CoinGecko jika API exchange gagal |
| NFR-03 | **Scalability** | Arsitektur modular untuk menambah exchange baru dengan mudah |
| NFR-04 | **Security** | Tidak menyimpan API keys user, semua data bersifat public |
| NFR-05 | **Accessibility** | Support keyboard navigation dan screen readers |
| NFR-06 | **Browser Support** | Chrome, Firefox, Edge, Safari (versi terbaru) |
| NFR-07 | **SEO** | Meta tags, Open Graph, structured data |

---

## 5. Batasan (Constraints)

- Hanya menggunakan **public API** yang tidak memerlukan autentikasi
- Tidak melakukan eksekusi trading (hanya analisa dan informasi)
- Rate limiting dari masing-masing API exchange harus dihormati
- Data bersifat informasional, bukan financial advice
- Gold-backed tokens diperdagangkan 24/7, berbeda dengan pasar emas tradisional

---

## 6. Asumsi

- User memiliki pemahaman dasar tentang trading dan arbitrase
- Koneksi internet stabil untuk real-time data
- Harga yang ditampilkan adalah indikasi, bukan harga eksekusi pasti
- Fee yang ditampilkan berdasarkan fee tier default (non-VIP)

---

## 7. Glossary

| Istilah | Definisi |
|---------|----------|
| **Arbitrase** | Strategi memanfaatkan selisih harga aset yang sama di pasar berbeda |
| **CEX** | Centralized Exchange — platform trading terpusat |
| **Spread** | Selisih antara harga beli dan jual |
| **PAXG** | Pax Gold — token ERC-20 yang di-backing oleh emas fisik |
| **XAUT** | Tether Gold — token yang di-backing oleh emas fisik dari Tether |
| **Maker/Taker Fee** | Biaya transaksi yang dikenakan exchange kepada pembuat/pengambil order |
