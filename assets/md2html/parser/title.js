/**
 * Title slide parser
 */

const { PATTERNS } = require('../constants');

/**
 * Parse title slide - extracts subtitle from body lines
 * partNumber and mainTitle come from header via parseSlideHeader
 * @param {string[]} lines - Body lines
 * @param {{partNumber?: number, mainTitle?: string}} base - Base info from header
 * @returns {{subtitle?: string}}
 */
function parseTitle(lines, _base) {
  const result = {};

  for (const line of lines) {
    const match = line.match(PATTERNS.listItem);
    if (!match) continue;
    const content = match[2];

    const subtitleMatch = content.match(PATTERNS.subtitle);
    if (subtitleMatch) {
      result.subtitle = subtitleMatch[1].trim();
      break;
    }
  }

  return result;
}

module.exports = parseTitle;
