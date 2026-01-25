/**
 * Flow slide parser
 */

const { PATTERNS, INDENT } = require('../constants');

/**
 * Parse flow slide
 * @param {string[]} lines - Body lines
 * @returns {{flowItems: string[]}}
 */
function parseFlow(lines) {
  const parsedLines = lines
    .map((line) => line.match(PATTERNS.listItem))
    .filter(Boolean)
    .map(([, spaces, content]) => ({ indent: spaces.length, content }));

  const initialState = { flowItems: [], active: false };

  const { flowItems } = parsedLines.reduce((state, { indent, content }) => {
    if (PATTERNS.flow.test(content)) return { ...state, active: true };
    if (state.active && indent >= INDENT.TOP_LEVEL) {
      return { ...state, flowItems: [...state.flowItems, content] };
    }
    return state;
  }, initialState);

  return { flowItems };
}

module.exports = parseFlow;
