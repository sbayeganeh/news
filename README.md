# News Ticker

An always-on-top desktop news ticker with an **embedded LLM** that fetches, classifies, and rewrites headlines using DuckDuckGo News search.

## Features

- **Frameless, always-on-top** stock-ticker style overlay bar
- **Embedded LLM** (Llama 3 8B) — no external services needed
- **DuckDuckGo News** scraping — no API keys
- **10 genre categories** with distinct color coding — Politics, Business, Technology, Science, Sports, Entertainment, Crime, Health, World, Environment
- **Multi-select genre filter** dropdown
- **Clickable headlines** that open in your default browser
- **Auto-refresh** every 10 minutes
- **Model auto-download** on first launch (~4.6 GB, cached permanently)

## Prerequisites

- **Node.js** ≥ 18
- **macOS** (Metal GPU acceleration) / Linux / Windows

## Getting Started

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev          # Start Vite dev server
npm run dev:electron # Build + launch Electron
```

## How It Works

1. On first launch, the app downloads the Llama 3 8B Q4_K_M model from HuggingFace (~4.6 GB)
2. The model is cached in your app data directory for future launches
3. Every 10 minutes (configurable), the app:
   - Searches DuckDuckGo News for each enabled genre
   - Feeds search results to the embedded LLM
   - LLM picks the most newsworthy items and rewrites them as concise one-liner headlines
   - Headlines scroll across the ticker bar, color-coded by genre
4. Click any headline to open the full article in your browser
5. Use the ☰ menu on the left to filter genres

## Tech Stack

- **Electron** — desktop app framework
- **React** — UI rendering
- **Vite** — dev server & bundler
- **node-llama-cpp** — embedded LLM inference (llama.cpp bindings)
- **duck-duck-scrape** — DuckDuckGo search
- **electron-store** — persistent settings
