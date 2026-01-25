/**
 * html2pptx - CommonJS re-export
 * Uses dynamic import for ESM module
 */
module.exports = {
  html2pptx: async (...args) => {
    const { html2pptx } = await import('./index.mjs');
    return html2pptx(...args);
  },
};
