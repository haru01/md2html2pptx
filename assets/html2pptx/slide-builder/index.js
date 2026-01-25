/**
 * PowerPoint slide building - Entry point
 * Uses registry pattern to dispatch element types to handlers
 */

const { addBackground } = require('./background');
const { addImage, addRasterizedImage } = require('./image');
const { addLine } = require('./line');
const { addShape } = require('./shape');
const { addList } = require('./list');
const { addText } = require('./text');
const { addPptxTable } = require('./table');

/**
 * Element type to handler function mapping
 */
const elementHandlers = {
  image: addImage,
  'rasterized-image': addRasterizedImage,
  line: addLine,
  shape: addShape,
  list: addList,
  'pptx-table': addPptxTable,
};

/**
 * Add all elements to slide (images, shapes, text, lists)
 * @param {object} slideData
 * @param {import('pptxgenjs').Slide} targetSlide
 * @param {import('pptxgenjs')} pres
 */
async function addElements(slideData, targetSlide, pres) {
  for (const el of slideData.elements) {
    const handler = elementHandlers[el.type];
    if (handler) {
      await handler(el, targetSlide, pres);
    } else {
      // Default: text elements (p, h1-h6)
      addText(el, targetSlide);
    }
  }
}

module.exports = {
  addBackground,
  addElements,
};
