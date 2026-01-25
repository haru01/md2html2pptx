/**
 * Rasterization utilities for SVG, canvas, and gradient elements
 */

const path = require('path');
const crypto = require('crypto');

/**
 * Get the CSS style rules for a specific rasterization type
 * This determines what elements are visible during screenshot and how they're styled
 * @param {string} rasterizationType
 * @param {string} rasterizeId
 * @returns {string}
 */
function getStyleForRasterizationType(rasterizationType, rasterizeId) {
  const baseStyle = `
    html, body {background: transparent;}
    * {visibility: hidden;}
  `;

  switch (rasterizationType) {
    case 'svg':
      return baseStyle + `svg, svg * {visibility: visible;}`;
    case 'canvas':
      return baseStyle + `canvas {visibility: visible;}`;
    case 'gradient':
      return (
        baseStyle +
        `[data-rasterize="${rasterizeId}"] {
          visibility: visible;
          box-shadow: none;
        }`
      );
    default:
      return (
        baseStyle +
        `svg, canvas, [data-rasterize] {visibility: visible;}
        svg *, canvas, [data-rasterize] * {visibility: visible;}`
      );
  }
}

/**
 * Capture screenshots of all marked elements (SVG, canvas, or gradient backgrounds)
 * Updates the SlideData in place, setting the src property on rasterized-image elements
 * Different element types receive different styling to ensure proper rendering
 * @param {import('playwright').Page} page
 * @param {object} slideData
 * @param {string} tmpDir
 */
async function rasterizeMarkedElements(page, slideData, tmpDir) {
  const rasterizedElements = slideData.elements.filter((el) => el.type === 'rasterized-image');
  if (rasterizedElements.length === 0) return;

  for (const element of rasterizedElements) {
    const rasterizeId = element.rasterizeId;
    const rasterizationType = element.rasterizationType;

    try {
      const locator = page.locator(`[data-rasterize="${rasterizeId}"]`);
      if ((await locator.count()) === 0) {
        throw new Error(`Element with data-rasterize="${rasterizeId}" not found in page`);
      }

      const hash = crypto.createHash('md5').update(`${rasterizeId}-${Date.now()}`).digest('hex').substring(0, 8);
      const outputPath = path.join(tmpDir, `rasterized-${rasterizationType}-${hash}.png`);

      await locator.screenshot({
        path: outputPath,
        type: 'png',
        scale: 'device',
        animations: 'disabled',
        omitBackground: true,
        style: getStyleForRasterizationType(rasterizationType, rasterizeId),
      });

      element.src = outputPath;
    } catch (error) {
      throw new Error(
        `Failed to rasterize ${rasterizationType} element with id "${rasterizeId}": ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

module.exports = {
  getStyleForRasterizationType,
  rasterizeMarkedElements,
};
