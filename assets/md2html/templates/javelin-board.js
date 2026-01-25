/**
 * Javelin Board slide generator
 * Generates HTML table with data-pptx-table attribute for native PPTX table output
 */

const { getColors } = require('../theme');
const { escapeHtml } = require('../utils/escape-html');

/**
 * Generate Javelin Board Slide
 * Outputs an HTML table with embedded JSON data for PPTX native table conversion
 * @param {import('../types').SlideDefinition} slide
 * @returns {{style: string, body: string}}
 */
function generateJavelinBoardSlide(slide) {
  const COLORS = getColors();
  const tableData = slide.javelinBoardData || { headers: [], rows: [] };

  // 340pt in PPTX ≈ 453px at 96dpi
  const tableHeight = 453;

  const style = `    .slide {
      background: ${COLORS.surface};
      padding: 24px 40px 8px;
    }
    h1 {
      color: ${COLORS.text};
      font-size: 13px;
      margin: 0 0 2px 0;
    }
    .javelin-board {
      width: 880px;
      height: ${tableHeight}px;
      border-collapse: collapse;
      table-layout: fixed;
    }
    .javelin-board th,
    .javelin-board td {
      border: 1px solid ${COLORS.border};
      padding: 6px 8px;
      text-align: left;
      font-size: 10px;
      line-height: 1.3;
      vertical-align: middle;
    }
    .javelin-board th p,
    .javelin-board td p {
      margin: 0;
      padding: 0;
    }
    .javelin-board th {
      background: ${COLORS.headerBg};
      color: ${COLORS.text};
      font-weight: 700;
      font-size: 10px;
    }
    .javelin-board td:first-child {
      background: ${COLORS.headerBg};
      width: 100px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: ${COLORS.text};
    }
    .javelin-board td {
      background: ${COLORS.white};
      color: ${COLORS.muted};
    }
    .javelin-board tr:last-child td {
      font-weight: 600;
    }`;

  const title = slide.title || slide.name;

  // Build table rows for pptxgenjs
  // First row is headers, rest are data rows
  const pptxRows = [tableData.headers, ...tableData.rows];
  const rowCount = pptxRows.length;

  // Calculate row height: 340pt total / rowCount = height per row in inches
  // 340pt = 4.72 inches
  const totalHeightInches = 4.72;
  const rowHeightInches = totalHeightInches / rowCount;

  // JSON data for PPTX native table
  const pptxTableJson = JSON.stringify({
    rows: pptxRows,
    options: {
      fontFace: 'Meiryo',
      fontSize: 10,
      border: { pt: 1, color: '363636' },
      colW: calculateColumnWidths(tableData.headers.length),
      rowH: Array(rowCount).fill(rowHeightInches),
    },
  });

  // Generate HTML table for preview
  const headerCells = tableData.headers.map((h) => `        <th><p>${escapeHtml(h)}</p></th>`).join('\n');

  const dataRows = tableData.rows
    .map((row) => {
      const cells = row.map((cell) => `        <td><p>${escapeHtml(cell)}</p></td>`).join('\n');
      return `      <tr>\n${cells}\n      </tr>`;
    })
    .join('\n');

  const body = `    <h1>${escapeHtml(title)}</h1>
    <table class="javelin-board" data-pptx-table='${pptxTableJson.replace(/'/g, '&#39;')}'>
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
 * Total width: 660pt = 9.17 inches
 * @param {number} colCount - Number of columns
 * @returns {number[]} Array of column widths in inches
 */
function calculateColumnWidths(colCount) {
  const totalWidth = 9.17; // 660pt
  if (colCount <= 1) return [totalWidth];

  // First column (label) is narrower
  const labelWidth = 1.2;
  const remainingWidth = totalWidth - labelWidth;
  const dataColWidth = remainingWidth / (colCount - 1);

  return [labelWidth, ...Array(colCount - 1).fill(dataColWidth)];
}

module.exports = generateJavelinBoardSlide;
