# 🖨️ print-on-schedule

Automatically print webpages on a cron schedule. Uses Puppeteer to fully render each page (including JavaScript-heavy content) and sends the output to your local macOS printer via `lp`.

## Quick Start

```bash
# Install dependencies
npm install

# Test a print right now
npm run print-now

# Start the scheduler (runs in the foreground)
npm start
```

## Configuration

Edit **`config.json`** in the project root:

```json
{
  "schedule": "15 6 * * *",
  "printer": "",
  "pages": [
    "https://novicelab.org/newspaper/"
  ],
  "preferences": {
    "duplex": true,
    "scale": 0.6,
    "format": "A4",
    "printBackground": true
  }
}
```

| Field | Type | Description |
|---|---|---|
| `schedule` | `string` | Standard 5-field cron expression. `15 6 * * *` = every day at 6:15 AM |
| `printer` | `string` | Printer name from `lpstat -p`. Leave empty for system default |
| `pages` | `string[]` | URLs to print |
| `preferences.duplex` | `boolean` | `true` = two-sided (long edge), `false` = one-sided |
| `preferences.scale` | `number` | PDF scale factor: `0.1`–`2.0` (0.6 = 60%) |
| `preferences.format` | `string` | Paper size: `A4`, `Letter`, etc. |
| `preferences.printBackground` | `boolean` | Include CSS background colors/images |

## How It Works

1. **Cron tick** → `node-cron` fires at the configured schedule
2. **Render** → Puppeteer opens each URL in a headless browser, waits for `networkidle0` (no network activity for 500 ms), then generates a PDF with the configured scale
3. **Print** → The PDF is sent to your local printer via the macOS `lp` command with duplex and fit-to-page options
4. **Cleanup** → Temporary PDF files are deleted

## CLI Flags

| Flag | Description |
|---|---|
| `--now` | Run one print job immediately on startup (great for testing) |

## Finding Your Printer Name

```bash
lpstat -p
```

Copy the printer name and paste it into `config.json` → `"printer"`. Leave it empty to use the system default.

## Requirements

- **Node.js** ≥ 18
- **macOS** (uses the `lp` command via CUPS)
- A configured local or network printer
