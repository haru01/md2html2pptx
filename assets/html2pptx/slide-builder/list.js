/**
 * List element handler for PowerPoint slides
 */

/**
 * Add a list element to the slide
 * @param {object} el - List element data
 * @param {import('pptxgenjs').Slide} targetSlide
 */
function addList(el, targetSlide) {
  const listOptions = {
    x: el.position.x,
    y: el.position.y,
    w: el.position.w,
    h: el.position.h,
    fontSize: el.style.fontSize,
    fontFace: el.style.fontFace,
    color: el.style.color,
    align: el.style.align,
    valign: 'top',
    paraSpaceBefore: el.style.paraSpaceBefore,
    paraSpaceAfter: el.style.paraSpaceAfter,
  };

  if (el.style.lineSpacingMultiple !== null && el.style.lineSpacingMultiple !== undefined) {
    listOptions.lineSpacingMultiple = el.style.lineSpacingMultiple;
  }

  if (el.style.margin) listOptions.margin = el.style.margin;

  targetSlide.addText(el.items, listOptions);
}

module.exports = {
  addList,
};
