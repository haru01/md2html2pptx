/**
 * Javelin Board slide parser
 * Parses experiment timeline data into card format for timeline display
 *
 * Supports H4 header format only:
 *    ## ジャベリンボード: タイトル
 *    ### 2024-01: サブタイトル
 *    #### 顧客の行動仮説:
 *    - 値1
 *    - 値2 (multiple values joined with newline)
 */

/**
 * H4 field header pattern
 */
const H4_FIELD_PATTERN = /^####\s*(顧客の行動仮説|課題仮説|価値(?:or|[\/／])解決法仮説|前提|検証方法と達成基準|結果|学びと判断)[:：]?\s*$/;

/**
 * Header-based date pattern (e.g., "### 2024-01: サブタイトル")
 */
const HEADER_DATE_PATTERN = /^###\s*(\d{4}-\d{2})[:：]\s*(.*)$/;

/**
 * List item pattern
 */
const LIST_ITEM_PATTERN = /^\s*-\s+(.+)$/;

/**
 * Field name to key mapping
 */
const FIELD_NAME_TO_KEY = {
  '顧客の行動仮説': 'customerJob',
  '課題仮説': 'problemHypothesis',
  '価値or解決法仮説': 'solutionHypothesis',
  '価値/解決法仮説': 'solutionHypothesis',
  '価値／解決法仮説': 'solutionHypothesis',
  '前提': 'assumption',
  '検証方法と達成基準': 'methodAndCriteria',
  '結果': 'result',
  '学びと判断': 'decision',
};

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
 * Converts H4 header format into experiment data
 * @param {string[]} lines - Body lines
 * @returns {{javelinBoardData: import('../types').JavelinBoardData}}
 */
function parseJavelinBoard(lines) {
  const experiments = [];
  let currentExperiment = null;
  let currentField = null;
  let currentValues = [];

  /**
   * Flush accumulated values to current field
   */
  function flushField() {
    if (currentExperiment && currentField && currentValues.length > 0) {
      currentExperiment[currentField] = currentValues.join('\n');
      if (currentField === 'decision') {
        currentExperiment.status = deriveStatus(currentExperiment.decision);
      }
    }
    currentField = null;
    currentValues = [];
  }

  for (const line of lines) {
    // Check for H3 experiment header: ### 2024-01: サブタイトル
    const headerMatch = line.match(HEADER_DATE_PATTERN);
    if (headerMatch) {
      flushField();
      currentExperiment = createExperiment(headerMatch[1], headerMatch[2]?.trim() || '');
      experiments.push(currentExperiment);
      continue;
    }

    // Check for H4 field header: #### フィールド名:
    const h4Match = line.match(H4_FIELD_PATTERN);
    if (h4Match) {
      flushField();
      const fieldName = h4Match[1];
      currentField = FIELD_NAME_TO_KEY[fieldName] || null;
      continue;
    }

    // Check for list item under current field
    const listMatch = line.match(LIST_ITEM_PATTERN);
    if (listMatch && currentField) {
      currentValues.push(listMatch[1].trim());
    }
  }

  // Flush final field
  flushField();

  return {
    javelinBoardData: {
      experiments,
    },
  };
}

module.exports = parseJavelinBoard;
