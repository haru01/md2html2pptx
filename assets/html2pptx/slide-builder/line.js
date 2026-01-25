/**
 * Line element handler for PowerPoint slides
 */

/**
 * Add a line element to the slide
 * @param {object} el - Line element data
 * @param {import('pptxgenjs').Slide} targetSlide
 * @param {import('pptxgenjs')} pres - Presentation instance (for ShapeType)
 */
function addLine(el, targetSlide, pres) {
  targetSlide.addShape(pres.ShapeType.line, {
    x: el.x1,
    y: el.y1,
    w: el.x2 - el.x1,
    h: el.y2 - el.y1,
    line: {
      color: el.color,
      width: el.width,
    },
  });
}

module.exports = {
  addLine,
};
