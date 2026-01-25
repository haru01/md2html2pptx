/**
 * Image element handlers for PowerPoint slides
 */

/**
 * Add an image element to the slide
 * @param {object} el - Image element data
 * @param {import('pptxgenjs').Slide} targetSlide
 */
function addImage(el, targetSlide) {
  const imagePath = el.src.startsWith('file://') ? el.src.replace('file://', '') : el.src;
  targetSlide.addImage({
    path: imagePath,
    x: el.position.x,
    y: el.position.y,
    w: el.position.w,
    h: el.position.h,
  });
}

/**
 * Add a rasterized image element to the slide (SVG, canvas, gradient screenshots)
 * @param {object} el - Rasterized image element data
 * @param {import('pptxgenjs').Slide} targetSlide
 */
function addRasterizedImage(el, targetSlide) {
  if (!el.src) {
    throw new Error(`Rasterized image element with id "${el.rasterizeId}" is missing screenshot path`);
  }

  const imageOptions = {
    path: el.src.startsWith('file://') ? el.src.replace('file://', '') : el.src,
    x: el.position.x,
    y: el.position.y,
    w: el.position.w,
    h: el.position.h,
  };

  if (el.shadow) imageOptions.shadow = el.shadow;

  targetSlide.addImage(imageOptions);
}

module.exports = {
  addImage,
  addRasterizedImage,
};
