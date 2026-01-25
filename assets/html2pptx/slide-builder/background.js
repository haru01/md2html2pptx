/**
 * Background handler for PowerPoint slides
 */

const { generateGradientImage } = require('../utils/gradient');

/**
 * Add background to slide (image or color)
 * Note: Gradient backgrounds are handled via image generation
 * @param {object} slideData
 * @param {import('pptxgenjs').Slide} targetSlide
 * @param {string} tmpDir
 * @param {number} slideWidth
 * @param {number} slideHeight
 */
async function addBackground(slideData, targetSlide, tmpDir, slideWidth = 10, slideHeight = 5.625) {
  if (slideData.background.type === 'image' && slideData.background.path) {
    const path = slideData.background.path;
    if (path.includes('linear-gradient') || path.includes('radial-gradient')) {
      targetSlide.background = {
        path: await generateGradientImage(path, Math.round(slideWidth * 96), Math.round(slideHeight * 96), tmpDir),
      };
    } else {
      targetSlide.background = { path: path.startsWith('file://') ? path.replace('file://', '') : path };
    }
  } else if (slideData.background.type === 'color' && slideData.background.value) {
    targetSlide.background = { color: slideData.background.value };
  }
}

module.exports = {
  addBackground,
};
