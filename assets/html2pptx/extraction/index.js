/**
 * HTML slide data extraction - Entry point
 */

const { rasterizeMarkedElements } = require('./rasterize');
const { getBaseName, saveScreenshot, saveHtml } = require('./screenshot');

/**
 * Extract slide data from HTML page
 * This function runs in the browser context using helpers from the bundled ExtractSlideData
 * @param {import('playwright').Page} page
 * @param {string} tmpDir
 * @param {string} htmlFile
 * @returns {Promise<object>}
 */
async function extractSlideData(page, tmpDir, htmlFile) {
  // Extract data from browser
  const slideData = await page.evaluate(() => {
    const { ExtractSlideData } = window;
    return ExtractSlideData.extractSlideDataInBrowser();
  });

  // Rasterize SVG, canvas, gradient elements
  await rasterizeMarkedElements(page, slideData, tmpDir);

  // Save screenshot and HTML
  const baseName = getBaseName(htmlFile);
  slideData.screenshot = await saveScreenshot(page, tmpDir, baseName);
  saveHtml(slideData, tmpDir, baseName);

  return slideData;
}

module.exports = {
  extractSlideData,
};
