/**
 * Table slide generator
 */

const { getColors } = require('../theme');
const { escapeHtml } = require('../utils/escape-html');

/**
 * Generate Table Slide
 * @param {import('../types').SlideDefinition} slide
 * @returns {{style: string, body: string}}
 */
function generateTableSlide(slide) {
  const COLORS = getColors();
  const table = slide.table || { headers: [], rows: [] };
  const columnCount = table.headers.length;
  const headerWidth = 180;
  const contentWidth = Math.floor((960 - 120 - headerWidth) / (columnCount - 1));

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
    .table {
      background: ${COLORS.white};
      border-radius: 12px;
      overflow: hidden;
      box-shadow: ${COLORS.cardShadow};
    }
    .table-row {
      display: flex;
      border-bottom: 1px solid ${COLORS.border};
    }
    .table-row:last-child { border-bottom: none; }
    .table-row.header {
      background: ${COLORS.darkBg};
    }
    .cell {
      padding: 16px 24px;
      display: flex;
      align-items: center;
    }
    .cell-header {
      width: ${headerWidth}px;
      flex-shrink: 0;
      background: ${COLORS.headerBg};
    }
    .cell-content {
      width: ${contentWidth}px;
      flex-shrink: 0;
    }
    .table-row.header .cell-header { background: transparent; }
    .table-row.header .cell p {
      color: ${COLORS.white};
      font-size: 14px;
      font-weight: 600;
      margin: 0;
    }
    .cell p {
      font-size: 14px;
      line-height: 1.4;
      margin: 0;
    }
    .cell-header p {
      color: ${COLORS.text};
      font-weight: 600;
    }
    .cell-content p { color: #475569; }
    .highlight {
      color: ${COLORS.primary};
      font-weight: 600;
    }`;

  const section = slide.section ? `    <p class="section-num">${escapeHtml(slide.section)}</p>\n` : '';
  const title = slide.title || slide.name;

  // Header row
  const headerCells = table.headers
    .map((h, i) => {
      const cellClass = i === 0 ? 'cell cell-header' : 'cell cell-content';
      return `        <div class="${cellClass}"><p>${escapeHtml(h)}</p></div>`;
    })
    .join('\n');

  // Data rows
  const dataRows = table.rows
    .map((row) => {
      const cells = row
        .map((cell, i) => {
          const cellClass = i === 0 ? 'cell cell-header' : 'cell cell-content';
          // Highlight last column values
          const content =
            i === row.length - 1 && i > 0
              ? `<span class="highlight">${escapeHtml(cell)}</span>`
              : escapeHtml(cell);
          return `        <div class="${cellClass}"><p>${content}</p></div>`;
        })
        .join('\n');
      return `      <div class="table-row">
${cells}
      </div>`;
    })
    .join('\n');

  const body = `${section}    <h1>${escapeHtml(title)}</h1>
    <div class="table">
      <div class="table-row header">
${headerCells}
      </div>
${dataRows}
    </div>`;

  return { style, body };
}

module.exports = generateTableSlide;
