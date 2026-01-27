/**
 * Customer Journey slide generator
 * Generates native PPTX table with data-pptx-table attribute
 * Supports 4 rows: 行動, タッチポイント, ペイン (red bg), ゲイン (green bg)
 */

const { getColors } = require('../theme');
const { escapeHtml } = require('../utils/escape-html');

/**
 * Row background colors for PPTX
 */
const ROW_COLORS = {
  '行動': { bg: 'FFFFFF', color: '64748B' },
  'タッチポイント': { bg: 'FFFFFF', color: '64748B' },
  'ペイン': { bg: 'FDECEA', color: 'B91C1C' }, // Light red background
  'ゲイン': { bg: 'DCFCE7', color: '166534' }, // Light green background
};

/**
 * Generate Customer Journey Slide
 * Outputs native PPTX table with data-pptx-table attribute
 * @param {import('../types').SlideDefinition} slide
 * @returns {{style: string, body: string}}
 */
function generateCustomerJourneySlide(slide) {
  const COLORS = getColors();
  const data = slide.customerJourneyData || { phases: [], rows: [] };
  const phases = data.phases || [];
  const rows = data.rows || [];
  const phaseCount = phases.length;

  // Font sizes for PPTX output
  const fontSize = 7; // Data cells
  const phaseFontSize = 8; // Phase headers

  const style = `    body {
      background: ${COLORS.surface};
    }
    .slide {
      padding: 24px 24px 16px;
      display: flex;
      flex-direction: column;
    }
    h1 {
      color: ${COLORS.text};
      font-size: 14px;
      font-weight: 700;
      margin: 0 0 4px 0;
      text-align: left;
    }
    .table-container {
      flex: 1;
    }
    .journey-table {
      border-collapse: collapse;
      width: 912px;
      table-layout: fixed;
    }
    .journey-table th,
    .journey-table td {
      border: 1px solid ${COLORS.border};
      padding: 2px 3px;
      text-align: left;
      font-size: ${fontSize}px;
      line-height: 1.15;
      vertical-align: top;
      overflow: hidden;
    }
    .journey-table th p,
    .journey-table td p {
      margin: 0;
      white-space: pre-line;
    }
    .journey-table th {
      background: ${COLORS.primary};
      color: ${COLORS.white};
      font-weight: 700;
      text-align: center;
      vertical-align: middle;
    }
    .journey-table th:first-child {
      font-size: 5px;
    }
    .journey-table th:first-child,
    .journey-table td:first-child {
      width: 35px;
      min-width: 35px;
      max-width: 35px;
    }
    .journey-table td.row-label {
      background: #E2E8F0;
      font-weight: 600;
      font-size: 6px;
      color: ${COLORS.text};
      text-align: center;
      vertical-align: middle;
      width: 35px;
    }
    .journey-table tr.row-pain td {
      background: #FDECEA;
      color: #B91C1C;
    }
    .journey-table tr.row-pain td.row-label {
      background: #FDECEA;
      color: #B91C1C;
      font-size: 6px;
    }
    .journey-table tr.row-gain td {
      background: #DCFCE7;
      color: #166534;
    }
    .journey-table tr.row-gain td.row-label {
      background: #DCFCE7;
      color: #166534;
      font-size: 6px;
    }
`;

  const title = slide.title || slide.name;

  // Build PPTX table data
  // Header row: [フェーズ, phase1, phase2, ...]
  const headerRow = ['フェーズ', ...phases];

  // Data rows: [rowLabel, cell1, cell2, ...]
  // Each cell joins list items with bullet points and newlines
  const dataRows = rows.map((row) => {
    const rowLabel = row.label;
    const cells = row.cells.map((cellItems) => {
      if (!cellItems || cellItems.length === 0) return '';
      return cellItems.map((item) => `• ${item}`).join('\n');
    });
    return [rowLabel, ...cells];
  });

  const pptxRows = [headerRow, ...dataRows];
  const colCount = headerRow.length;

  // Calculate column widths: first column narrow, rest equal
  const totalWidth = 8.8;
  const labelColWidth = 0.45;
  const contentColWidth = (totalWidth - labelColWidth) / (colCount - 1);
  const colW = [labelColWidth, ...Array(colCount - 1).fill(contentColWidth)];

  // Build row-specific styling for PPTX
  const rowStyles = rows.map((row) => ROW_COLORS[row.label] || { bg: 'FFFFFF', color: '64748B' });

  // JSON data for PPTX native table
  const pptxTableJson = JSON.stringify({
    rows: pptxRows,
    options: {
      fontFace: 'Meiryo',
      fontSize: fontSize,
      border: { pt: 1, color: COLORS.border.replace('#', '') },
      colW,
      rowStyles, // Custom: row-specific colors
      headerBg: COLORS.primary.replace('#', ''),
      headerColor: 'FFFFFF',
      headerLabelFontSize: 8, // "フェーズ" label
      phaseFontSize, // Phase names (認知, 検討, etc.)
      labelBg: 'E2E8F0',
      labelColor: COLORS.text.replace('#', ''),
      cellBg: 'FFFFFF',
      cellColor: '64748B',
    },
  });

  // Generate HTML table for preview
  const headerCells = headerRow.map((h) => `        <th><p>${escapeHtml(h)}</p></th>`).join('\n');

  const htmlRows = rows
    .map((row) => {
      const rowClass = row.label === 'ペイン' ? 'row-pain' : row.label === 'ゲイン' ? 'row-gain' : '';
      const labelCell = `        <td class="row-label"><p>${escapeHtml(row.label)}</p></td>`;
      const contentCells = row.cells
        .map((cellItems) => {
          if (!cellItems || cellItems.length === 0) {
            return '        <td><p></p></td>';
          }
          const content = cellItems.map((item) => `• ${escapeHtml(item)}`).join('\n');
          return `        <td><p>${content}</p></td>`;
        })
        .join('\n');
      return `      <tr class="${rowClass}">\n${labelCell}\n${contentCells}\n      </tr>`;
    })
    .join('\n');

  const body = `    <h1>${escapeHtml(title)}</h1>
    <div class="table-container">
      <table class="journey-table" data-pptx-table='${pptxTableJson}'>
        <thead>
        <tr>
${headerCells}
        </tr>
        </thead>
        <tbody>
${htmlRows}
        </tbody>
      </table>
    </div>`;

  return { style, body };
}

module.exports = generateCustomerJourneySlide;
