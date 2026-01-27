/**
 * Javelin Board slide generator
 * Generates horizontal card timeline layout for experiment tracking
 */

const { getColors } = require('../theme');
const { escapeHtml } = require('../utils/escape-html');

/**
 * Status colors for card top border
 */
const STATUS_COLORS = {
  continue: '#28a745', // Green - continue experimenting
  develop: '#6f42c1', // Purple - move to development
  pivot: '#fd7e14', // Orange - pivot direction
  stop: '#dc3545', // Red - stop/cancel
};

/**
 * Field labels for display (in order)
 */
const FIELD_LABELS = [
  { key: 'customerJob', label: '顧客の行動仮説' },
  { key: 'problemHypothesis', label: '課題仮説' },
  { key: 'solutionHypothesis', label: '価値or解決法仮説' },
  { key: 'assumption', label: '前提' },
  { key: 'methodAndCriteria', label: '検証方法と達成基準' },
  { key: 'result', label: '結果' },
  { key: 'decision', label: '学びと判断' },
];

/**
 * Calculate card dimensions based on experiment count
 * @param {number} count - Number of experiments (1-4)
 * @returns {{width: number, gap: number}}
 */
function getCardDimensions(count) {
  const dimensions = {
    1: { width: 880, gap: 0 },
    2: { width: 432, gap: 16 },
    3: { width: 285, gap: 12 },
    4: { width: 212, gap: 10 },
  };
  return dimensions[Math.min(Math.max(count, 1), 4)];
}

/**
 * Generate Javelin Board Slide
 * Outputs horizontal card timeline layout
 * @param {import('../types').SlideDefinition} slide
 * @returns {{style: string, body: string}}
 */
function generateJavelinBoardSlide(slide) {
  const COLORS = getColors();
  const data = slide.javelinBoardData || { experiments: [] };
  const experiments = data.experiments || [];
  const count = experiments.length;
  const { width, gap } = getCardDimensions(count);

  // Adjust font sizes based on card count (max 4 cards per slide)
  // Note: PPTX conversion uses PT_PER_PX = 0.75, so 10.67px ≈ 8pt
  const labelSize = count <= 2 ? 8 : 7;
  const valueSize = 10.67; // 8pt in PPTX (10.67 * 0.75 = 8)
  const titleSize = count <= 2 ? 14 : 12;
  const subtitleSize = count <= 2 ? 12 : 11;
  const fieldMargin = count <= 2 ? 10 : 8;

  const style = `    .slide {
      background: ${COLORS.surface};
      padding: 24px 40px 16px;
    }
    h1 {
      color: ${COLORS.text};
      font-size: 18px;
      font-weight: 700;
      margin: 0 0 12px 0;
    }
    .timeline {
      display: flex;
      gap: ${gap}px;
    }
    .experiment-card {
      width: ${width}px;
      background: ${COLORS.white};
      border-radius: 8px;
      box-shadow: ${COLORS.cardShadow};
      overflow: hidden;
    }
    .card-header {
      padding: 12px 14px 10px;
      border-top: 5px solid ${COLORS.primary};
    }
    .card-header.status-continue {
      border-top-color: ${STATUS_COLORS.continue};
    }
    .card-header.status-develop {
      border-top-color: ${STATUS_COLORS.develop};
    }
    .card-header.status-pivot {
      border-top-color: ${STATUS_COLORS.pivot};
    }
    .card-header.status-stop {
      border-top-color: ${STATUS_COLORS.stop};
    }
    .card-label {
      color: ${COLORS.primary};
      font-size: ${titleSize}px;
      font-weight: 700;
      margin: 0;
    }
    .card-subtitle {
      color: ${COLORS.muted};
      font-size: ${subtitleSize}px;
      margin: 4px 0 0 0;
    }
    .card-body {
      padding: 4px 14px 14px;
    }
    .field {
      margin-bottom: ${fieldMargin}px;
    }
    .field:last-child {
      margin-bottom: 0;
    }
    .field-label {
      color: ${COLORS.muted};
      font-size: ${labelSize}px;
      font-weight: 600;
      margin: 0 0 2px 0;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .field-value {
      color: ${COLORS.text};
      font-size: ${valueSize}px;
      line-height: 1.4;
      margin: 0;
    }
    .field-decision .field-value {
      font-weight: 600;
    }
    .experiment-card.status-continue .card-subtitle,
    .experiment-card.status-continue .field-decision .field-value {
      color: ${STATUS_COLORS.continue};
    }
    .experiment-card.status-develop .card-subtitle,
    .experiment-card.status-develop .field-decision .field-value {
      color: ${STATUS_COLORS.develop};
    }
    .experiment-card.status-pivot .card-subtitle,
    .experiment-card.status-pivot .field-decision .field-value {
      color: ${STATUS_COLORS.pivot};
    }
    .experiment-card.status-stop .card-subtitle,
    .experiment-card.status-stop .field-decision .field-value {
      color: ${STATUS_COLORS.stop};
    }`;

  const title = slide.title || slide.name;

  const cardsHtml = experiments
    .map((exp) => {
      const statusClass = `status-${exp.status || 'continue'}`;

      const fieldsHtml = FIELD_LABELS.map(({ key, label }) => {
        const value = exp[key] || '';
        if (!value) return '';
        const fieldClass = key === 'decision' ? 'field field-decision' : 'field';
        return `        <div class="${fieldClass}">
          <p class="field-label">${escapeHtml(label)}</p>
          <p class="field-value">${escapeHtml(value)}</p>
        </div>`;
      })
        .filter(Boolean)
        .join('\n');

      const subtitleHtml = exp.subtitle ? `\n        <p class="card-subtitle">${escapeHtml(exp.subtitle)}</p>` : '';

      return `      <div class="experiment-card ${statusClass}">
        <div class="card-header ${statusClass}">
          <p class="card-label">${escapeHtml(exp.label)}</p>${subtitleHtml}
        </div>
        <div class="card-body">
${fieldsHtml}
        </div>
      </div>`;
    })
    .join('\n');

  const body = `    <h1>${escapeHtml(title)}</h1>
    <div class="timeline">
${cardsHtml}
    </div>`;

  return { style, body };
}

module.exports = generateJavelinBoardSlide;
