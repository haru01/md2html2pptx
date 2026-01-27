/**
 * Lean Canvas slide parser
 */

const { PATTERNS } = require('../constants');

/**
 * Section definitions for lean canvas
 */
const SECTION_DEFINITIONS = [
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

/**
 * Parse lean canvas slide
 * Supports new format: ### セクション名: followed by - 項目
 * @param {string[]} lines - Body lines
 * @returns {{leanCanvasSections: Object, leanCanvasDate?: string}}
 */
function parseLeanCanvas(lines) {
  const sections = {};
  let currentSection = null;
  let date = null;
  let isDateSection = false;

  for (const line of lines) {
    // Check for ### section header (new format)
    const headerMatch = line.match(PATTERNS.leanCanvasSectionHeader);
    if (headerMatch) {
      const headerContent = headerMatch[1].trim();

      // Check for date section
      if (PATTERNS.leanCanvasDate.test(headerContent)) {
        isDateSection = true;
        currentSection = null;
        continue;
      }

      isDateSection = false;
      for (const { key, pattern, label } of SECTION_DEFINITIONS) {
        if (pattern.test(headerContent)) {
          currentSection = key;
          sections[key] = { label, items: [] };
          break;
        }
      }
      continue;
    }

    // Check for list item
    const listMatch = line.match(PATTERNS.listItem);
    if (listMatch) {
      const content = listMatch[2].trim();

      // Date section stores first item as date
      if (isDateSection && !date) {
        date = content;
        continue;
      }

      if (currentSection && sections[currentSection]) {
        sections[currentSection].items.push(content);
      }
    }
  }

  const result = { leanCanvasSections: sections };
  if (date) {
    result.leanCanvasDate = date;
  }
  return result;
}

module.exports = parseLeanCanvas;
