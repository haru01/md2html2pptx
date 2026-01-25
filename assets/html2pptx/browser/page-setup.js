/**
 * Page preparation utilities for html2pptx
 */

const { dirname, join } = require('path');
const { existsSync, readFileSync } = require('fs');
const { addStyleElement } = require('../utils/style-injector');

// Determine playwright directory location
const __dirname_local = __dirname;
const playwrightDir = existsSync(join(__dirname_local, '../playwright/index.css'))
  ? join(__dirname_local, '../playwright')
  : join(__dirname_local, '../../dist/playwright');

/**
 * Add scripts and styles to the HTML page and run init function
 * @param {import('playwright').Page} page
 */
async function preparePage(page) {
  const cssPath = join(playwrightDir, 'index.css');
  const scriptPath = join(playwrightDir, 'index.iife.js');

  const cssContent = readFileSync(cssPath, 'utf-8');
  const jsContent = readFileSync(scriptPath, 'utf-8');

  await addStyleElement(page, cssContent);
  await page.addScriptTag({ content: jsContent });

  await page.evaluate(() => {
    const { ExtractSlideData } = window;
    return ExtractSlideData.init();
  });
}

module.exports = {
  preparePage,
  playwrightDir,
};
