/**
 * Customer Journey slide parser
 * Parses customer journey map data with phases (columns) and rows (行動, タッチポイント, ペイン, ゲイン)
 *
 * Supports H3/H4 header format:
 *    ## カスタマージャーニー: タイトル
 *    ### 認知
 *    #### 行動:
 *    - SNSで推し活関連の投稿を閲覧
 *    #### タッチポイント:
 *    - Twitter/Instagram広告
 *    #### ペイン:
 *    - 「複数SNS見るの大変だな…」
 *    #### ゲイン:
 *    - 「効率化できそう！」
 */

const { PATTERNS } = require('../constants');

/**
 * Row labels in display order
 */
const ROW_LABELS = ['行動', 'タッチポイント', 'ペイン', 'ゲイン'];

/**
 * Create a new phase object
 * @param {string} name - Phase name (e.g., "認知", "情報収集")
 * @returns {object}
 */
function createPhase(name) {
  return {
    name,
    cells: {
      '行動': [],
      'タッチポイント': [],
      'ペイン': [],
      'ゲイン': [],
    },
  };
}

/**
 * Parse customer journey slide
 * Converts H3/H4 header format into phase and row data
 * @param {string[]} lines - Body lines
 * @returns {{customerJourneyData: import('../types').CustomerJourneyData}}
 */
function parseCustomerJourney(lines) {
  const phases = [];
  let currentPhase = null;
  let currentSection = null;

  for (const line of lines) {
    // Check for H3 phase header: ### フェーズ名
    const phaseMatch = line.match(PATTERNS.customerJourneyPhaseHeader);
    if (phaseMatch) {
      const phaseName = phaseMatch[1].trim();
      // Skip section headers that look like phase headers (e.g., ### 日付:)
      if (!PATTERNS.leanCanvasSectionHeader.test(line)) {
        currentPhase = createPhase(phaseName);
        phases.push(currentPhase);
        currentSection = null;
        continue;
      }
    }

    // Check for H4 section header: #### 行動: / #### タッチポイント: / #### 思考＆感情:
    const sectionMatch = line.match(PATTERNS.customerJourneySectionHeader);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      continue;
    }

    // Check for list item under current section
    const listMatch = line.match(PATTERNS.listItem);
    if (listMatch && currentPhase && currentSection) {
      const content = listMatch[2].trim();
      if (currentPhase.cells[currentSection]) {
        currentPhase.cells[currentSection].push(content);
      }
    }
  }

  // Convert to output format
  const rows = ROW_LABELS.map((label) => ({
    label,
    cells: phases.map((phase) => phase.cells[label] || []),
  }));

  return {
    customerJourneyData: {
      phases: phases.map((p) => p.name),
      rows,
    },
  };
}

module.exports = parseCustomerJourney;
