/**
 * D3.js chart utilities
 * Similar pattern to mermaid.js - loads D3 from node_modules or CDN
 */

const fs = require('fs');
const path = require('path');

/**
 * Load D3 browser bundle from node_modules at build time
 */
let d3BundleContent = null;
try {
  const d3Path = require.resolve('d3/dist/d3.min.js');
  d3BundleContent = fs.readFileSync(d3Path, 'utf-8');
} catch {
  try {
    const d3Path = path.join(process.cwd(), 'node_modules', 'd3', 'dist', 'd3.min.js');
    d3BundleContent = fs.readFileSync(d3Path, 'utf-8');
  } catch {
    d3BundleContent = null;
  }
}

/**
 * Generate D3 script tag
 * Falls back to CDN if local bundle not available
 * @returns {string}
 */
function getD3Script() {
  if (d3BundleContent) {
    return `<script>${d3BundleContent}<\/script>`;
  }
  return `<script src="https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js"><\/script>`;
}

/**
 * Generate D3 bar chart initialization code
 * @param {Object} config - Chart configuration
 * @param {string[]} config.labels - Category labels
 * @param {number[]} config.values - Data values
 * @param {boolean[]} [config.highlights] - Highlight flags for each bar
 * @param {'vertical'|'horizontal'} config.orientation - Chart orientation
 * @param {string} [config.xAxisLabel] - X-axis label
 * @param {string} [config.yAxisLabel] - Y-axis label
 * @param {boolean} [config.showValues] - Show values on bars
 * @param {string} config.primaryColor - Primary theme color
 * @param {string} config.highlightColor - Highlight color for emphasized bars
 * @returns {string} - JavaScript code for D3 bar chart
 */
function generateD3BarChartCode(config) {
  const {
    labels,
    values,
    highlights = [],
    orientation,
    xAxisLabel,
    yAxisLabel,
    showValues,
    primaryColor,
    highlightColor,
  } = config;

  const dataJson = JSON.stringify(
    labels.map((label, i) => ({
      label,
      value: values[i],
      highlight: highlights[i] || false,
    }))
  );

  const isVertical = orientation === 'vertical';

  const verticalChart = `
      // Vertical bar chart
      const x = d3.scaleBand()
        .domain(data.map(d => d.label))
        .range([0, width])
        .padding(0.2);

      const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value) * 1.1])
        .range([height, 0]);

      svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("font-size", "12px");

      svg.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("font-size", "12px");

      svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.label))
        .attr("y", d => y(d.value))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.value))
        .style("fill", d => d.highlight ? "${highlightColor}" : "${primaryColor}");
      ${
        showValues
          ? `
      svg.selectAll(".value-label")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "value-label")
        .attr("x", d => x(d.label) + x.bandwidth() / 2)
        .attr("y", d => y(d.value) - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .text(d => d.value);`
          : ''
      }`;

  const horizontalChart = `
      // Horizontal bar chart
      const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value) * 1.1])
        .range([0, width]);

      const y = d3.scaleBand()
        .domain(data.map(d => d.label))
        .range([0, height])
        .padding(0.2);

      svg.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("font-size", "12px");

      svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("font-size", "12px");

      svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("y", d => y(d.label))
        .attr("width", d => x(d.value))
        .attr("height", y.bandwidth())
        .style("fill", d => d.highlight ? "${highlightColor}" : "${primaryColor}");
      ${
        showValues
          ? `
      svg.selectAll(".value-label")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "value-label")
        .attr("x", d => x(d.value) + 5)
        .attr("y", d => y(d.label) + y.bandwidth() / 2)
        .attr("dominant-baseline", "middle")
        .attr("text-anchor", "start")
        .style("font-size", "11px")
        .text(d => d.value);`
          : ''
      }`;

  const xAxisLabelCode = xAxisLabel
    ? `
      svg.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("${xAxisLabel}");`
    : '';

  const yAxisLabelCode = yAxisLabel
    ? `
      svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("${yAxisLabel}");`
    : '';

  return `
    (function() {
      const data = ${dataJson};
      const margin = { top: 20, right: 30, bottom: ${xAxisLabel ? 50 : 40}, left: ${yAxisLabel ? 60 : 50} };
      const width = 840 - margin.left - margin.right;
      const height = 380 - margin.top - margin.bottom;

      const svg = d3.select("#bar-chart")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      ${isVertical ? verticalChart : horizontalChart}
      ${xAxisLabelCode}
      ${yAxisLabelCode}
    })();
  `;
}

module.exports = {
  getD3Script,
  generateD3BarChartCode,
};
