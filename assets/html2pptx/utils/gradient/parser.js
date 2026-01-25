/**
 * CSS gradient parsing utilities
 */

/**
 * Parse angle from gradient string (e.g., "135deg", "to bottom right")
 * @param {string} angleStr
 * @returns {number}
 */
function parseAngle(angleStr) {
  angleStr = angleStr.trim();
  if (angleStr.startsWith('to ')) {
    const direction = angleStr.slice(3).trim();
    return (
      {
        top: 0,
        right: 90,
        bottom: 180,
        left: 270,
        'top right': 45,
        'right top': 45,
        'bottom right': 135,
        'right bottom': 135,
        'bottom left': 225,
        'left bottom': 225,
        'top left': 315,
        'left top': 315,
      }[direction] || 180
    );
  }

  const degMatch = angleStr.match(/([\d.]+)deg/);
  if (degMatch) return parseFloat(degMatch[1]);

  return 180;
}

/**
 * Normalize color to hex format for SVG
 * Returns both the hex color and optional opacity
 * @param {string} color
 * @returns {{color: string, opacity?: number}}
 */
function normalizeColor(color) {
  color = color.trim();
  if (color.startsWith('#')) return { color };

  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
    const alpha = rgbMatch[4] ? parseFloat(rgbMatch[4]) : undefined;
    return {
      color: `#${r}${g}${b}`,
      opacity: alpha,
    };
  }

  return { color };
}

/**
 * Parse color stops from gradient string
 * e.g., "#667eea 0%, #764ba2 100%"
 * @param {string} stopsStr
 * @returns {Array<{color: string, offset: number, opacity?: number}>}
 */
function parseColorStops(stopsStr) {
  const stops = [];
  const parts = [];
  let current = '';
  let parenDepth = 0;

  for (let i = 0; i < stopsStr.length; i++) {
    const char = stopsStr[i];
    if (char === '(') parenDepth++;
    if (char === ')') parenDepth--;
    if (char === ',' && parenDepth === 0) {
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) parts.push(current.trim());

  parts.forEach((part, idx) => {
    const match = part.match(/^(.+?)\s*([\d.]+%)?$/);
    if (match) {
      const color = match[1].trim();
      const offset = match[2] ? parseFloat(match[2]) / 100 : idx / Math.max(1, parts.length - 1);
      const normalized = normalizeColor(color);
      stops.push({
        color: normalized.color,
        offset,
        opacity: normalized.opacity,
      });
    }
  });

  return stops;
}

module.exports = {
  parseAngle,
  parseColorStops,
  normalizeColor,
};
