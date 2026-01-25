/**
 * Bullet list (content) slide generator
 */

const { getColors } = require('../theme');
const { escapeHtml } = require('../utils/escape-html');

/**
 * Generate Content Slide with bullet list (supports nested items)
 * @param {import('../types').SlideDefinition} slide
 * @returns {{style: string, body: string}}
 */
function generateBulletListSlide(slide) {
  const COLORS = getColors();
  const items = slide.items || [];

  const style = `    .slide {
      background: ${COLORS.surface};
      padding: 32px 60px;
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
      margin: 0 0 24px 0;
    }
    .content {
      padding: 0;
    }
    .content-list {
      margin: 0;
      padding-left: 24px;
      list-style: none;
    }
    .content-list > li {
      color: ${COLORS.text};
      font-size: 24px;
      font-weight: 600;
      line-height: 1.5;
      margin-bottom: 16px;
    }
    .content-list > li:last-child {
      margin-bottom: 0;
    }
    .sub-list {
      margin: 4px 0 0 0;
      padding-left: 20px;
      list-style: none;
    }
    .sub-list > li {
      color: ${COLORS.muted};
      font-size: 16px;
      font-weight: 400;
      line-height: 1.6;
      margin-bottom: 2px;
    }
    .sub-list > li:last-child {
      margin-bottom: 0;
    }
    .sub-sub-list {
      margin: 2px 0 0 0;
      padding-left: 16px;
      list-style: none;
    }
    .sub-sub-list > li {
      color: #94A3B8;
      font-size: 16px;
      font-weight: 400;
      line-height: 1.6;
      margin-bottom: 2px;
    }
    /* Fallback for flat list */
    ul.flat-list {
      margin: 0;
      padding-left: 24px;
      list-style: none;
    }
    ul.flat-list li {
      color: #475569;
      font-size: 20px;
      line-height: 1.8;
      margin-bottom: 8px;
    }
    ul.flat-list li:last-child {
      margin-bottom: 0;
    }`;

  const section = slide.section ? `    <p class="section-num">${escapeHtml(slide.section)}</p>\n` : '';
  const title = slide.title || slide.name;

  // Generate nested list HTML
  const generateNestedList = (items, depth = 0) => {
    const listClass = depth === 0 ? 'content-list' : depth === 1 ? 'sub-list' : 'sub-sub-list';
    const itemsHtml = items
      .map((item) => {
        if (typeof item === 'object' && item.subItems && item.subItems.length > 0) {
          const subListHtml = generateNestedList(item.subItems, depth + 1);
          return `        <li>${escapeHtml(item.text)}\n${subListHtml}        </li>`;
        } else if (typeof item === 'object' && item.subSubItems && item.subSubItems.length > 0) {
          // Handle subSubItems (third level)
          const subSubListHtml = generateNestedList(
            item.subSubItems.map((text) => ({ text })),
            depth + 1
          );
          return `        <li>${escapeHtml(item.text)}\n${subSubListHtml}        </li>`;
        } else {
          const text = typeof item === 'object' ? item.text : item;
          return `        <li>${escapeHtml(text)}</li>`;
        }
      })
      .join('\n');
    return `      <ul class="${listClass}">\n${itemsHtml}\n      </ul>\n`;
  };

  const listHtml = generateNestedList(items);

  const body = `${section}    <h1>${escapeHtml(title)}</h1>
    <div class="content">
${listHtml}    </div>`;

  return { style, body };
}

module.exports = generateBulletListSlide;
