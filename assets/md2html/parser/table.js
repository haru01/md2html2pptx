/**
 * Table slide parser
 */

const { PATTERNS } = require('../constants');

/**
 * Parse a table row into cells
 * @param {string} line - Table row like "| cell1 | cell2 |"
 * @returns {string[]}
 */
const parseTableRow = (line) => line.split('|').slice(1, -1).map((cell) => cell.trim());

/**
 * Check if line is a table separator (|---|---|)
 * @param {string} line
 * @returns {boolean}
 */
const isTableSeparator = (line) => PATTERNS.tableSeparator.test(line);

/**
 * Parse markdown table lines into structured data
 * @param {string[]} lines
 * @returns {import('../types').TableDef}
 */
function parseTableFromLines(lines) {
  const dataLines = lines.filter((line) => !isTableSeparator(line));
  const [headerLine, ...rowLines] = dataLines;

  return {
    headers: headerLine ? parseTableRow(headerLine) : [],
    rows: rowLines.map(parseTableRow),
  };
}

/**
 * Parse table slide
 * @param {string[]} lines - Body lines
 * @returns {{table?: import('../types').TableDef}}
 */
function parseTable(lines) {
  const tableLines = lines.filter((l) => PATTERNS.tableRow.test(l.trim())).map((l) => l.trim());
  if (tableLines.length > 0) {
    return { table: parseTableFromLines(tableLines) };
  }
  return {};
}

// Export both for use by composite parser
parseTable.parseTableFromLines = parseTableFromLines;

module.exports = parseTable;
