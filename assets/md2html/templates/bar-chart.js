/**
 * Bar chart slide generator using D3.js
 */

const { getColors } = require('../theme');
const { escapeHtml } = require('../utils/escape-html');
const { getD3Script, generateD3BarChartCode } = require('../utils/d3-chart');

/**
 * Generate Bar Chart Slide
 * @param {import('../types').SlideDefinition} slide
 * @returns {{style: string, body: string}}
 */
function generateBarChartSlide(slide) {
  const COLORS = getColors();
  const barChart = slide.barChart || { labels: [], values: [] };

  const style = `    .slide {
      background: ${COLORS.surface};
      padding: 32px 60px;
    }
    .section-num {
      color: ${COLORS.primary};
      font-size: 14px;
      font-weight: 600;
      margin: 0 0 4px 0;
    }
    h1 {
      color: ${COLORS.text};
      font-size: 28px;
      margin: 0 0 16px 0;
    }
    .chart-container {
      width: 840px;
      height: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .chart-container svg {
      overflow: visible;
    }
    .bar {
      /* fill is set dynamically by D3 for highlight support */
    }
    .axis-label {
      fill: ${COLORS.muted};
    }
    .tick text {
      fill: ${COLORS.text};
    }
    .value-label {
      fill: ${COLORS.text};
    }`;

  const section = slide.section
    ? `    <p class="section-num">${escapeHtml(slide.section)}</p>\n`
    : '';
  const title = slide.title || slide.name;

  const chartConfig = {
    labels: barChart.labels,
    values: barChart.values,
    highlights: barChart.highlights || [],
    orientation: barChart.orientation || 'vertical',
    xAxisLabel: barChart.xAxisLabel || '',
    yAxisLabel: barChart.yAxisLabel || '',
    showValues: barChart.showValues || false,
    primaryColor: COLORS.primary,
    highlightColor: '#F97316', // Orange for high contrast highlights
  };

  const body = `${section}    <h1>${escapeHtml(title)}</h1>
    <div class="chart-container">
      <svg id="bar-chart"></svg>
    </div>
    ${getD3Script()}
    <script>
      ${generateD3BarChartCode(chartConfig)}
    <\/script>`;

  return { style, body };
}

module.exports = generateBarChartSlide;
