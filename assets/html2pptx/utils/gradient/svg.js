/**
 * SVG generation for CSS gradients
 */

const { parseAngle, parseColorStops } = require('./parser');

/**
 * Generate SVG for linear gradient
 * @param {number} angle
 * @param {Array<{color: string, offset: number, opacity?: number}>} stops
 * @param {number} width
 * @param {number} height
 * @returns {string}
 */
function generateLinearGradientSVG(angle, stops, width, height) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="${50 - 50 * Math.cos(rad)}%" y1="${50 - 50 * Math.sin(rad)}%" x2="${50 + 50 * Math.cos(rad)}%" y2="${50 + 50 * Math.sin(rad)}%">
    ${stops
      .map((stop) => {
        const opacityAttr = stop.opacity !== undefined ? ` stop-opacity="${stop.opacity}"` : '';
        return `<stop offset="${stop.offset * 100}%" stop-color="${stop.color}"${opacityAttr} />`;
      })
      .join('\n    ')}
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#grad)" />
</svg>`;
}

/**
 * Generate SVG for radial gradient
 * @param {string} position
 * @param {Array<{color: string, offset: number, opacity?: number}>} stops
 * @param {number} width
 * @param {number} height
 * @returns {string}
 */
function generateRadialGradientSVG(position, stops, width, height) {
  let cx = 50;
  let cy = 50;

  if (position && position !== 'center') {
    const parts = position.split(/\s+/);
    if (parts[0]) {
      if (parts[0].endsWith('%')) cx = parseFloat(parts[0]);
      else if (parts[0] === 'left') cx = 0;
      else if (parts[0] === 'right') cx = 100;
    }
    if (parts[1]) {
      if (parts[1].endsWith('%')) cy = parseFloat(parts[1]);
      else if (parts[1] === 'top') cy = 0;
      else if (parts[1] === 'bottom') cy = 100;
    }
  }

  const stopElements = stops
    .map((stop) => {
      const opacityAttr = stop.opacity !== undefined ? ` stop-opacity="${stop.opacity}"` : '';
      return `<stop offset="${stop.offset * 100}%" stop-color="${stop.color}"${opacityAttr} />`;
    })
    .join('\n    ');

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="grad" cx="${cx}%" cy="${cy}%">
    ${stopElements}
    </radialGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#grad)" />
</svg>`;
}

/**
 * Parse a CSS gradient string and generate an SVG representation
 * Supports linear-gradient and radial-gradient
 * @param {string} gradientStr
 * @param {number} width
 * @param {number} height
 * @returns {string | null}
 */
function gradientToSVG(gradientStr, width, height) {
  const linearMatch = gradientStr.match(/linear-gradient\(\s*([^,]+),\s*(.+)\)/i);
  if (linearMatch) {
    return generateLinearGradientSVG(parseAngle(linearMatch[1]), parseColorStops(linearMatch[2]), width, height);
  }

  const radialMatch = gradientStr.match(/radial-gradient\(\s*(?:circle|ellipse)?\s*(?:at\s+([^,]+))?,\s*(.+)\)/i);
  if (radialMatch) {
    return generateRadialGradientSVG(radialMatch[1] || 'center', parseColorStops(radialMatch[2]), width, height);
  }

  return null;
}

module.exports = {
  generateLinearGradientSVG,
  generateRadialGradientSVG,
  gradientToSVG,
};
