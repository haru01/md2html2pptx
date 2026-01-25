/**
 * md2html - Markdown to HTML slide converter
 * Public API module
 */

const { parseMarkdown } = require('./parser');
const { generateSlideHtml, setThemeConfig, THEME, COLORS, FONTS, TYPOGRAPHY } = require('./templates');

module.exports = {
  // Parser
  parseMarkdown,

  // Templates
  generateSlideHtml,
  setThemeConfig,

  // Theme values (for backwards compatibility)
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
