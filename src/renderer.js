import puppeteer from 'puppeteer';
import path from 'node:path';
import os from 'node:os';
import { log } from './logger.js';

/**
 * Renders a list of URLs to PDF files using Puppeteer.
 *
 * Uses `@media print` mode so the page renders exactly as it would when
 * clicking the browser's Print button — honoring print-specific CSS
 * (e.g. hiding navbars, applying print columns, removing backgrounds).
 *
 * Each page is navigated with `networkidle0` to ensure it is fully loaded
 * (no open network connections for 500 ms) before generating the PDF.
 *
 * @param {string[]} urls - List of webpage URLs to render.
 * @param {object}   preferences - Print preferences from config.
 * @param {number}   preferences.scale - PDF scale factor (0.1–2.0).
 * @param {string}   preferences.format - Paper size (e.g. "A4", "Letter").
 * @param {boolean}  preferences.printBackground - Include CSS backgrounds.
 * @returns {Promise<string[]>} Array of temporary PDF file paths.
 */
export async function renderPages(urls, preferences) {
  const pdfPaths = [];

  log.info('Launching headless browser…');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    for (const url of urls) {
      log.step(`Loading: ${url}`);
      const page = await browser.newPage();

      // Switch to print media BEFORE navigation so the browser fetches
      // and applies @media print stylesheets from the start.
      await page.emulateMediaType('print');

      // Navigate and wait until the network is completely idle.
      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 90_000,
      });

      // Generate the PDF.
      const fileName = `print_${Date.now()}_${pdfPaths.length}.pdf`;
      const pdfPath = path.join(os.tmpdir(), fileName);

      await page.pdf({
        path: pdfPath,
        scale: preferences.scale ?? 1,
        format: preferences.format ?? 'A4',
        printBackground: preferences.printBackground ?? true,
        margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
      });

      log.info(`PDF created → ${pdfPath}`);
      pdfPaths.push(pdfPath);

      await page.close();
    }
  } finally {
    await browser.close();
    log.info('Browser closed.');
  }

  return pdfPaths;
}
