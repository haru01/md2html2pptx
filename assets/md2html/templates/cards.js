/**
 * Cards slide generator
 */

const { getColors, getFonts } = require('../theme');
const { escapeHtml } = require('../utils/escape-html');
const { highlightCode } = require('../utils/highlight');
const { buildConditionalStyles, CARD_STYLE_BLOCKS } = require('../utils/style-builders');

/**
 * Process inline code in text (e.g., `code`)
 * @param {string} text
 * @returns {string}
 */
function processInlineCode(text) {
  if (!text) return '';
  return escapeHtml(text).replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
}

/**
 * Generate Card Layout Slide (supports normal, good, bad, step variants)
 * @param {import('../types').SlideDefinition} slide
 * @returns {{style: string, body: string}}
 */
function generateCardsSlide(slide) {
  const COLORS = getColors();
  const FONTS = getFonts();
  const cards = slide.cards || [];
  const cardCount = cards.length;
  const layout = slide.layout || 'horizontal';
  const isVertical = layout === 'vertical';
  const gap = isVertical ? 12 : 20;
  const totalGap = gap * (cardCount - 1);
  const availableWidth = 960 - 120; // 60px padding each side
  const cardWidth = isVertical ? availableWidth : Math.floor((availableWidth - totalGap) / cardCount) - 1;
  const hasCodeBlock = cards.some((c) => c.codeBlock);
  const hasVariants = cards.some((c) => c.variant === 'good' || c.variant === 'bad');
  const hasSteps = cards.some((c) => c.variant === 'step');

  // Build conditional styles using the style builder
  const conditionalStyles = buildConditionalStyles(
    { codeBlock: hasCodeBlock, variants: hasVariants, steps: hasSteps },
    CARD_STYLE_BLOCKS
  );

  // CSS custom properties for card styles
  const cardCssVars = `
    --color-good: ${COLORS.good};
    --color-bad: ${COLORS.bad};
    --color-good-fg: ${COLORS.goodForeground};
    --color-bad-fg: ${COLORS.badForeground};
    --font-code: ${FONTS.code};`;

  const style = `    :root {${cardCssVars}
    }
    .slide {
      background: ${COLORS.surface};
      padding: 32px 60px;
    }
    .section-num {
      color: ${COLORS.primary};
      font-size: 14px;
      font-weight: 600;
      margin: 0 0 4px 0;
    }
    h1 {
      color: ${COLORS.text};
      font-size: 28px;
      margin: 0 0 24px 0;
    }
    .cards {
      display: flex;
      ${isVertical ? 'flex-direction: column;' : ''}
      gap: ${gap}px;
    }
    .card {
      width: ${cardWidth}px;
      background: ${COLORS.white};
      border-radius: ${isVertical ? '10px' : '12px'};
      padding: ${isVertical ? '16px 20px' : '20px'};
      box-shadow: ${COLORS.cardShadow};
    }
    h2 {
      color: ${COLORS.primary};
      font-size: 18px;
      margin: 0 0 12px 0;
    }
    ul {
      margin: 0;
      padding-left: 20px;
    }
    li {
      color: ${COLORS.muted};
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 4px;
    }
    li:last-child {
      margin-bottom: 0;
    }
    .inline-code {
      background: ${COLORS.headerBg};
      color: ${COLORS.primary};
      padding: 2px 6px;
      border-radius: 4px;
      font-family: ${FONTS.code};
      font-size: 12px;
    }${conditionalStyles}`;

  const section = slide.section ? `    <p class="section-num">${escapeHtml(slide.section)}</p>\n` : '';
  const title = slide.title || slide.name;

  const cardsHtml = cards
    .map((card) => {
      const items = card.items.map((item) => `          <li>${processInlineCode(item)}</li>`).join('\n');
      const codeBlockHtml = card.codeBlock
        ? `
        <div class="card-code">
          <pre><code class="language-${escapeHtml(card.codeBlock.language)}">${highlightCode(card.codeBlock.code, card.codeBlock.language)}</code></pre>
        </div>`
        : '';

      // Handle step variant
      if (card.variant === 'step') {
        const stepNum = card.number !== undefined ? card.number : 0;
        return `      <div class="card card-step">
        <div class="step-num"><p>${stepNum}</p></div>
        <div class="step-content">
          <h2>${escapeHtml(card.name)}</h2>
          <ul>
${items}
          </ul>
        </div>
      </div>`;
      }

      const cardClass =
        card.variant === 'good' ? 'card card-good' : card.variant === 'bad' ? 'card card-bad' : 'card';
      return `      <div class="${cardClass}">
        <h2>${escapeHtml(card.name)}</h2>
        <ul>
${items}
        </ul>${codeBlockHtml}
      </div>`;
    })
    .join('\n');

  const body = `${section}    <h1>${escapeHtml(title)}</h1>
    <div class="cards">
${cardsHtml}
    </div>`;

  return { style, body };
}

// Export processInlineCode for use elsewhere
generateCardsSlide.processInlineCode = processInlineCode;

module.exports = generateCardsSlide;
