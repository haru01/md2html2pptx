/**
 * Native PPTX table handler for PowerPoint slides
 * Uses pptxgenjs addTable() for editable tables
 */

/**
 * Add a native PPTX table to the slide
 * @param {object} el - Table element data with tableData
 * @param {import('pptxgenjs').Slide} targetSlide
 */
function addPptxTable(el, targetSlide) {
  const { tableData, position } = el;
  const { rows, options = {} } = tableData;

  if (!rows || rows.length === 0) {
    return;
  }

  // Build table options
  const tableOptions = {
    x: position.x,
    y: position.y,
    w: position.w,
    fontFace: options.fontFace || 'Meiryo',
    fontSize: options.fontSize || 10,
    color: '363636',
    valign: 'middle',
    border: options.border || { pt: 1, color: '363636' },
  };

  // Calculate column widths if provided
  if (options.colW) {
    tableOptions.colW = options.colW;
  }

  // Set row heights if provided
  if (options.rowH) {
    tableOptions.rowH = options.rowH;
  }

  // Get theme colors from options (with fallbacks)
  const headerBg = options.headerBg || '0F172A';
  const headerColor = options.headerColor || 'FFFFFF';
  const labelBg = options.labelBg || 'F1F5F9';
  const labelColor = options.labelColor || '0F172A';
  const cellBg = options.cellBg || 'FFFFFF';
  const cellColor = options.cellColor || '64748B';

  // Get row-specific styling if provided (for customer journey, etc.)
  const rowStyles = options.rowStyles || [];

  // Get font sizes from options (with fallbacks)
  const baseFontSize = options.fontSize || 10;
  const headerLabelFontSize = options.headerLabelFontSize || baseFontSize + 2;
  const phaseFontSize = options.phaseFontSize || baseFontSize + 1;
  const labelFontSize = options.labelFontSize || baseFontSize;

  // Format rows for pptxgenjs
  // Each row is an array of cells, each cell can be a string or an object with text and options
  const formattedRows = rows.map((row, rowIndex) => {
    return row.map((cell, colIndex) => {
      const isHeader = rowIndex === 0;
      const isLabelColumn = colIndex === 0 && !isHeader;
      const dataRowIndex = rowIndex - 1; // Index into rowStyles (0-based, excluding header)
      const rowStyle = !isHeader && rowStyles[dataRowIndex] ? rowStyles[dataRowIndex] : null;

      // Determine fill and color based on row type
      let fill, textColor, fontSize;

      if (isHeader) {
        fill = headerBg;
        textColor = headerColor;
        fontSize = colIndex === 0 ? headerLabelFontSize : phaseFontSize;
      } else if (isLabelColumn) {
        // Label column uses row-specific colors if available
        fill = rowStyle ? rowStyle.bg : labelBg;
        textColor = rowStyle ? rowStyle.color : labelColor;
        fontSize = labelFontSize;
      } else {
        // Data cells use row-specific colors if available
        fill = rowStyle ? rowStyle.bg : cellBg;
        textColor = rowStyle ? rowStyle.color : cellColor;
        fontSize = baseFontSize;
      }

      const cellOptions = {
        text: cell || '',
        options: {
          bold: isHeader || isLabelColumn,
          fill,
          color: textColor,
          fontSize,
          valign: 'middle',
        },
      };

      return cellOptions;
    });
  });

  targetSlide.addTable(formattedRows, tableOptions);
}

module.exports = {
  addPptxTable,
};
