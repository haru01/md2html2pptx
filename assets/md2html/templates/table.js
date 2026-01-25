/**
 * Table slide generator
 * Outputs an HTML table with embedded JSON data for PPTX native table conversion
 */

const { getColors } = require('../theme');
const { escapeHtml } = require('../utils/escape-html');

/**
 * Generate Table Slide with PPTX native table support
 * @param {import('../types').SlideDefinition} slide
 * @returns {{style: string, body: string}}
 */
function generateTableSlide(slide) {
  const COLORS = getColors();
  const table = slide.table || { headers: [], rows: [] };

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
    .pptx-table {
      border-collapse: collapse;
    }
    .pptx-table th,
    .pptx-table td {
      border: 1px solid ${COLORS.border};
      padding: 12px 16px;
      text-align: left;
      font-size: 14px;
      line-height: 1.4;
      vertical-align: middle;
    }
    .pptx-table th p,
    .pptx-table td p {
      margin: 0;
      padding: 0;
    }
    .pptx-table th {
      background: ${COLORS.darkBg};
      color: ${COLORS.white};
      font-weight: 700;
      font-size: 12px;
    }
    .pptx-table td:first-child {
      background: ${COLORS.headerBg};
      font-weight: 600;
      color: ${COLORS.text};
    }
    .pptx-table td {
      background: ${COLORS.white};
      color: ${COLORS.muted};
    }`;

  const section = slide.section ? `    <p class="section-num">${escapeHtml(slide.section)}</p>\n` : '';
  const title = slide.title || slide.name;

  // Build PPTX table rows: first row is headers, rest are data rows
  const pptxRows = [table.headers, ...table.rows];
  const colCount = table.headers.length;

  // JSON data for PPTX native table (auto-size based on content)
  // Pass theme colors so PPTX matches preview
  const pptxTableJson = JSON.stringify({
    rows: pptxRows,
    options: {
      fontFace: 'Meiryo',
      fontSize: 14,
      border: { pt: 1, color: COLORS.border.replace('#', '') },
      colW: calculateColumnWidths(colCount),
      // Theme colors for PPTX styling
      headerBg: '0F172A',
      headerColor: 'FFFFFF',
      labelBg: COLORS.headerBg.replace('#', ''),
      labelColor: COLORS.text.replace('#', ''),
      cellBg: 'FFFFFF',
      cellColor: COLORS.muted.replace('#', ''),
    },
  });

  // Generate HTML table for preview
  const headerCells = table.headers.map((h) => `        <th><p>${escapeHtml(h)}</p></th>`).join('\n');

  const dataRows = table.rows
    .map((row) => {
      const cells = row.map((cell) => `        <td><p>${escapeHtml(cell)}</p></td>`).join('\n');
      return `      <tr>\n${cells}\n      </tr>`;
    })
    .join('\n');

  const body = `${section}    <h1>${escapeHtml(title)}</h1>
    <table class="pptx-table" data-pptx-table='${pptxTableJson}'>
      <thead>
      <tr>
${headerCells}
      </tr>
      </thead>
      <tbody>
${dataRows}
      </tbody>
    </table>`;

  return { style, body };
}

/**
 * Calculate column widths based on number of columns
 * Total width: ~8 inches (leaving margins)
 * @param {number} colCount - Number of columns
 * @returns {number[]} Array of column widths in inches
 */
function calculateColumnWidths(colCount) {
  const totalWidth = 8.0;
  if (colCount <= 1) return [totalWidth];

  // Equal distribution for general tables
  const colWidth = totalWidth / colCount;
  return Array(colCount).fill(colWidth);
}

module.exports = generateTableSlide;
