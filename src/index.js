#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import cron from 'node-cron';
import { renderPages } from './renderer.js';
import { printAll } from './printer.js';
import { log } from './logger.js';

// ---------------------------------------------------------------------------
// Resolve config path (config.json lives at the project root).
// ---------------------------------------------------------------------------
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.resolve(__dirname, '..', 'config.json');

// ---------------------------------------------------------------------------
// Load & validate config.
// ---------------------------------------------------------------------------
async function loadConfig() {
  const raw = await readFile(CONFIG_PATH, 'utf-8');
  const config = JSON.parse(raw);

  if (!config.schedule || !cron.validate(config.schedule)) {
    throw new Error(`Invalid or missing cron schedule: "${config.schedule}"`);
  }
  if (!Array.isArray(config.pages) || config.pages.length === 0) {
    throw new Error('config.pages must be a non-empty array of URLs.');
  }

  return config;
}

// ---------------------------------------------------------------------------
// The main print pipeline: render → print.
// ---------------------------------------------------------------------------
async function runPrintJob(config) {
  log.info('═══════════════════════════════════════════════');
  log.info('Starting print job…');

  try {
    const pdfPaths = await renderPages(config.pages, config.preferences);

    if (pdfPaths.length === 0) {
      log.warn('No PDFs were generated — nothing to print.');
      return;
    }

    await printAll(pdfPaths, config);
    log.info('Print job completed successfully ✓');
  } catch (err) {
    log.error(`Print job failed: ${err.message}`);
  }

  log.info('═══════════════════════════════════════════════');
}

// ---------------------------------------------------------------------------
// Entry point.
// ---------------------------------------------------------------------------
async function main() {
  log.info('🖨️  print-on-schedule');
  log.info('Loading config…');

  const config = await loadConfig();

  log.info(`Schedule   : ${config.schedule}`);
  log.info(`Pages      : ${config.pages.join(', ')}`);
  log.info(`Duplex     : ${config.preferences.duplex ? 'yes (two-sided)' : 'no (one-sided)'}`);
  log.info(`Scale      : ${(config.preferences.scale * 100).toFixed(0)}%`);
  log.info(`Format     : ${config.preferences.format}`);
  log.info(`Printer    : ${config.printer || '(system default)'}`);

  // --now flag: run one print job immediately (useful for testing).
  const runNow = process.argv.includes('--now');

  if (runNow) {
    log.info('--now flag detected — running print job immediately…');
    await runPrintJob(config);
  }

  // Register the cron job.
  cron.schedule(config.schedule, () => {
    runPrintJob(config);
  });

  log.info(`Cron job registered. Waiting for next tick (${config.schedule})…`);
}

main().catch((err) => {
  log.error(`Fatal: ${err.message}`);
  process.exit(1);
});
