/**
 * Validation utilities for html2pptx
 */

const { PT_PER_PX, PX_PER_IN, EMU_PER_IN } = require('../constants');

/**
 * Get body dimensions and check for overflow
 * @param {import('playwright').Page} page
 * @returns {Promise<{width: number, height: number, scrollWidth: number, scrollHeight: number, errors: string[]}>}
 */
async function getBodyDimensions(page) {
  const initialDimensions = await page.evaluate(() => {
    const body = document.body;
    const style = window.getComputedStyle(body);
    return {
      width: parseFloat(style.width),
      height: parseFloat(style.height),
    };
  });

  await page.setViewportSize({
    width: Math.round(initialDimensions.width),
    height: Math.round(initialDimensions.height),
  });

  const bodyDimensions = await page.evaluate(() => {
    const body = document.body;
    const style = window.getComputedStyle(body);
    return {
      width: parseFloat(style.width),
      height: parseFloat(style.height),
      scrollWidth: body.scrollWidth,
      scrollHeight: body.scrollHeight,
    };
  });

  const errors = [];
  const widthOverflowPx = Math.max(0, bodyDimensions.scrollWidth - bodyDimensions.width - 1);
  const heightOverflowPx = Math.max(0, bodyDimensions.scrollHeight - bodyDimensions.height - 1);
  const widthOverflowPt = widthOverflowPx * PT_PER_PX;
  const heightOverflowPt = heightOverflowPx * PT_PER_PX;

  if (widthOverflowPt > 0 || heightOverflowPt > 0) {
    const directions = [];
    if (widthOverflowPt > 0) directions.push(`${widthOverflowPt.toFixed(1)}pt horizontally`);
    if (heightOverflowPt > 0) directions.push(`${heightOverflowPt.toFixed(1)}pt vertically`);
    const reminder = heightOverflowPt > 0 ? ' (Remember: leave 0.5" margin at bottom of slide)' : '';
    errors.push(`HTML content overflows body by ${directions.join(' and ')}${reminder}`);
  }

  return {
    ...bodyDimensions,
    errors,
  };
}

/**
 * Validate dimensions match presentation layout
 * @param {{width: number, height: number}} bodyDimensions
 * @param {import('pptxgenjs')} pres
 * @returns {string[]}
 */
function validateDimensions(bodyDimensions, pres) {
  const errors = [];
  const widthInches = bodyDimensions.width / PX_PER_IN;
  const heightInches = bodyDimensions.height / PX_PER_IN;

  if (pres.presLayout) {
    const layoutWidth = pres.presLayout.width / EMU_PER_IN;
    const layoutHeight = pres.presLayout.height / EMU_PER_IN;
    if (Math.abs(layoutWidth - widthInches) > 0.1 || Math.abs(layoutHeight - heightInches) > 0.1) {
      errors.push(
        `HTML dimensions (${widthInches.toFixed(1)}" × ${heightInches.toFixed(1)}") don't match presentation layout (${layoutWidth.toFixed(1)}" × ${layoutHeight.toFixed(1)}")`
      );
    }
  }

  return errors;
}

/**
 * Validate text box positions are not too close to bottom edge
 * @param {{elements: Array}} slideData
 * @param {{width: number, height: number}} bodyDimensions
 * @returns {string[]}
 */
function validateTextBoxPosition(slideData, bodyDimensions) {
  const errors = [];
  const slideHeightInches = bodyDimensions.height / PX_PER_IN;
  const minBottomMargin = 0.5;

  for (const el of slideData.elements) {
    if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'list'].includes(el.type)) {
      if (el.type === 'line' || el.type === 'image' || el.type === 'rasterized-image' || el.type === 'shape') continue;

      const fontSize = el.style?.fontSize || 0;
      const distanceFromBottom = slideHeightInches - (el.position.y + el.position.h);

      if (fontSize > 10.5 && distanceFromBottom < minBottomMargin) {
        const getText = () => {
          if (el.type === 'list') return el.items.find((item) => item.text)?.text || '';
          if (typeof el.text === 'string') return el.text;
          if (Array.isArray(el.text)) return el.text.find((t) => t.text)?.text || '';
          return '';
        };
        const textPrefix = getText().substring(0, 50) + (getText().length > 50 ? '...' : '');
        errors.push(
          `Text box "${textPrefix}" ends too close to bottom edge (${distanceFromBottom.toFixed(2)}" from bottom, minimum ${minBottomMargin}" required)`
        );
      }
    }
  }

  return errors;
}

module.exports = {
  getBodyDimensions,
  validateDimensions,
  validateTextBoxPosition,
};
