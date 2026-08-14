import { execFile } from 'node:child_process';
import { unlink } from 'node:fs/promises';
import { log } from './logger.js';

/**
 * Sends a PDF file to the local printer using the macOS `lp` command.
 *
 * @param {string}  pdfPath - Absolute path to the PDF file.
 * @param {object}  options
 * @param {string}  options.printer - Printer name (empty string = default).
 * @param {boolean} options.duplex  - true → two-sided-long-edge, false → one-sided.
 * @returns {Promise<void>}
 */
function sendToPrinter(pdfPath, { printer, duplex, format }) {
  return new Promise((resolve, reject) => {
    const args = [];

    // Target a specific printer if configured, otherwise use the system default.
    if (printer) {
      args.push('-d', printer);
    }

    // Duplex / simplex.
    args.push('-o', duplex ? 'sides=two-sided-long-edge' : 'sides=one-sided');

    // Tell CUPS exactly what paper size the PDF uses — prevents "needs paper" mismatch errors.
    if (format) {
      args.push('-o', `media=${format}`);
    }

    // Fit content to page.
    args.push('-o', 'fit-to-page');

    // The file to print.
    args.push(pdfPath);

    log.step(`lp ${args.join(' ')}`);

    execFile('lp', args, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`lp failed: ${stderr || error.message}`));
        return;
      }
      log.info(`Printer accepted job: ${stdout.trim()}`);
      resolve();
    });
  });
}

/**
 * Prints an array of PDF files and cleans them up afterwards.
 *
 * @param {string[]} pdfPaths - Array of PDF file paths.
 * @param {object}   config   - Full config object (needs printer, preferences.duplex).
 */
export async function printAll(pdfPaths, config) {
  const { printer, preferences } = config;

  for (const pdfPath of pdfPaths) {
    try {
      await sendToPrinter(pdfPath, {
        printer,
        duplex: preferences.duplex ?? false,
        format: preferences.format,
      });
    } catch (err) {
      log.error(`Failed to print ${pdfPath}: ${err.message}`);
    } finally {
      // Clean up the temporary PDF regardless of success/failure.
      try {
        await unlink(pdfPath);
        log.info(`Cleaned up temp file: ${pdfPath}`);
      } catch {
        // Ignore cleanup errors.
      }
    }
  }
}
