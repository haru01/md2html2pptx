/**
 * Title slide generator
 */

const { getColors } = require('../theme');
const { escapeHtml } = require('../utils/escape-html');

/**
 * Generate Title Slide (Dark)
 * @param {import('../types').SlideDefinition} slide
 * @returns {{style: string, body: string}}
 */
function generateTitleSlide(slide) {
  const COLORS = getColors();

  const style = `    .slide {
      background: ${COLORS.titleBackground || COLORS.darkBg};
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
    }
    .part-label {
      color: ${COLORS.accent};
      font-size: 16px;
      font-weight: 600;
      letter-spacing: 2px;
      margin: 0 0 16px 0;
    }
    h1 {
      color: ${COLORS.titleText || COLORS.surface};
      font-size: 42px;
      font-weight: 700;
      text-align: center;
      margin: 0;
      line-height: 1.3;
    }
    .subtitle {
      color: ${COLORS.subtitleText};
      font-size: 20px;
      margin: 32px 0 0 0;
      text-align: center;
    }
    .accent { color: ${COLORS.accent}; }`;

  const partLabel = slide.partNumber ? `    <p class="part-label">PART ${slide.partNumber}</p>\n` : '';
  const mainTitle = slide.mainTitle || slide.name;
  const subtitle = slide.subtitle ? `    <p class="subtitle">${escapeHtml(slide.subtitle)}</p>\n` : '';

  const body = `${partLabel}    <h1>${escapeHtml(mainTitle)}</h1>
${subtitle}`;

  return { style, body: body.trimEnd() };
}

module.exports = generateTitleSlide;
