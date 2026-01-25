/**
 * HTML Templates for md2html
 * Generates html2pptx-compatible HTML slides
 */

const { getColors, getFonts, setThemeConfig, THEME, COLORS, FONTS, TYPOGRAPHY } = require('../theme');
const slideGenerators = require('./slide-generators');

/**
 * Wrap HTML content with base template
 * @param {string} styleContent - CSS content
 * @param {string} bodyContent - HTML body content
 * @param {string|null} [bodyBackground] - Optional explicit background
 * @returns {string} - Complete HTML document
 */
function wrapWithBase(styleContent, bodyContent, bodyBackground = null) {
  const COLORS = getColors();
  const FONTS = getFonts();

  // Extract background from styleContent if not explicitly provided
  let bgStyle = '';
  let modifiedStyleContent = styleContent;

  if (bodyBackground) {
    bgStyle = bodyBackground;
  } else {
    // Look for .slide background in styleContent and move it to body
    const bgMatch = styleContent.match(/\.slide\s*\{[^}]*background:\s*([^;]+);/);
    if (bgMatch) {
      bgStyle = bgMatch[1].trim();
      // Remove background from .slide in styleContent
      modifiedStyleContent = styleContent.replace(/(\.slide\s*\{[^}]*)background:\s*[^;]+;/, '$1');
    }
  }

  const bodyStyle = bgStyle
    ? `body { margin: 0; width: 960px; height: 540px; background: ${bgStyle}; font-family: ${FONTS.body}; }`
    : `body { margin: 0; width: 960px; height: 540px; font-family: ${FONTS.body}; }`;

  // CSS custom properties for theme colors and fonts
  const cssVars = `:root {
      --theme-primary: ${COLORS.primary};
      --theme-accent: ${COLORS.accent};
      --theme-text: ${COLORS.text};
      --theme-muted: ${COLORS.muted};
      --font-body: ${FONTS.body};
      --font-code: ${FONTS.code};
    }`;

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <link rel="icon" href="data:,">
  <link rel="stylesheet" href="theme.css">
  <style>
    ${cssVars}
    ${bodyStyle}
    .slide {
      width: 960px;
      height: 540px;
      padding: 0;
      box-sizing: border-box;
      overflow: hidden;
    }
    * {
      box-sizing: border-box;
    }
${modifiedStyleContent}
  </style>
</head>
<body>
  <div class="slide">
${bodyContent}
  </div>
</body>
</html>`;
}

/**
 * Generate HTML for a slide based on its type
 * @param {import('../types').SlideDefinition} slide
 * @returns {string} - Complete HTML document
 */
function generateSlideHtml(slide) {
  const generator = slideGenerators[slide.type] || slideGenerators.bulletList;
  const { style, body } = generator(slide);
  return wrapWithBase(style, body);
}

module.exports = {
  generateSlideHtml,
  setThemeConfig,
  wrapWithBase,
  // Re-export theme values for backwards compatibility
  get THEME() {
    return THEME;
  },
  get COLORS() {
    return COLORS;
  },
  get FONTS() {
    return FONTS;
  },
  get TYPOGRAPHY() {
    return TYPOGRAPHY;
  },
};
