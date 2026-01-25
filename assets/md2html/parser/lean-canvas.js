/**
 * Lean Canvas slide parser
 */

const { PATTERNS, INDENT } = require('../constants');

/**
 * Parse lean canvas slide
 * @param {string[]} lines - Body lines
 * @returns {{leanCanvasSections: Object}}
 */
function parseLeanCanvas(lines) {
  const sectionPatterns = [
    { key: 'problem', pattern: PATTERNS.leanCanvasProblem, label: '課題' },
    { key: 'solution', pattern: PATTERNS.leanCanvasSolution, label: 'ソリューション' },
    { key: 'uvp', pattern: PATTERNS.leanCanvasUvp, label: '独自の価値提案' },
    { key: 'advantage', pattern: PATTERNS.leanCanvasAdvantage, label: '競合優位性' },
    { key: 'customer', pattern: PATTERNS.leanCanvasCustomer, label: '顧客セグメント' },
    { key: 'metrics', pattern: PATTERNS.leanCanvasMetrics, label: '主要指標' },
    { key: 'channels', pattern: PATTERNS.leanCanvasChannels, label: 'チャネル' },
    { key: 'cost', pattern: PATTERNS.leanCanvasCost, label: 'コスト構造' },
    { key: 'revenue', pattern: PATTERNS.leanCanvasRevenue, label: '収益の流れ' },
  ];

  const sections = {};
  let currentSection = null;

  for (const line of lines) {
    const match = line.match(PATTERNS.listItem);
    if (!match) continue;

    const [, spaces, content] = match;
    const indent = spaces.length;

    // Check for section headers
    for (const { key, pattern, label } of sectionPatterns) {
      if (pattern.test(content)) {
        currentSection = key;
        sections[key] = { label, items: [] };
        break;
      }
    }

    // Add items to current section (indent >= 4)
    if (currentSection && indent >= INDENT.FIRST_LEVEL && sections[currentSection]) {
      sections[currentSection].items.push(content);
    }
  }

  return { leanCanvasSections: sections };
}

module.exports = parseLeanCanvas;
