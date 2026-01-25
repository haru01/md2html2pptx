/**
 * Theme system for md2html
 * Manages theme configuration and provides color/font values
 */

// Default theme configuration (new unified structure)
const DEFAULT_THEME = {
  fonts: {
    body: "'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif",
    code: "'Consolas', 'Monaco', 'Courier New', monospace",
  },
  primary: '#0891B2',
  titleSlide: {
    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
    titleColor: '#F8FAFC',
    titleSize: 42,
    subtitleColor: '#94A3B8',
    subtitleSize: 18,
    accentColor: '#22D3EE',
  },
  contentSlide: {
    background: '#F8FAFC',
    titleColor: '#0F172A',
    titleSize: 28,
    textColor: '#0F172A',
    mutedColor: '#64748B',
    listSize: 20,
    subListSize: 18,
    subSubListSize: 16,
  },
  codeSlide: {
    titleSize: 28,
    codeSize: 14,
  },
  card: {
    background: '#FFFFFF',
    shadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: '#E2E8F0',
    headerBg: '#F1F5F9',
  },
  good: {
    background: '#d4edda',
    foreground: '#155724',
    border: '#28a745',
  },
  bad: {
    background: '#f8d7da',
    foreground: '#721c24',
    border: '#dc3545',
  },
};

// Active theme configuration (mutable)
let THEME = JSON.parse(JSON.stringify(DEFAULT_THEME));

// Legacy aliases for backwards compatibility (computed from THEME)
let COLORS = {};
let FONTS = {};
let TYPOGRAPHY = {};

/**
 * Update legacy aliases from THEME
 * Called after theme changes to keep legacy exports in sync
 */
function updateLegacyAliases() {
  FONTS = { ...THEME.fonts };
  COLORS = {
    // Title slide
    titleBackground: THEME.titleSlide.background,
    titleText: THEME.titleSlide.titleColor,
    subtitleText: THEME.titleSlide.subtitleColor,
    // Primary colors
    primary: THEME.primary,
    accent: THEME.titleSlide.accentColor,
    // Text colors
    text: THEME.contentSlide.textColor,
    muted: THEME.contentSlide.mutedColor,
    // Background colors
    surface: THEME.contentSlide.background,
    white: THEME.card.background,
    border: THEME.card.border,
    headerBg: THEME.card.headerBg,
    cardShadow: THEME.card.shadow,
    // Good/Bad colors
    good: THEME.good.background,
    goodBackground: THEME.good.background,
    goodForeground: THEME.good.foreground,
    goodBorder: THEME.good.border,
    bad: THEME.bad.background,
    badBackground: THEME.bad.background,
    badForeground: THEME.bad.foreground,
    badBorder: THEME.bad.border,
    // Legacy alias
    darkBg: THEME.titleSlide.background,
  };
  TYPOGRAPHY = {
    titleSlide: {
      titleSize: THEME.titleSlide.titleSize,
      subtitleSize: THEME.titleSlide.subtitleSize,
    },
    contentSlide: {
      titleSize: THEME.contentSlide.titleSize,
      listSize: THEME.contentSlide.listSize,
      subListSize: THEME.contentSlide.subListSize,
      subSubListSize: THEME.contentSlide.subSubListSize,
    },
    codeSlide: {
      titleSize: THEME.codeSlide.titleSize,
      codeSize: THEME.codeSlide.codeSize,
    },
  };
}

// Initialize legacy aliases
updateLegacyAliases();

/**
 * Set theme configuration from external JSON
 * Supports new unified structure (titleSlide, contentSlide, etc.)
 * @param {Object} config - Theme configuration object
 */
function setThemeConfig(config) {
  // Deep merge config into THEME
  THEME = JSON.parse(JSON.stringify(DEFAULT_THEME));

  // Handle new unified structure
  if (config.fonts) {
    THEME.fonts = { ...THEME.fonts, ...config.fonts };
  }
  if (config.primary) {
    THEME.primary = config.primary;
  }
  if (config.titleSlide) {
    THEME.titleSlide = { ...THEME.titleSlide, ...config.titleSlide };
  }
  if (config.contentSlide) {
    THEME.contentSlide = { ...THEME.contentSlide, ...config.contentSlide };
  }
  if (config.codeSlide) {
    THEME.codeSlide = { ...THEME.codeSlide, ...config.codeSlide };
  }
  if (config.card) {
    THEME.card = { ...THEME.card, ...config.card };
  }
  if (config.good) {
    THEME.good = { ...THEME.good, ...config.good };
  }
  if (config.bad) {
    THEME.bad = { ...THEME.bad, ...config.bad };
  }

  // Update legacy aliases for backwards compatibility
  updateLegacyAliases();
}

/**
 * Get current theme object
 * @returns {Object} Current theme configuration
 */
function getTheme() {
  return THEME;
}

/**
 * Get current colors object
 * @returns {Object} Current colors
 */
function getColors() {
  return COLORS;
}

/**
 * Get current fonts object
 * @returns {Object} Current fonts
 */
function getFonts() {
  return FONTS;
}

/**
 * Get current typography object
 * @returns {Object} Current typography
 */
function getTypography() {
  return TYPOGRAPHY;
}

module.exports = {
  DEFAULT_THEME,
  setThemeConfig,
  getTheme,
  getColors,
  getFonts,
  getTypography,
  // Direct exports for backwards compatibility (these are mutable references)
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
