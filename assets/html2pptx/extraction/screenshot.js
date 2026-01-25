/**
 * Screenshot and HTML saving utilities
 */

const path = require('path');
const { writeFileSync } = require('fs');

/**
 * Get base name for output files from HTML file path
 * @param {string} htmlFile
 * @returns {string}
 */
function getBaseName(htmlFile) {
  let baseName;
  if (htmlFile) {
    const { name } = path.parse(htmlFile);
    baseName = name;
  } else {
    baseName = 'html2pptx';
  }
  return `${baseName}-${Date.now()}`;
}

/**
 * Take a full-page screenshot of the slide
 * @param {import('playwright').Page} page
 * @param {string} tmpDir
 * @param {string} baseName
 * @returns {Promise<string>} Path to the screenshot
 */
async function saveScreenshot(page, tmpDir, baseName) {
  const screenshotPath = path.join(tmpDir, `${baseName}.png`);
  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
  });
  return screenshotPath;
}

/**
 * Save the extracted HTML to a file
 * @param {object} slideData
 * @param {string} tmpDir
 * @param {string} baseName
 */
function saveHtml(slideData, tmpDir, baseName) {
  writeFileSync(path.join(tmpDir, `${baseName}.html`), slideData.html, 'utf-8');
}

module.exports = {
  getBaseName,
  saveScreenshot,
  saveHtml,
};
