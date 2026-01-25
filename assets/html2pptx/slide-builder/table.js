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

  // Format rows for pptxgenjs
  // Each row is an array of cells, each cell can be a string or an object with text and options
  const formattedRows = rows.map((row, rowIndex) => {
    return row.map((cell, colIndex) => {
      const isHeader = rowIndex === 0;
      const isLabelColumn = colIndex === 0;

      const cellOptions = {
        text: cell || '',
        options: {
          bold: isHeader || isLabelColumn,
          fill: isHeader ? 'F1F5F9' : isLabelColumn ? 'F8FAFC' : 'FFFFFF',
          color: isHeader ? '0F172A' : '64748B',
          fontSize: isHeader ? 9 : 10,
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
