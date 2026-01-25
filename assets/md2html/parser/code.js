/**
 * Code slide parser
 */

const { PATTERNS } = require('../constants');

/**
 * Parse code slide
 * @param {string[]} lines - Body lines
 * @returns {{codeBlock?: import('../types').CodeBlockDef}}
 */
function parseCode(lines) {
  const startIdx = lines.findIndex((l) => PATTERNS.codeBlockMarker.test(l.trim()));
  if (startIdx === -1) return {};

  const lang = lines[startIdx].trim().slice(3).trim() || 'plaintext';
  const endIdx = lines.findIndex((l, i) => i > startIdx && PATTERNS.codeBlockMarker.test(l.trim()));
  if (endIdx === -1) return {};

  const codeLines = lines.slice(startIdx + 1, endIdx);
  return { codeBlock: { language: lang, code: codeLines.join('\n') } };
}

module.exports = parseCode;
