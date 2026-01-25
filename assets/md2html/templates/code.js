/**
 * Code slide generator (including Mermaid diagrams)
 */

const { getColors, getFonts } = require('../theme');
const { escapeHtml } = require('../utils/escape-html');
const { highlightCode, SYNTAX_HIGHLIGHT_CSS } = require('../utils/highlight');
const { isMermaidCode, MERMAID_SCRIPT } = require('../utils/mermaid');
const { MERMAID_STYLES } = require('../utils/style-builders');

/**
 * Generate Mermaid Diagram Slide
 * @param {import('../types').SlideDefinition} slide
 * @returns {{style: string, body: string}}
 */
function generateMermaidSlide(slide) {
  const COLORS = getColors();
  const codeBlock = slide.codeBlock || { language: 'mermaid', code: '' };

  const style = `    .slide {
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
      margin: 0 0 16px 0;
    }${MERMAID_STYLES.base(COLORS.cardShadow)}`;

  const section = slide.section ? `    <p class="section-num">${escapeHtml(slide.section)}</p>\n` : '';
  const title = slide.title || slide.name;

  // Mermaid code should NOT be escaped - Mermaid.js parses it directly
  const body = `${section}    <h1>${escapeHtml(title)}</h1>
    <div class="mermaid-container">
      <pre class="mermaid">${codeBlock.code}</pre>
    </div>
    ${MERMAID_SCRIPT}`;

  return { style, body };
}

/**
 * Generate Code Slide
 * @param {import('../types').SlideDefinition} slide
 * @returns {{style: string, body: string}}
 */
function generateCodeSlide(slide) {
  const COLORS = getColors();
  const FONTS = getFonts();
  const codeBlock = slide.codeBlock || { language: 'plaintext', code: '' };

  // Special handling for Mermaid diagrams
  if (isMermaidCode(codeBlock)) {
    return generateMermaidSlide(slide);
  }

  const lang = codeBlock.language;

  const style = `    .slide {
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
      margin: 0 0 16px 0;
    }
    .code-container {
      background: #1e1e1e;
      border-radius: 12px;
      padding: 20px 24px;
      overflow: hidden;
    }
    .lang-label {
      color: #858585;
      font-size: 12px;
      margin: 0 0 12px 0;
      font-family: ${FONTS.code};
    }
    pre {
      margin: 0;
      padding: 0;
      background: transparent;
    }
    code {
      font-family: ${FONTS.code};
      font-size: 14px;
      line-height: 1.5;
      color: #d4d4d4;
    }${SYNTAX_HIGHLIGHT_CSS}`;

  const section = slide.section ? `    <p class="section-num">${escapeHtml(slide.section)}</p>\n` : '';
  const title = slide.title || slide.name;

  const highlightedCode = highlightCode(codeBlock.code, lang);

  const body = `${section}    <h1>${escapeHtml(title)}</h1>
    <div class="code-container">
      <pre><code class="language-${escapeHtml(lang)}">${highlightedCode}</code></pre>
    </div>`;

  return { style, body };
}

// Export mermaid slide generator for composite use
generateCodeSlide.generateMermaidSlide = generateMermaidSlide;

module.exports = generateCodeSlide;
