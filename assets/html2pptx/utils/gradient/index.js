/**
 * Gradient utilities - Entry point
 * Converts CSS gradients to PNG images via SVG
 */

const crypto = require('crypto');
const path = require('path');
const sharp = require('sharp');

const { parseAngle, parseColorStops, normalizeColor } = require('./parser');
const { gradientToSVG, generateLinearGradientSVG, generateRadialGradientSVG } = require('./svg');

/**
 * Generate a gradient image file using Sharp
 * Returns the path to the generated image
 * @param {string} gradientStr
 * @param {number} width
 * @param {number} height
 * @param {string} tmpDir
 * @returns {Promise<string>}
 */
async function generateGradientImage(gradientStr, width, height, tmpDir) {
  const svg = gradientToSVG(gradientStr, width, height);
  if (!svg) throw new Error(`Failed to parse gradient: ${gradientStr}`);

  const hash = crypto.createHash('md5').update(`${gradientStr}-${width}-${height}`).digest('hex').substring(0, 8);
  const outputPath = path.join(tmpDir, `gradient-${hash}.png`);

  await sharp(Buffer.from(svg)).png().toFile(outputPath);

  return outputPath;
}

module.exports = {
  // Main export
  generateGradientImage,
  gradientToSVG,
  // Parser exports (for testing)
  parseAngle,
  parseColorStops,
  normalizeColor,
  // SVG exports (for testing)
  generateLinearGradientSVG,
  generateRadialGradientSVG,
};
