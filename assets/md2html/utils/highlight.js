/**
 * Code syntax highlighting utility
 */

const path = require('path');
const { escapeHtml } = require('./escape-html');

let hljs;
try {
  hljs = require('highlight.js');
} catch {
  try {
    hljs = require(path.join(process.cwd(), 'node_modules', 'highlight.js'));
  } catch {
    hljs = null;
  }
}

/**
 * Syntax highlighting CSS (VS Code Dark+ theme colors)
 */
const SYNTAX_HIGHLIGHT_CSS = `
    .hljs-keyword { color: #569cd6; }
    .hljs-built_in { color: #4ec9b0; }
    .hljs-type { color: #4ec9b0; }
    .hljs-literal { color: #569cd6; }
    .hljs-number { color: #b5cea8; }
    .hljs-string { color: #ce9178; }
    .hljs-comment { color: #6a9955; }
    .hljs-function { color: #dcdcaa; }
    .hljs-class { color: #4ec9b0; }
    .hljs-variable { color: #9cdcfe; }
    .hljs-attr { color: #9cdcfe; }
    .hljs-property { color: #9cdcfe; }
    .hljs-punctuation { color: #d4d4d4; }
    .hljs-operator { color: #d4d4d4; }
    .hljs-tag { color: #569cd6; }
    .hljs-name { color: #569cd6; }
    .hljs-attribute { color: #9cdcfe; }
    .hljs-title { color: #dcdcaa; }
    .hljs-params { color: #9cdcfe; }
    .hljs-meta { color: #569cd6; }
    .hljs-selector-tag { color: #d7ba7d; }
    .hljs-selector-class { color: #d7ba7d; }
    .hljs-selector-id { color: #d7ba7d; }
    .hljs-section { color: #569cd6; font-weight: bold; }
    .hljs-bullet { color: #6796e6; }
    .hljs-emphasis { color: #d4d4d4; font-style: italic; }
    .hljs-strong { color: #d4d4d4; font-weight: bold; }
    .hljs-quote { color: #6a9955; }
    .hljs-code { color: #ce9178; }`;

/**
 * Highlight code at build time using highlight.js
 * Returns HTML with <span class="hljs-*"> wrappers (already escaped)
 * Falls back to escapeHtml if highlight.js is not available
 * @param {string} code - Raw code string
 * @param {string} language - Language identifier
 * @returns {string} - Highlighted HTML
 */
function highlightCode(code, language) {
  if (!hljs) return escapeHtml(code);
  try {
    if (language && hljs.getLanguage(language)) {
      return hljs.highlight(code, { language }).value;
    }
    return hljs.highlightAuto(code).value;
  } catch (e) {
    return escapeHtml(code);
  }
}

module.exports = { highlightCode, SYNTAX_HIGHLIGHT_CSS };
