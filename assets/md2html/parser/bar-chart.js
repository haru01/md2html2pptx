/**
 * Bar chart slide parser
 */

const { PATTERNS, INDENT } = require('../constants');
const parseTable = require('./table');

/**
 * Parse bar chart slide
 * @param {string[]} lines - Body lines
 * @returns {{barChart?: import('../types').BarChartDef}}
 */
function parseBarChart(lines) {
  let inBarChart = false;
  let inOptions = false;
  const tableLines = [];
  const options = {
    orientation: 'vertical',
    showValues: false,
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Check for bar chart declaration - use original line to preserve indent
    const listMatch = line.match(PATTERNS.listItem);
    if (listMatch) {
      const indent = listMatch[1].length;
      const content = listMatch[2];

      if (PATTERNS.barChart.test(content)) {
        inBarChart = true;
        inOptions = false;
        continue;
      }

      if (inBarChart && PATTERNS.barChartOptions.test(content)) {
        inOptions = true;
        continue;
      }

      // Parse options - check indent relative to オプション (which is at FIRST_LEVEL=4)
      if (inBarChart && inOptions && indent >= INDENT.FIRST_LEVEL) {
        const orientMatch = content.match(/^向き[:：]\s*(縦|横|vertical|horizontal)$/i);
        if (orientMatch) {
          options.orientation =
            orientMatch[1] === '横' || orientMatch[1].toLowerCase() === 'horizontal'
              ? 'horizontal'
              : 'vertical';
        }

        const xLabelMatch = content.match(/^軸ラベルX[:：]\s*(.+)$/);
        if (xLabelMatch) options.xAxisLabel = xLabelMatch[1].trim();

        const yLabelMatch = content.match(/^軸ラベルY[:：]\s*(.+)$/);
        if (yLabelMatch) options.yAxisLabel = yLabelMatch[1].trim();

        const showValuesMatch = content.match(/^値表示[:：]\s*(true|false|はい|いいえ)$/i);
        if (showValuesMatch) {
          options.showValues =
            showValuesMatch[1].toLowerCase() === 'true' || showValuesMatch[1] === 'はい';
        }
      }
    }

    // Collect table lines (can appear before or after bar chart declaration)
    if (PATTERNS.tableRow.test(trimmed)) {
      tableLines.push(trimmed);
    }
  }

  if (tableLines.length === 0) return {};

  // Parse table data
  const tableData = parseTable.parseTableFromLines(tableLines);
  if (!tableData.headers || tableData.headers.length < 2) return {};

  // Extract labels and values from table
  // First column = labels, second column = values
  const labels = tableData.rows.map((row) => row[0] || '');
  const values = tableData.rows.map((row) => parseFloat(row[1]) || 0);

  return {
    barChart: {
      labels,
      values,
      ...options,
    },
  };
}

module.exports = parseBarChart;
