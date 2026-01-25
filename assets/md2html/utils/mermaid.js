/**
 * Mermaid diagram utilities
 */

const fs = require('fs');
const path = require('path');

/**
 * Load mermaid browser bundle from node_modules at build time
 * The content is inlined into HTML for browser-side rendering
 */
let mermaidBundleContent = null;
try {
  const mermaidPath = require.resolve('mermaid/dist/mermaid.min.js');
  mermaidBundleContent = fs.readFileSync(mermaidPath, 'utf-8');
} catch {
  try {
    const mermaidPath = path.join(process.cwd(), 'node_modules', 'mermaid', 'dist', 'mermaid.min.js');
    mermaidBundleContent = fs.readFileSync(mermaidPath, 'utf-8');
  } catch {
    mermaidBundleContent = null;
  }
}

/**
 * Mermaid initialization code (runs in browser after mermaid bundle loads)
 */
const MERMAID_INIT = `
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        flowchart: { curve: 'basis' },
        sequence: {
          useMaxWidth: true,
          diagramMarginX: 20,
          diagramMarginY: 20,
          actorMargin: 60,
          boxMargin: 10,
          boxTextMargin: 5,
          noteMargin: 10,
          messageMargin: 35
        },
        themeVariables: {
          fontSize: '14px'
        }
      });
      // Run mermaid and mark SVGs for rasterization
      mermaid.run().then(() => {
        document.querySelectorAll('.mermaid svg').forEach((svg, i) => {
          svg.setAttribute('data-rasterize', 'mermaid-' + i);
        });
      });`;

/**
 * Generate mermaid script tags with inlined bundle from node_modules
 * Falls back to CDN if the local bundle is not available
 * @param {string} name - Script name (currently only 'mermaid' supported)
 * @returns {string} - HTML script tags or empty string if not found
 */
function generateCdnScript(name) {
  if (name !== 'mermaid') return '';
  if (mermaidBundleContent) {
    return `
    <script>${mermaidBundleContent}<\/script>
    <script>${MERMAID_INIT}<\/script>`;
  }
  // Fallback to CDN if local bundle not found
  return `
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"><\/script>
    <script>${MERMAID_INIT}<\/script>`;
}

// Legacy alias for backwards compatibility
const MERMAID_SCRIPT = generateCdnScript('mermaid');

/**
 * Check if a code block is Mermaid diagram
 * @param {Object} codeBlock - Code block with language and code
 * @returns {boolean}
 */
function isMermaidCode(codeBlock) {
  return codeBlock && codeBlock.language && codeBlock.language.toLowerCase() === 'mermaid';
}

/**
 * Get the render type for a code block
 * @param {Object} codeBlock - Code block with language and code
 * @returns {'mermaid' | 'code' | null}
 */
function getCodeBlockRenderType(codeBlock) {
  if (!codeBlock) return null;
  if (isMermaidCode(codeBlock)) return 'mermaid';
  return 'code';
}

/**
 * Determine required CDN scripts for a list of items
 * @param {Array} items - Array of composite items
 * @returns {Set<string>} - Set of required script names ('mermaid')
 */
function getRequiredScripts(items) {
  const scripts = new Set();

  for (const item of items) {
    if (item.type === 'code' && item.codeBlock) {
      const renderType = getCodeBlockRenderType(item.codeBlock);
      if (renderType === 'mermaid') scripts.add('mermaid');
    }
  }

  return scripts;
}

module.exports = {
  MERMAID_INIT,
  MERMAID_SCRIPT,
  generateCdnScript,
  isMermaidCode,
  getCodeBlockRenderType,
  getRequiredScripts,
};
