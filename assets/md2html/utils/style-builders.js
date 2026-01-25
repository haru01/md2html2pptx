/**
 * CSS style building utilities
 */

const { SYNTAX_HIGHLIGHT_CSS } = require('./highlight');

/**
 * Build CSS string from conditional style blocks
 * @param {Object.<string, boolean>} conditions - Style name to condition map
 * @param {Object.<string, string>} styleBlocks - Style name to CSS string map
 * @returns {string} - Combined CSS string
 */
const buildConditionalStyles = (conditions, styleBlocks) =>
  Object.entries(conditions)
    .filter(([_, shouldInclude]) => shouldInclude)
    .map(([key]) => styleBlocks[key] || '')
    .join('');

/**
 * Card slide style blocks for conditional inclusion
 */
const CARD_STYLE_BLOCKS = {
  codeBlock: `
    .card-code {
      background: #1e1e1e;
      border-radius: 8px;
      padding: 12px 16px;
      margin-top: 12px;
      overflow: hidden;
    }
    .card-code .lang-label {
      color: #858585;
      font-size: 10px;
      margin: 0 0 8px 0;
      font-family: var(--font-code);
    }
    .card-code pre {
      margin: 0;
      padding: 0;
      background: transparent;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .card-code code {
      font-family: var(--font-code);
      font-size: 11px;
      line-height: 1.4;
      color: #d4d4d4;
    }${SYNTAX_HIGHLIGHT_CSS}`,

  variants: `
    .card-good {
      background: var(--color-good);
    }
    .card-bad {
      background: var(--color-bad);
    }
    .card-good h2, .card-good li {
      color: var(--color-good-fg);
    }
    .card-bad h2, .card-bad li {
      color: var(--color-bad-fg);
    }`,

  steps: `
    .card-step {
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }
    .step-num {
      width: 32px;
      height: 32px;
      flex-shrink: 0;
      background: linear-gradient(135deg, var(--theme-primary) 0%, #0E7490 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .step-num p {
      color: white;
      font-size: 14px;
      font-weight: 700;
      margin: 0;
    }
    .step-content {
      flex: 1;
    }
    .card-step h2 {
      color: var(--theme-text);
      font-size: 14px;
      font-weight: 600;
      margin: 0 0 4px 0;
    }
    .card-step ul {
      margin: 0;
      padding-left: 0;
      list-style: none;
    }
    .card-step li {
      color: var(--theme-muted);
      font-size: 13px;
    }`,
};

/**
 * Mermaid diagram style blocks
 * Centralized CSS for Mermaid containers across different slide types
 */
const MERMAID_STYLES = {
  /**
   * Base Mermaid container styles (used in standalone Mermaid slides)
   * @param {string} cardShadow - Box shadow value
   * @returns {string} CSS string
   */
  base: (cardShadow) => `
    .mermaid-container {
      background: white;
      border-radius: 12px;
      padding: 24px;
      display: flex;
      justify-content: center;
      align-items: center;
      box-shadow: ${cardShadow};
      min-height: 300px;
    }
    .mermaid {
      margin: 0;
      font-family: inherit;
      width: 100%;
      height: 100%;
    }
    .mermaid svg {
      width: 100%;
      height: 100%;
      max-width: 100%;
      max-height: 100%;
    }`,

  /**
   * Grid cell Mermaid styles (used in composite grid layouts)
   * @param {Object} s - Style values from calculateGridStyles
   * @returns {string} CSS string
   */
  grid: (s) => `
    .grid-cell-mermaid {
      background: white;
      border-radius: ${s.borderRadius}px;
      box-shadow: var(--card-shadow);
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .grid-cell-mermaid .mermaid-container {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: ${Math.max(8, s.padding)}px;
    }
    .grid-cell-mermaid .mermaid {
      margin: 0;
      font-family: inherit;
      width: 100%;
      height: 100%;
    }
    .grid-cell-mermaid .mermaid svg {
      width: 100%;
      height: 100%;
      max-width: 100%;
      max-height: 100%;
    }`,
};

module.exports = {
  buildConditionalStyles,
  CARD_STYLE_BLOCKS,
  MERMAID_STYLES,
};
