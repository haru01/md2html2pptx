/**
 * Javelin Board slide parser
 * Parses experiment timeline data into card format for timeline display
 *
 * Supports two formats:
 * 1. List-based format:
 *    - ジャベリンボード:
 *    - 2024-01:
 *      - 顧客の行動仮説: ...
 *
 * 2. Header-based format:
 *    ## ジャベリンボード: タイトル
 *    ### 2024-01: サブタイトル
 *      - 顧客の行動仮説: ...
 */

const { PATTERNS, INDENT } = require('../constants');

/**
 * Date pattern for experiment key (e.g., "2024-01:")
 */
const DATE_KEY_PATTERN = /^(\d{4}-\d{2})[:：]?\s*$/;

/**
 * Header-based date pattern (e.g., "### 2024-01: サブタイトル")
 */
const HEADER_DATE_PATTERN = /^###\s*(\d{4}-\d{2})[:：]\s*(.*)$/;

/**
 * Field patterns for experiment items (in display order)
 * Supports both "価値or解決法仮説" and "価値/解決法仮説" formats
 */
const FIELD_PATTERNS = [
  { key: 'customerJob', pattern: /^顧客の行動仮説[:：]\s*(.+)$/, label: '顧客の行動仮説' },
  { key: 'problemHypothesis', pattern: /^課題仮説[:：]\s*(.+)$/, label: '課題仮説' },
  { key: 'solutionHypothesis', pattern: /^価値(?:or|[\/／])解決法仮説[:：]\s*(.+)$/, label: '価値or解決法仮説' },
  { key: 'assumption', pattern: /^前提[:：]\s*(.+)$/, label: '前提' },
  { key: 'methodAndCriteria', pattern: /^検証方法と達成基準[:：]\s*(.+)$/, label: '検証方法と達成基準' },
  { key: 'result', pattern: /^結果[:：]\s*(.+)$/, label: '結果' },
  { key: 'decision', pattern: /^学びと判断[:：]\s*(.+)$/, label: '学びと判断' },
];

/**
 * Derive status from decision text
 * @param {string} decision - Decision text (学びと判断)
 * @returns {'continue' | 'develop' | 'pivot' | 'stop'} Status code
 */
function deriveStatus(decision) {
  if (!decision) return 'continue';
  if (/本開発へ|開発へ/.test(decision)) return 'develop';
  if (/ピボット/.test(decision)) return 'pivot';
  if (/中止/.test(decision)) return 'stop';
  return 'continue';
}

/**
 * Create a new empty experiment object
 * @param {string} label - Date label (e.g., "2024-01")
 * @param {string} [subtitle] - Optional subtitle
 * @returns {object}
 */
function createExperiment(label, subtitle = '') {
  return {
    label,
    subtitle,
    customerJob: '',
    problemHypothesis: '',
    solutionHypothesis: '',
    assumption: '',
    methodAndCriteria: '',
    result: '',
    decision: '',
    status: 'continue',
  };
}

/**
 * Parse javelin board slide
 * Converts hierarchical experiment data into table format
 * Supports both list-based and header-based formats
 * @param {string[]} lines - Body lines
 * @returns {{javelinBoardData: import('../types').JavelinBoardData}}
 */
function parseJavelinBoard(lines) {
  const experiments = [];
  let currentExperiment = null;

  for (const line of lines) {
    // Check for header-based date format: ### 2024-01: サブタイトル
    const headerMatch = line.match(HEADER_DATE_PATTERN);
    if (headerMatch) {
      currentExperiment = createExperiment(headerMatch[1], headerMatch[2]?.trim() || '');
      experiments.push(currentExperiment);
      continue;
    }

    const match = line.match(PATTERNS.listItem);
    if (!match) continue;

    const [, spaces, content] = match;
    const indent = spaces.length;

    // Check for list-based date key header (e.g., "- 2024-01:")
    const dateMatch = content.match(DATE_KEY_PATTERN);
    if (dateMatch && indent === INDENT.TOP_LEVEL) {
      currentExperiment = createExperiment(dateMatch[1]);
      experiments.push(currentExperiment);
      continue;
    }

    // Parse field values within experiment
    // For header-based format, any indentation is valid
    // For list-based format, indent >= 4 is required
    if (currentExperiment) {
      for (const { key, pattern } of FIELD_PATTERNS) {
        const fieldMatch = content.match(pattern);
        if (fieldMatch) {
          currentExperiment[key] = fieldMatch[1].trim();
          // Update status when decision field is set
          if (key === 'decision') {
            currentExperiment.status = deriveStatus(currentExperiment.decision);
          }
          break;
        }
      }
    }
  }

  // Return experiments array for card-based rendering
  return {
    javelinBoardData: {
      experiments,
    },
  };
}

module.exports = parseJavelinBoard;
