/**
 * Lean Canvas slide generator
 */

const { getColors } = require('../theme');
const { escapeHtml } = require('../utils/escape-html');

/**
 * Generate Lean Canvas Slide
 * Layout based on standard Lean Canvas with merged cells
 * @param {import('../types').SlideDefinition} slide
 * @returns {{style: string, body: string}}
 */
function generateLeanCanvasSlide(slide) {
  const COLORS = getColors();
  const sections = slide.leanCanvasSections || {};

  // Define the 9 sections with their grid positions
  const sectionDefs = [
    { key: 'problem', label: '課題', gridArea: 'problem' },
    { key: 'solution', label: 'ソリューション', gridArea: 'solution' },
    { key: 'uvp', label: '独自の価値提案', gridArea: 'uvp' },
    { key: 'advantage', label: '競合優位性', gridArea: 'advantage' },
    { key: 'customer', label: '顧客セグメント', gridArea: 'customer' },
    { key: 'metrics', label: '主要指標', gridArea: 'metrics' },
    { key: 'channels', label: 'チャネル', gridArea: 'channels' },
    { key: 'cost', label: 'コスト構造', gridArea: 'cost' },
    { key: 'revenue', label: '収益の流れ', gridArea: 'revenue' },
  ];

  const style = `    .slide {
      background: ${COLORS.surface};
      padding: 24px 40px;
    }
    h1 {
      color: ${COLORS.text};
      font-size: 22px;
      margin: 0 0 8px 0;
    }
    .lean-canvas {
      display: grid;
      grid-template-columns: repeat(10, 1fr);
      grid-template-rows: 1fr 1fr 0.6fr;
      grid-template-areas:
        "problem problem solution solution uvp uvp advantage advantage customer customer"
        "problem problem metrics metrics uvp uvp channels channels customer customer"
        "cost cost cost cost cost revenue revenue revenue revenue revenue";
      gap: 6px;
      width: 880px;
      height: 430px;
    }
    .canvas-cell {
      background: ${COLORS.white};
      border: 2px solid ${COLORS.text};
      padding: 8px 10px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .canvas-cell h3 {
      color: ${COLORS.text};
      font-size: 11px;
      font-weight: 700;
      margin: 0 0 6px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .canvas-cell ul {
      margin: 0;
      padding-left: 14px;
      flex: 1;
      overflow: hidden;
    }
    .canvas-cell li {
      color: ${COLORS.muted};
      font-size: 10px;
      line-height: 1.4;
      margin-bottom: 2px;
    }
    .canvas-cell li:last-child {
      margin-bottom: 0;
    }
    .cell-problem { grid-area: problem; }
    .cell-solution { grid-area: solution; }
    .cell-uvp { grid-area: uvp; background: ${COLORS.headerBg}; }
    .cell-advantage { grid-area: advantage; }
    .cell-customer { grid-area: customer; }
    .cell-metrics { grid-area: metrics; }
    .cell-channels { grid-area: channels; }
    .cell-cost { grid-area: cost; }
    .cell-revenue { grid-area: revenue; }`;

  // Lean canvas does not show section number
  const title = slide.title || slide.name;

  // Generate cells HTML
  const cellsHtml = sectionDefs
    .map((def) => {
      const sectionData = sections[def.key] || { label: def.label, items: [] };
      const displayLabel = sectionData.label || def.label;
      const itemsHtml = sectionData.items.map((item) => `          <li>${escapeHtml(item)}</li>`).join('\n');

      return `      <div class="canvas-cell cell-${def.key}">
        <h3>${escapeHtml(displayLabel)}</h3>
        <ul>
${itemsHtml}
        </ul>
      </div>`;
    })
    .join('\n');

  const body = `    <h1>${escapeHtml(title)}</h1>
    <div class="lean-canvas">
${cellsHtml}
    </div>`;

  return { style, body };
}

module.exports = generateLeanCanvasSlide;
