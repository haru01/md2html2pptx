/**
 * Debug mode utilities for html2pptx
 */

/**
 * Get the debug mode from environment variable
 * @returns {'always' | 'error' | undefined}
 */
function getDebugMode() {
  if (process.platform !== 'darwin') return;
  const debug = process.env.HTML2PPTX_DEBUG;
  if (debug === 'always') return 'always';
  return debug ? 'error' : undefined;
}

/**
 * Check if debug mode is enabled
 * @returns {boolean}
 */
function isDebugMode() {
  return !!getDebugMode();
}

/**
 * Check if we should pause for debugging
 * @param {string[]} errors - Array of validation errors
 * @returns {boolean}
 */
function shouldPause(errors) {
  const debug = getDebugMode();
  if (debug === 'always') return true;
  return debug === 'error' ? !!errors.length : false;
}

/**
 * Pause the page for debugging if conditions are met
 * @param {import('playwright').Page} page
 * @param {string[]} errors
 */
async function maybePauseToDebug(page, errors) {
  if (shouldPause(errors)) await page.pause();
}

module.exports = {
  getDebugMode,
  isDebugMode,
  shouldPause,
  maybePauseToDebug,
};
