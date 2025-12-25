# Render API Log Monitor

Monitors Render service logs via API access for Dark City RPG.

## Setup

1. Update the `serviceId` in `render-monitor.js` with your actual Render service ID
2. Run the monitor: `node monitoring/render-monitor.js`

## Features

- Real-time log monitoring via Render API
- Automatic log filtering and processing
- Log file output with timestamps
- Error handling and timeout protection
- Graceful shutdown on SIGINT

## Configuration

Edit the `config` object in `render-monitor.js`:

- `apiKey`: Your Render API key (already set)
- `serviceId`: Your Render service ID (needs updating)
- `logCheckInterval`: How often to check logs (30 seconds default)
  - ` 30000。
