# Razor Cloud — Control Plane Demo Frontend

A complete, offline-ready, modular frontend control plane for the Razor algorithmic trading engine.

## Features

- **Apple Design System & Pure Light Theme**:
  - Translucent materials with `backdrop-filter: blur(20px) saturate(180%)`, calibrated squircles, and restrained elevation.
  - Optical typography tracking, fluid tactile spring interactions (`:active { transform: scale(0.97); }`), and pure light surfaces.
  - macOS segmented controls, iOS switches, and minimal high-contrast charts.
- **100% Offline / Zero CDN Dependencies**:
  - All fonts (Inter, Space Grotesk, JetBrains Mono, and Vazirmatn Persian font) are stored locally in `assets/fonts/` as `.woff2` files.
  - All brand artwork and logos are saved in `assets/images/`.
  - Zero external HTTP/HTTPS network calls.
- **Dual Culture & Language Support**:
  - **English (`en-US`)**: Left-to-Right (`ltr`), UTC control plane timezone, standard numerals and Gregorian datepicker.
  - **Persian / Farsi (`fa-IR`)**: Right-to-Left (`rtl`), Iran Standard Time (`IRST`, Tehran UTC+03:30), Vazirmatn Persian typography, Persian numerals (۰۱۲۳۴۵۶۷۸۹), full translation dictionary, and an interactive **Shamsi (Solar Hijri / Jalali) datepicker**.
  - Culture can be switched anytime via the topbar button or from the login screen, with state persisted in `localStorage`.
- **Interactive Shamsi (Jalali) DatePicker**:
  - Fully offline calendar math engine (`assets/js/core/jalali.js` & `assets/js/core/datepicker.js`).
  - Month/year navigation with Persian month names (فروردین, اردیبهشت, ...) and days of the week starting from Saturday (شنبه).
  - Automatically activates on date inputs when the `fa-IR` culture is active.
- **Separated, Modular Architecture**:
  - Stylesheet modularity: `app.css`, `rtl.css`, `datepicker.css`, `fonts.css`.
  - JavaScript modularity: `core/` (state/db, charts, icons, datepicker, websocket console), `i18n/` (en, fa, i18n engine), `pages/` (individual page renderers).
  - Clean HTML layout:
    - `index.html`: Gateway & Login with role picker (Trader, Developer, Admin).
    - `workspace.html`: Trader & Developer operations workspace.
    - `admin.html`: Staff administration platform.
    - Lightweight entry files (`live.html`, `backtest.html`, `reports.html`, etc.) for direct deep-linking.
- **Seamless Mocked Data & Interactivity**:
  - **Live Trading**: Real-time tick stream, live positions (closeable), pending orders (cancellable), live equity curve canvas chart, pause/resume, gene injection.
  - **Backtesting**: Multi-symbol & timeframe picker, date range with Shamsi datepicker, live progress simulation, bit-identical determinism verification, trade list, canvas equity curve.
  - **Genetic Optimization**: Steppable GA, hyper-mutation detection, chromosome inspection, direct gene injection to live trading.
  - **Scheduling & Cron**: 5-field cron builder, one-off schedules with datetime picker, pause/resume toggles, SQLite simulation.
  - **Extensions & Profiles**: Extension catalog, double-validation handshake simulation, chunked binary deployment simulator.
  - **Reports & Analytics**: On-demand generator with format selection (PDF, Excel, JSON) and real browser file downloads!
  - **Logs & Telemetry**: Live log stream, search filter, log level selector, export logs, CPU/MEM gauges, sparklines.
  - **Secrets Vault**: Broker API keys, AES-256-GCM simulation, reveal/mask toggles, copy to clipboard.
  - **Instances & Fleet**: Node fleet health, key regeneration, self-update channel, push update staging, kill switch.
  - **Settings**: Profile, subscription tier, signed feature capabilities (F100–F111).
  - **Admin Platform**: Fleet oversight, 24h engine telemetry, LTS version donut chart, user tier management, license issuing & revoking, fleet-wide push updates, broadcast messages, marketplace approvals, feature flag toggles, immutable audit log.
  - **WebSocket Console Drawer**: Real-time inspection of Command, Event, Heartbeat, and Binary frames.
  - **Command Palette (`Ctrl+K` / `Cmd+K`)**: Rapid keyboard navigation and action triggers.

---

## How to Serve & Run

You can run this project with any local static server:

### Option 1: Using `serve` (Node.js)
```bash
npx serve .
```
Or if installed globally:
```bash
serve .
```

### Option 2: Using Python
```bash
python3 -m http.server 3000
```

### Option 3: Using PHP / Lerd
```bash
php -S localhost:3000
```

Then open `http://localhost:3000` in your browser.

---

## Demo Accounts

Click any demo account row on the login screen (`index.html`) to autofill:

| Account | Email | Password | Role / Tier |
|---|---|---|---|
| **Trader** | `trader@razor.io` | `demo123` | Professional (Production Live Trading) |
| **Developer** | `dev@razor.io` | `demo123` | Free Developer (MockAdapter & 3-month window) |
| **Admin** | `admin@razor.io` | `demo123` | Razor Co. Staff (Full Administration Platform) |

---

## Directory Structure

```text
razor-demo-frontend/
├── index.html                  # Welcome & Gateway Login (language switcher, role cards)
├── workspace.html              # Trader & Developer Workspace shell
├── admin.html                  # Razor Co. Staff Administration Platform
├── overview.html               # Direct route alias
├── live.html                   # Direct route alias
├── backtest.html               # Direct route alias
├── optimization.html           # Direct route alias
├── scheduling.html             # Direct route alias
├── extensions.html             # Direct route alias
├── reports.html                # Direct route alias
├── logs.html                   # Direct route alias
├── secrets.html                # Direct route alias
├── instances.html              # Direct route alias
├── settings.html               # Direct route alias
├── assets/
│   ├── css/
│   │   ├── fonts.css           # Local font-face definitions (Inter, Space Grotesk, JetBrains Mono, Vazirmatn)
│   │   ├── app.css             # Main stylesheet & design system
│   │   ├── rtl.css             # Full RTL overrides for Persian (fa-IR)
│   │   └── datepicker.css      # Shamsi & Gregorian popup calendar styling
│   ├── js/
│   │   ├── core/
│   │   │   ├── icons.js        # SVG icon dictionary
│   │   │   ├── jalali.js       # Jalali (Shamsi) <-> Gregorian math engine & formatting
│   │   │   ├── datepicker.js   # Shamsi & Gregorian datepicker popup component
│   │   │   ├── db.js           # Mock database & localStorage persistence
│   │   │   ├── charts.js       # High-performance Canvas charting engine
│   │   │   └── ws-console.js   # WebSocket console & command lifecycle simulator
│   │   ├── i18n/
│   │   │   ├── en.js           # English translation dictionary
│   │   │   ├── fa.js           # Persian translation dictionary
│   │   │   └── i18n.js         # Culture manager, currency/number formatters, relative time
│   │   ├── pages/
│   │   │   ├── overview.js     # Overview dashboard & telemetry
│   │   │   ├── live.js         # Live session, order book, positions, tick feed
│   │   │   ├── backtest.js     # Deterministic backtester, golden hash, trade logs
│   │   │   ├── optimization.js # Genetic algorithm, chromosome inspector
│   │   │   ├── scheduling.js   # Cron jobs & schedules
│   │   │   ├── extensions.js   # Assembly extensions & deployment
│   │   │   ├── reports.js      # Reports library & exporter
│   │   │   ├── logs.js         # Telemetry gauges & log streamer
│   │   │   ├── secrets.js      # Encrypted secrets vault
│   │   │   ├── instances.js    # Engine fleet & API keys
│   │   │   ├── settings.js     # Account & entitlements
│   │   │   └── admin.js        # Consolidated administration platform
│   │   └── app.js              # Controller, routing, command palette, toasts, modals
│   ├── fonts/                  # 58 local WOFF2 font files
│   └── images/
│       ├── logo.png            # Favicon & header logo
│       └── login-hero.png      # Login hero artwork
└── README.md
```
