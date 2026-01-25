/**
 * html2pptx - Convert HTML slide to pptxgenjs slide with positioned elements
 *
 * USAGE:
 *   const pptx = new pptxgen();
 *   pptx.layout = 'LAYOUT_16x9';  // Must match HTML body dimensions
 *
 *   const { slide, placeholders } = await html2pptx('slide.html', pptx);
 *   slide.addChart(pptx.charts.LINE, data, placeholders[0]);
 *
 *   await pptx.writeFile('output.pptx');
 *
 * FEATURES:
 *   - Converts HTML to PowerPoint with accurate positioning
 *   - Supports text, images, shapes, and bullet lists
 *   - Extracts placeholder elements (class="placeholder") with positions
 *   - Handles CSS gradients, borders, and margins
 *
 * VALIDATION:
 *   - Uses body width/height from HTML for viewport sizing
 *   - Throws error if HTML dimensions don't match presentation layout
 *   - Throws error if content overflows body (with overflow details)
 *
 * RETURNS:
 *   { slide, placeholders } where placeholders is an array of { id, x, y, w, h }
 *
 * @packageDocumentation
 */

import { chromium } from 'playwright';
import path from 'path';

import { getChromiumPath } from './utils/chromium-path.js';
import { getBodyDimensions, validateDimensions, validateTextBoxPosition } from './validation/index.js';
import { extractSlideData } from './extraction/index.js';
import { addBackground, addElements } from './slide-builder/index.js';
import { isDebugMode, maybePauseToDebug } from './browser/debug.js';
import { preparePage } from './browser/page-setup.js';

/**
 * Convert HTML slide to pptxgenjs slide with positioned elements
 * @param {string} htmlFile - Path to HTML file
 * @param {import('pptxgenjs')} pres - pptxgenjs presentation instance
 * @param {object} options - Options
 * @param {string} [options.tmpDir] - Temporary directory for generated files
 * @param {import('pptxgenjs').Slide|null} [options.slide] - Existing slide to use
 * @returns {Promise<{slide: import('pptxgenjs').Slide, placeholders: Array<{id: string, x: number, y: number, w: number, h: number}>, html: string}>}
 */
export async function html2pptx(htmlFile, pres, options = {}) {
  const { tmpDir = process.env.TMPDIR || '/tmp', slide = null } = options;

  try {
    const launchOptions = {
      args: ['--single-process', '--no-zygote', '--disable-dev-shm-usage'],
      env: { TMPDIR: tmpDir },
      executablePath: await getChromiumPath(),
      headless: !isDebugMode(),
    };

    if (process.platform === 'darwin') launchOptions.channel = 'chrome';

    const browser = await chromium.launch(launchOptions);
    let bodyDimensions;
    let slideData;
    const filePath = path.isAbsolute(htmlFile) ? htmlFile : path.join(process.cwd(), htmlFile);
    const validationErrors = [];

    try {
      const page = await browser.newPage({ deviceScaleFactor: 3 });
      page.on('console', (msg) => {
        console.log(`Browser console: ${msg.text()}`);
      });

      await page.goto(`file://${filePath}`);
      await preparePage(page);

      bodyDimensions = await getBodyDimensions(page);
      await maybePauseToDebug(page, bodyDimensions.errors);

      slideData = await extractSlideData(page, tmpDir, htmlFile);
      await maybePauseToDebug(page, slideData.errors);
    } finally {
      await browser.close();
    }

    if (bodyDimensions.errors && bodyDimensions.errors.length > 0) {
      validationErrors.push(...bodyDimensions.errors);
    }

    const dimensionErrors = validateDimensions(bodyDimensions, pres);
    if (dimensionErrors.length > 0) {
      validationErrors.push(...dimensionErrors);
    }

    const textBoxPositionErrors = validateTextBoxPosition(slideData, bodyDimensions);
    if (textBoxPositionErrors.length > 0) {
      validationErrors.push(...textBoxPositionErrors);
    }

    if (slideData.errors && slideData.errors.length > 0) {
      validationErrors.push(...slideData.errors);
    }

    if (validationErrors.length > 0) {
      const errorMessage =
        validationErrors.length === 1
          ? validationErrors[0]
          : `Multiple validation errors found:\n${validationErrors.map((e, i) => `  ${i + 1}. ${e}`).join('\n')}`;
      throw new Error(errorMessage);
    }

    const targetSlide = slide || pres.addSlide();

    const EMU_PER_INCH = 914400;
    const slideWidthEMU = pres.presLayout?.width || 9144000;
    const slideHeightEMU = pres.presLayout?.height || 5143500;
    const slideWidth = slideWidthEMU / EMU_PER_INCH;
    const slideHeight = slideHeightEMU / EMU_PER_INCH;

    await addBackground(slideData, targetSlide, tmpDir, slideWidth, slideHeight);
    await addElements(slideData, targetSlide, pres);

    return {
      slide: targetSlide,
      placeholders: slideData.placeholders,
      html: slideData.html,
    };
  } catch (error) {
    if (error instanceof Error && !error.message.startsWith(htmlFile)) {
      throw new Error(`${htmlFile}: ${error.message}`);
    }
    throw error;
  }
}
