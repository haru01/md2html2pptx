/**
 * Shape element handler for PowerPoint slides
 */

/**
 * Add a shape element to the slide
 * @param {object} el - Shape element data
 * @param {import('pptxgenjs').Slide} targetSlide
 */
function addShape(el, targetSlide) {
  const shapeOptions = {
    x: el.position.x,
    y: el.position.y,
    w: el.position.w,
    h: el.position.h,
  };

  if (el.shape.backgroundImage) {
    shapeOptions.path = el.shape.backgroundImage.startsWith('file://')
      ? el.shape.backgroundImage.replace('file://', '')
      : el.shape.backgroundImage;
  }

  if (el.shape.fill) {
    shapeOptions.fill = { color: el.shape.fill };
    if (el.shape.transparency != null) {
      shapeOptions.fill.transparency = el.shape.transparency;
    }
  }

  if (el.shape.line) shapeOptions.line = el.shape.line;

  if (el.shape.rectRadius > 0) {
    shapeOptions.rectRadius = el.shape.rectRadius;
    shapeOptions.shape = 'roundRect';
  }

  if (el.shape.shadow) shapeOptions.shadow = el.shape.shadow;

  targetSlide.addText(el.text || '', shapeOptions);
}

module.exports = {
  addShape,
};
