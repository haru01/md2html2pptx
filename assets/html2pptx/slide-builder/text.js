/**
 * Text element handler for PowerPoint slides (p, h1-h6)
 */

/**
 * Add a text element to the slide
 * @param {object} el - Text element data
 * @param {import('pptxgenjs').Slide} targetSlide
 */
function addText(el, targetSlide) {
  const lineHeight = el.style.lineSpacing || el.style.fontSize * 1.2;
  const isSingleLine = el.position.h <= lineHeight * 1.5;

  let adjustedX = el.position.x;
  let adjustedW = el.position.w;

  // Adjust width for single-line text to prevent wrapping
  if (isSingleLine) {
    const widthIncrease = el.position.w * 0.02;
    const align = el.style.align;
    if (align === 'center') {
      adjustedX = el.position.x - widthIncrease / 2;
      adjustedW = el.position.w + widthIncrease;
    } else if (align === 'right') {
      adjustedX = el.position.x - widthIncrease;
      adjustedW = el.position.w + widthIncrease;
    } else {
      adjustedW = el.position.w + widthIncrease;
    }
  }

  const textOptions = {
    x: adjustedX,
    y: el.position.y,
    w: adjustedW,
    h: el.position.h,
    fontSize: el.style.fontSize,
    fontFace: el.style.fontFace,
    color: el.style.color,
    bold: el.style.bold,
    italic: el.style.italic,
    valign: 'top',
    paraSpaceBefore: el.style.paraSpaceBefore,
    paraSpaceAfter: el.style.paraSpaceAfter,
    inset: 0,
  };

  if (el.style.underline) {
    textOptions.underline = {
      style: 'sng',
      color: el.style.color,
    };
  }

  if (el.style.lineSpacing !== null && el.style.lineSpacing !== undefined) {
    textOptions.lineSpacing = el.style.lineSpacing;
  }

  if (el.style.align) textOptions.align = el.style.align;
  if (el.style.margin) textOptions.margin = el.style.margin;

  if (el.style.rotate !== null && el.style.rotate !== undefined) {
    textOptions.rotate = el.style.rotate;
  }

  if (el.style.transparency !== null && el.style.transparency !== undefined) {
    textOptions.transparency = el.style.transparency;
  }

  targetSlide.addText(el.text, textOptions);
}

module.exports = {
  addText,
};
