# News Ticker

A sleek, always-on-top desktop news ticker that streams live headlines from Google News RSS — no API keys required.

![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Always-on-top ticker bar** — frameless, transparent, draggable & resizable overlay
- **Google News RSS** — live headlines with zero setup, no API keys
- **22 genre categories** with distinct color coding — Politics, Business, Technology, Science, Sports, Entertainment, Crime, Health, World, Environment, Weather, Automotive, Travel, Food, Education, Real Estate, Space, AI & Robotics, Gaming, Fashion, Crypto, Military
- **Multi-select genre filter** with Select All toggle
- **Clickable headlines** — opens the full article in your default browser
- **Auto-refresh** every 10 minutes
- **Shuffled headlines** on every load for a fresh feel
- **System tray** integration with quick refresh & show/hide
- **Cross-platform** — macOS, Linux, Windows

## Prerequisites

- **Node.js** ≥ 18

## Getting Started

```bash
# Clone the repository
git clone https://github.com/saeidbayeganeh/news-ticker.git
cd news-ticker

# Install dependencies
npm install

# Development (two terminals)
npm run dev          # Terminal 1 — Vite dev server
npm run start        # Terminal 2 — Electron app

# Or build + launch in one step (no hot reload)
npm run dev:electron
```

## Building for Distribution

```bash
npm run dist:mac     # macOS (.dmg)
npm run dist:linux   # Linux (.AppImage, .deb)
npm run dist:win     # Windows (.exe)
npm run dist:all     # All platforms
```

## How It Works

1. The app fetches Google News RSS feeds for each enabled genre (up to 8 headlines per genre, 3 genres concurrently)
2. Headlines are deduplicated by URL and cached for 10 minutes
3. On each fetch, results are shuffled so the ticker feels fresh
4. Headlines scroll across the bar in a seamless loop, color-coded by genre
5. Click any headline to open the full article in your browser
6. Use the ☰ dropdown to toggle genres on/off — settings persist across sessions

## Tech Stack

- **Electron** — desktop app framework
- **React 19** — UI rendering
- **Vite** — dev server & bundler
- **electron-store** — persistent settings
- **electron-builder** — cross-platform packaging

## Project Structure

```
electron/
  main.js             # Electron main process, window & tray setup
  preload.js          # Context bridge (IPC)
  store.js            # Persistent settings via electron-store
  services/
    newsAggregator.mjs  # Fetch orchestration, caching & deduplication
    webSearch.mjs       # Google News RSS parser
src/
  App.jsx             # Root component, state & refresh logic
  components/
    Marquee.jsx       # Scrolling headline ticker
    GenreDropdown.jsx  # Genre filter dropdown
    DragHandle.jsx    # Window drag control
    ResizeHandle.jsx  # Window resize control
  styles/
    global.css        # All styles
  utils/
    genreColors.js    # Genre list & color map
```

## License

MIT
