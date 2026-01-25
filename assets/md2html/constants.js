/**
 * Constants for md2html parser
 * Regex patterns, indentation levels, and element type definitions
 */

/**
 * Maximum nesting depth for composite slides
 */
const MAX_COMPOSITE_DEPTH = 3;

/**
 * Indentation levels in spaces
 */
const INDENT = {
  TOP_LEVEL: 2,
  FIRST_LEVEL: 4,
  SECOND_LEVEL: 6,
};

/**
 * Regex patterns for parsing markdown elements
 */
const PATTERNS = {
  slideNumbered: /^##\s*(\d+(?:\.\d+)?)[:：]\s*(.+)$/,
  slideSimple: /^##\s+(.+)$/,
  slideHeader: /^##\s/,
  titleSlideHeader: /^##\s*(?:PART\s*)?(\d+)部?[:：]\s*(.+)$/i,
  part: /^PART\s*(\d+)$/i,
  section: /^セクション[:：]\s*(.+)$/,
  title: /^タイトル[:：]\s*(.+)$/,
  subtitle: /^副題[:：]\s*(.+)$/,
  layout: /^layout[:：]\s*(.+)$/i,
  composite: /^複合[:：]\s*(.+)$/,
  leanCanvas: /^リーンキャンバス[:：]?\s*$/,
  bulletList: /^(内容|箇条書き|リスト)[:：]?\s*$/,
  code: /^コード[:：]?\s*$/,
  mermaid: /^[Mm]ermaid[:：]?\s*$/,
  table: /^テーブル[:：]?\s*$/,
  flow: /^フロー[:：]?\s*$/,
  card: /^カード(\d+)[:：]\s*(.+)$/,
  step: /^ステップ(\d+)[:：]\s*(.+)$/,
  good: /^Good[:：]\s*(.+)$/,
  bad: /^Bad[:：]\s*(.+)$/,
  tableRow: /^\|.+\|$/,
  tableSeparator: /^\|[-:\s|]+\|$/,
  listItem: /^(\s*)-\s+(.+)$/,
  codeBlockMarker: /^```/,
  // Lean canvas sections
  leanCanvasProblem: /^課題[:：]?\s*$/,
  leanCanvasSolution: /^ソリューション[:：]?\s*$/,
  leanCanvasUvp: /^独自の価値提案[:：]?\s*$/,
  leanCanvasAdvantage: /^競合優位性[:：]?\s*$/,
  leanCanvasCustomer: /^顧客セグメント[:：]?\s*$/,
  leanCanvasMetrics: /^主要指標[:：]?\s*$/,
  leanCanvasChannels: /^(チャネル|顧客との接点)[:：]?\s*$/,
  leanCanvasCost: /^コスト構造[:：]?\s*$/,
  leanCanvasRevenue: /^収益の流れ[:：]?\s*$/,
};

/**
 * Element type declarations and their initial item creators
 * Used to reduce duplication in parseCompositeItems
 */
const ELEMENT_TYPE_CREATORS = {
  bulletList: () => ({ type: 'bulletList', items: [] }),
  code: () => ({ type: 'code', codeBlock: null }),
  table: () => ({ type: 'table', tableLines: [] }),
  flow: () => ({ type: 'flow', flowItems: [] }),
};

/**
 * Card matcher definitions for declarative card pattern matching
 * Each matcher defines: pattern, variant, name extractor, optional number extractor, and group compatibility check
 */
const CARD_MATCHERS = [
  {
    pattern: PATTERNS.card,
    variant: 'normal',
    getName: (match) => match[2].trim(),
    shouldStartNewGroup: (cards) => cards.length > 0 && cards.every((c) => c.variant === 'step'),
  },
  {
    pattern: PATTERNS.step,
    variant: 'step',
    getName: (match) => match[2].trim(),
    getNumber: (match) => parseInt(match[1], 10),
    shouldStartNewGroup: (cards) => cards.some((c) => c.variant !== 'step'),
  },
  {
    pattern: PATTERNS.good,
    variant: 'good',
    getName: (match) => match[1].trim(),
    shouldStartNewGroup: () => false,
  },
  {
    pattern: PATTERNS.bad,
    variant: 'bad',
    getName: (match) => match[1].trim(),
    shouldStartNewGroup: () => false,
  },
];

module.exports = {
  MAX_COMPOSITE_DEPTH,
  INDENT,
  PATTERNS,
  ELEMENT_TYPE_CREATORS,
  CARD_MATCHERS,
};
