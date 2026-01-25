/**
 * Flow slide generator
 */

const { getColors } = require('../theme');
const { escapeHtml } = require('../utils/escape-html');

/**
 * Generate Flow Slide (horizontal flow with arrows)
 * @param {import('../types').SlideDefinition} slide
 * @returns {{style: string, body: string}}
 */
function generateFlowSlide(slide) {
  const COLORS = getColors();
  const items = slide.flowItems || slide.items || [];

  const style = `    .slide {
      background: ${COLORS.surface};
      padding: 32px 60px;
      display: flex;
      flex-direction: column;
    }
    .section-num {
      color: ${COLORS.primary};
      font-size: 14px;
      font-weight: 600;
      margin: 0 0 4px 0;
    }
    h1 {
      color: ${COLORS.text};
      font-size: 28px;
      margin: 0 0 32px 0;
    }
    .content {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .flow {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .flow-item {
      width: 140px;
      flex-shrink: 0;
      border-radius: 12px;
      padding: 20px 16px;
      text-align: center;
      background: ${COLORS.primary};
    }
    .flow-item p {
      color: ${COLORS.white};
      font-size: 14px;
      font-weight: 500;
      margin: 0;
    }
    .arrow {
      color: ${COLORS.primary};
      font-size: 24px;
    }
    .arrow p {
      margin: 0;
    }`;

  const section = slide.section ? `    <p class="section-num">${escapeHtml(slide.section)}</p>\n` : '';
  const title = slide.title || slide.name;

  const flowHtml = items
    .map((item, index) => {
      const arrow = index < items.length - 1 ? '\n        <div class="arrow"><p>→</p></div>' : '';
      return `        <div class="flow-item">
          <p>${escapeHtml(item)}</p>
        </div>${arrow}`;
    })
    .join('\n');

  const body = `${section}    <h1>${escapeHtml(title)}</h1>
    <div class="content">
      <div class="flow">
${flowHtml}
      </div>
    </div>`;

  return { style, body };
}

module.exports = generateFlowSlide;
