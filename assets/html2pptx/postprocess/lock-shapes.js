/**
 * PPTX post-processor to lock shapes on specific slides
 * Prevents accidental movement/resize of shapes in PowerPoint
 */

const JSZip = require('jszip');
const fs = require('fs');

/**
 * Add lock attributes to shapes in a slide XML
 * @param {string} slideXml - The slide XML content
 * @param {Object} options - Lock options
 * @param {boolean} [options.noMove=true] - Prevent moving
 * @param {boolean} [options.noResize=true] - Prevent resizing
 * @param {number} [options.skipFirstN=2] - Skip first N shapes (e.g., title, date)
 * @returns {string} Modified slide XML
 */
function addLockAttributesToSlide(slideXml, options = {}) {
  const { noMove = true, noResize = true, skipFirstN = 2 } = options;

  // Build lock attributes string
  const lockAttrs = [];
  if (noMove) lockAttrs.push('noMove="1"');
  if (noResize) lockAttrs.push('noResize="1"');

  if (lockAttrs.length === 0) return slideXml;

  const lockElement = `<a:spLocks ${lockAttrs.join(' ')}/>`;

  // Track shape count to skip title/date elements
  let shapeCount = 0;

  // Replace empty <p:cNvSpPr/> with one containing spLocks
  // Also handle <p:cNvSpPr></p:cNvSpPr> case
  return slideXml.replace(/<p:cNvSpPr\s*\/?>(<\/p:cNvSpPr>)?/g, (match) => {
    shapeCount++;
    if (shapeCount <= skipFirstN) {
      return match; // Keep original for title/date
    }
    // Replace with locked version
    return `<p:cNvSpPr>${lockElement}</p:cNvSpPr>`;
  });
}

/**
 * Lock shapes in specific slides of a PPTX file
 * @param {string} pptxPath - Path to the PPTX file
 * @param {number[]} slideIndices - 1-based slide indices to lock (e.g., [25])
 * @param {Object} [options] - Lock options passed to addLockAttributesToSlide
 * @returns {Promise<void>}
 */
async function lockShapesInPptx(pptxPath, slideIndices, options = {}) {
  if (!slideIndices || slideIndices.length === 0) {
    return; // Nothing to lock
  }

  // Read PPTX file
  const pptxBuffer = fs.readFileSync(pptxPath);
  const zip = await JSZip.loadAsync(pptxBuffer);

  // Process each specified slide
  for (const slideIndex of slideIndices) {
    const slideFileName = `ppt/slides/slide${slideIndex}.xml`;
    const slideFile = zip.file(slideFileName);

    if (!slideFile) {
      console.warn(`Warning: Slide ${slideIndex} not found in PPTX`);
      continue;
    }

    const slideXml = await slideFile.async('string');
    const modifiedXml = addLockAttributesToSlide(slideXml, options);
    zip.file(slideFileName, modifiedXml);
  }

  // Write modified PPTX back
  const modifiedBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  fs.writeFileSync(pptxPath, modifiedBuffer);
}

/**
 * Detect lean canvas slides from HTML file list
 * @param {string[]} htmlFiles - Array of HTML file paths
 * @returns {number[]} 1-based indices of lean canvas slides
 */
function detectLeanCanvasSlides(htmlFiles) {
  const leanCanvasIndices = [];

  htmlFiles.forEach((filePath, index) => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (content.includes('lean-canvas')) {
        leanCanvasIndices.push(index + 1); // 1-based index
      }
    } catch {
      // Skip files that can't be read
    }
  });

  return leanCanvasIndices;
}

module.exports = {
  addLockAttributesToSlide,
  lockShapesInPptx,
  detectLeanCanvasSlides,
};
