/**
 * Composite slide generator
 * Handles complex grid layouts with nested content
 */

const { getColors, getFonts } = require('../theme');
const { escapeHtml } = require('../utils/escape-html');
const { highlightCode, SYNTAX_HIGHLIGHT_CSS } = require('../utils/highlight');
const { isMermaidCode, generateCdnScript, getRequiredScripts } = require('../utils/mermaid');
const { MERMAID_STYLES } = require('../utils/style-builders');

/**
 * Generate HTML for composite table (native table with data-pptx-table)
 */
function generateCompositeTableHtml(table) {
  const COLORS = getColors();
  if (!table || !table.headers || table.headers.length === 0) return '';

  const pptxRows = [table.headers, ...table.rows];

  // JSON data for PPTX native table with theme colors
  const pptxTableJson = JSON.stringify({
    rows: pptxRows,
    options: {
      fontFace: 'Meiryo',
      fontSize: 11,
      border: { pt: 1, color: COLORS.border.replace('#', '') },
      headerBg: '0F172A',
      headerColor: 'FFFFFF',
      labelBg: COLORS.headerBg.replace('#', ''),
      labelColor: COLORS.text.replace('#', ''),
      cellBg: 'FFFFFF',
      cellColor: COLORS.muted.replace('#', ''),
    },
  });

  const headerCells = table.headers.map((h) => `            <th><p>${escapeHtml(h)}</p></th>`).join('\n');

  const dataRows = table.rows
    .map((row) => {
      const cells = row.map((cell) => `            <td><p>${escapeHtml(cell)}</p></td>`).join('\n');
      return `          <tr>\n${cells}\n          </tr>`;
    })
    .join('\n');

  return `        <table class="composite-table" data-pptx-table='${pptxTableJson}'>
          <thead>
          <tr>
${headerCells}
          </tr>
          </thead>
          <tbody>
${dataRows}
          </tbody>
        </table>`;
}

/**
 * Generate HTML for composite flow
 */
function generateCompositeFlowHtml(flowItems) {
  if (!flowItems || flowItems.length === 0) return '';

  const flowHtml = flowItems
    .map((item, index) => {
      const arrow =
        index < flowItems.length - 1 ? '\n            <div class="composite-flow-arrow"><p>→</p></div>' : '';
      return `            <div class="composite-flow-item">
              <p>${escapeHtml(item)}</p>
            </div>${arrow}`;
    })
    .join('\n');

  return `        <div class="composite-flow">\n${flowHtml}\n        </div>`;
}

/**
 * Generate HTML for composite content with depth-based styling
 */
function generateCompositeContentHtmlWithDepth(items, depth) {
  if (!items || items.length === 0) return '';

  const fontSize = Math.round(14 * Math.pow(0.9, depth));

  const generateNestedList = (items, listDepth = 0) => {
    const listClass = listDepth === 0 ? 'content-list' : 'sub-list';
    const itemsHtml = items
      .map((item) => {
        if (typeof item === 'object' && item.subItems && item.subItems.length > 0) {
          const subListHtml = generateNestedList(item.subItems, listDepth + 1);
          return `          <li>${escapeHtml(item.text)}\n${subListHtml}          </li>`;
        } else {
          const text = typeof item === 'object' ? item.text : item;
          return `          <li>${escapeHtml(text)}</li>`;
        }
      })
      .join('\n');
    return `        <ul class="${listClass}" style="font-size: ${fontSize}px;">\n${itemsHtml}\n        </ul>`;
  };

  return generateNestedList(items);
}

/**
 * Generate HTML for composite code block with depth-based styling
 */
function generateCompositeCodeHtmlWithDepth(codeBlock, depth) {
  if (!codeBlock) return '';

  // Special handling for Mermaid diagrams
  if (isMermaidCode(codeBlock)) {
    return generateCompositeMermaidHtmlWithDepth(codeBlock, depth);
  }

  const lang = codeBlock.language || 'plaintext';
  const highlightedCode = highlightCode(codeBlock.code, lang);
  const fontSize = Math.round(13 * Math.pow(0.9, depth));
  const padding = Math.round(16 * Math.pow(0.9, depth));

  return `        <div class="code-container" style="padding: ${padding}px; font-size: ${fontSize}px;">
          <pre><code class="language-${escapeHtml(lang)}">${highlightedCode}</code></pre>
        </div>`;
}

/**
 * Generate HTML for Mermaid diagram in composite slides
 * Note: Mermaid code is NOT escaped - Mermaid.js parses it directly
 */
function generateCompositeMermaidHtmlWithDepth(codeBlock, depth) {
  if (!codeBlock) return '';
  const padding = Math.round(16 * Math.pow(0.9, depth));

  return `        <div class="mermaid-container" style="padding: ${padding}px;">
          <pre class="mermaid">${codeBlock.code}</pre>
        </div>`;
}

/**
 * Generate HTML for composite cards with depth-based styling (supports normal, good, bad, step variants)
 */
function generateCompositeCardsHtmlWithDepth(cards, depth) {
  if (!cards || cards.length === 0) return '';

  const fontSize = Math.round(12 * Math.pow(0.9, depth));
  const titleSize = Math.round(14 * Math.pow(0.9, depth));
  const padding = Math.round(12 * Math.pow(0.9, depth));
  const gap = Math.round(10 * Math.pow(0.9, depth));
  const stepNumSize = Math.round(24 * Math.pow(0.9, depth));

  const cardsHtml = cards
    .map((card) => {
      const items = card.items
        .map((item) => `              <li style="font-size: ${fontSize}px;">${escapeHtml(item)}</li>`)
        .join('\n');

      // Handle step variant
      if (card.variant === 'step') {
        const stepNum = card.number !== undefined ? card.number : 0;
        return `          <div class="composite-card composite-card-step" style="padding: ${padding}px; display: flex; gap: ${gap}px; align-items: flex-start;">
            <div class="step-num" style="width: ${stepNumSize}px; height: ${stepNumSize}px; font-size: ${Math.round(fontSize * 1.1)}px;"><p>${stepNum}</p></div>
            <div class="step-content" style="flex: 1;">
              <h3 style="font-size: ${titleSize}px; margin: 0 0 4px 0;">${escapeHtml(card.name)}</h3>
              <ul style="margin: 0; padding-left: 0; list-style: none;">
${items}
              </ul>
            </div>
          </div>`;
      }

      const cardClass =
        card.variant === 'good'
          ? 'composite-card composite-card-good'
          : card.variant === 'bad'
            ? 'composite-card composite-card-bad'
            : 'composite-card';
      return `          <div class="${cardClass}" style="padding: ${padding}px;">
            <h3 style="font-size: ${titleSize}px;">${escapeHtml(card.name)}</h3>
            <ul>
${items}
            </ul>
          </div>`;
    })
    .join('\n');

  return `        <div class="composite-cards" style="gap: ${gap}px;">\n${cardsHtml}\n        </div>`;
}

/**
 * Generate HTML for a nested composite item
 */
function generateNestedCompositeHtml(item, depth = 0) {
  if (!item.compositeLayout || !item.compositeItems) return '';

  const layout = item.compositeLayout;
  const items = item.compositeItems;

  // Calculate scale factor based on depth
  const scale = Math.pow(0.85, depth);
  const gap = Math.round(12 * scale);

  if (layout.rows === 1 && layout.cols === 2) {
    // Horizontal 1:2 layout
    const leftContent = items[0] ? generateCompositeItemHtml(items[0], depth + 1) : '';
    const rightContent = items
      .slice(1)
      .map((i) => generateCompositeItemHtml(i, depth + 1))
      .join('\n');

    return `        <div class="nested-composite nested-horizontal level-${depth}" style="display: flex; gap: ${gap}px;">
          <div class="nested-left" style="flex: 1;">
${leftContent}
          </div>
          <div class="nested-right" style="flex: 1;">
${rightContent}
          </div>
        </div>`;
  } else if (layout.rows === 2 && layout.cols === 1) {
    // Vertical 2:1 layout
    const topContent = items[0] ? generateCompositeItemHtml(items[0], depth + 1) : '';
    const bottomContent = items
      .slice(1)
      .map((i) => generateCompositeItemHtml(i, depth + 1))
      .join('\n');

    return `        <div class="nested-composite nested-vertical level-${depth}" style="display: flex; flex-direction: column; gap: ${gap}px;">
          <div class="nested-top">
${topContent}
          </div>
          <div class="nested-bottom">
${bottomContent}
          </div>
        </div>`;
  } else if (layout.rows === 1 && layout.cols === 3) {
    // Three column layout
    const columns = items.slice(0, 3).map((i) => generateCompositeItemHtml(i, depth + 1));
    const columnsHtml = columns
      .map((c) => `          <div class="nested-col" style="flex: 1;">\n${c}\n          </div>`)
      .join('\n');

    return `        <div class="nested-composite nested-three-col level-${depth}" style="display: flex; gap: ${gap}px;">
${columnsHtml}
        </div>`;
  }

  // Fallback
  return items.map((i) => generateCompositeItemHtml(i, depth + 1)).join('\n');
}

/**
 * Generate HTML for a single composite item (may be nested)
 */
function generateCompositeItemHtml(item, depth = 0) {
  if (!item) return '';

  if (item.type === 'composite') {
    return generateNestedCompositeHtml(item, depth);
  } else if (item.type === 'bulletList') {
    return generateCompositeContentHtmlWithDepth(item.items, depth);
  } else if (item.type === 'code' && item.codeBlock) {
    return generateCompositeCodeHtmlWithDepth(item.codeBlock, depth);
  } else if (item.type === 'table' && item.table) {
    return generateCompositeTableHtml(item.table);
  } else if (item.type === 'cards' && item.cards) {
    return generateCompositeCardsHtmlWithDepth(item.cards, depth);
  } else if (item.type === 'flow' && item.flowItems) {
    return generateCompositeFlowHtml(item.flowItems);
  }

  return '';
}

/**
 * Calculate grid styles based on dimensions and content density
 */
function calculateGridStyles(rows, cols, items) {
  const gridSize = Math.max(rows, cols);
  const maxCardsInCell = items.reduce(
    (max, item) => (item.type === 'cards' && item.cards ? Math.max(max, item.cards.length) : max),
    1
  );

  const densityFactor = maxCardsInCell > 1 ? Math.min(maxCardsInCell, 2) : 0;
  const gridFactor = gridSize <= 1 ? 0 : gridSize - 1;
  const scaleFactor = Math.max(densityFactor, gridFactor);

  const gap = Math.max(4, 16 - scaleFactor * 2);
  const padding = Math.max(6, 16 - scaleFactor * 2);
  const titleFontSize = Math.max(14, 24 - scaleFactor * 3);
  const itemFontSize = Math.max(14, 20 - scaleFactor * 2);
  const codeFontSize = Math.max(11, Math.round(itemFontSize * 0.75));
  const borderRadius = Math.max(4, 12 - scaleFactor);
  const headerMargin = Math.max(2, 10 - scaleFactor);

  const containerWidth = 840;
  const containerHeight = rows >= 5 ? 400 : 380;
  const cellWidth = Math.floor((containerWidth - (cols - 1) * gap) / cols);
  const cellHeight = Math.floor((containerHeight - (rows - 1) * gap) / rows);

  return {
    gap,
    padding,
    titleFontSize,
    itemFontSize,
    codeFontSize,
    borderRadius,
    headerMargin,
    containerWidth,
    containerHeight,
    cellWidth,
    cellHeight,
    rows,
    cols,
    scaleFactor,
  };
}

/**
 * Generate grid CSS from calculated styles
 */
function generateGridCss(s) {
  const COLORS = getColors();
  const FONTS = getFonts();

  return `    .slide {
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
      font-size: ${s.rows >= 5 ? 22 : 28}px;
      margin: 0 0 ${s.rows >= 5 ? 10 : 16}px 0;
    }
    .grid-container {
      display: flex;
      flex-wrap: wrap;
      gap: ${s.gap}px;
      width: ${s.containerWidth}px;
      height: ${s.containerHeight}px;
      align-content: flex-start;
    }
    .grid-cell {
      width: ${s.cellWidth}px;
      height: ${s.cellHeight}px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
    }
    .grid-cell-card {
      background: ${COLORS.white};
      border-radius: ${s.borderRadius}px;
      padding: ${s.padding}px;
      box-shadow: ${COLORS.cardShadow};
    }
    .grid-cell h3 {
      color: ${COLORS.primary};
      font-size: ${s.titleFontSize}px;
      font-weight: 600;
      margin: 0 0 ${s.headerMargin}px 0;
      line-height: 1.2;
    }
    .grid-cell ul {
      margin: 0;
      padding-left: ${Math.max(10, 18 - Math.max(s.rows, s.cols))}px;
    }
    .grid-cell li {
      color: ${COLORS.muted};
      font-size: ${s.itemFontSize}px;
      line-height: 1.4;
      margin-bottom: ${Math.max(1, 4 - Math.max(s.rows, s.cols) / 2)}px;
    }
    .grid-cell li:last-child {
      margin-bottom: 0;
    }
    .grid-cell-nested {
      padding: ${Math.max(2, s.padding / 2)}px;
    }
    .nested-grid {
      height: 100%;
    }
    .nested-cell {
      background: ${COLORS.surface};
      border-radius: ${Math.max(2, s.borderRadius / 2)}px;
      padding: ${Math.max(2, s.padding / 2)}px;
      overflow: hidden;
    }
    .nested-cell h4 {
      color: ${COLORS.primary};
      font-size: ${Math.max(8, s.titleFontSize - 2)}px;
      font-weight: 600;
      margin: 0 0 ${Math.max(2, s.headerMargin / 2)}px 0;
      line-height: 1.2;
    }
    .nested-cell ul {
      margin: 0;
      padding-left: ${Math.max(8, 14 - Math.max(s.rows, s.cols))}px;
    }
    .nested-cell li {
      color: ${COLORS.muted};
      font-size: ${Math.max(6, s.itemFontSize - 2)}px;
      line-height: 1.3;
    }
    .grid-cell-code {
      background: #1e1e1e;
      padding: ${Math.max(8, s.padding)}px;
    }
    .grid-cell-code pre {
      margin: 0;
      padding: 0;
      background: transparent;
      white-space: pre-wrap;
    }
    .grid-cell-code code {
      font-family: ${FONTS.code};
      font-size: ${s.codeFontSize}px;
      line-height: 1.4;
      color: #d4d4d4;
    }${SYNTAX_HIGHLIGHT_CSS}${MERMAID_STYLES.grid(s)}
    .grid-cell-multi-cards {
      display: flex;
      flex-direction: column;
      gap: ${Math.max(4, s.gap / 2)}px;
      padding: ${Math.max(6, s.padding / 2)}px;
    }
    .inline-card {
      background: ${COLORS.surface};
      border-radius: ${Math.max(4, s.borderRadius / 2)}px;
      padding: ${Math.max(8, s.padding / 2)}px ${Math.max(8, s.padding / 2)}px ${Math.max(8, s.padding / 2)}px ${Math.max(12, s.padding)}px;
    }
    .inline-card h4 {
      color: ${COLORS.primary};
      font-size: ${Math.max(10, s.titleFontSize - 2)}px;
      font-weight: 600;
      margin: 0 0 ${Math.max(2, s.headerMargin / 2)}px 0;
    }
    .inline-card ul {
      margin: 0;
      padding-left: ${Math.max(10, 16 - Math.max(s.rows, s.cols))}px;
    }
    .inline-card li {
      color: ${COLORS.muted};
      font-size: ${Math.max(8, s.itemFontSize - 1)}px;
      line-height: 1.3;
    }
    .card-code {
      background: #1e1e1e;
      border-radius: ${Math.max(4, s.borderRadius / 2)}px;
      padding: ${Math.max(4, s.padding / 3)}px ${Math.max(6, s.padding / 2)}px;
      margin-top: ${Math.max(4, s.headerMargin / 2)}px;
      overflow: hidden;
    }
    .card-code code {
      font-family: ${FONTS.code};
      font-size: ${Math.max(9, s.codeFontSize - 1)}px;
      line-height: 1.3;
      color: #d4d4d4;
      white-space: pre-wrap;
    }
    .inline-card.inline-card-good {
      background: ${COLORS.goodBackground};
    }
    .inline-card.inline-card-good h4 {
      color: ${COLORS.goodForeground};
    }
    .inline-card.inline-card-good li {
      color: ${COLORS.goodForeground};
    }
    .inline-card.inline-card-bad {
      background: ${COLORS.badBackground};
    }
    .inline-card.inline-card-bad h4 {
      color: ${COLORS.badForeground};
    }
    .inline-card.inline-card-bad li {
      color: ${COLORS.badForeground};
    }
    .inline-card-step {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }
    .inline-card-step .step-num {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      background: linear-gradient(135deg, ${COLORS.primary} 0%, #0E7490 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${COLORS.white};
      font-size: 11px;
      font-weight: 700;
    }
    .inline-card-step .step-content {
      flex: 1;
      min-width: 0;
    }
    .inline-card-step .step-content h4 {
      margin: 0 0 2px 0;
    }
    .inline-card-step .step-content ul {
      margin: 0;
      padding-left: 0;
      list-style: none;
    }
    .grid-cell-card.grid-cell-card-good {
      background: ${COLORS.goodBackground};
    }
    .grid-cell-card.grid-cell-card-good h3 {
      color: ${COLORS.goodForeground};
    }
    .grid-cell-card.grid-cell-card-good li {
      color: ${COLORS.goodForeground};
    }
    .grid-cell-card.grid-cell-card-bad {
      background: ${COLORS.badBackground};
    }
    .grid-cell-card.grid-cell-card-bad h3 {
      color: ${COLORS.badForeground};
    }
    .grid-cell-card.grid-cell-card-bad li {
      color: ${COLORS.badForeground};
    }
    .nested-cell.nested-cell-good {
      background: ${COLORS.goodBackground};
    }
    .nested-cell.nested-cell-good h4 {
      color: ${COLORS.goodForeground};
    }
    .nested-cell.nested-cell-good li {
      color: ${COLORS.goodForeground};
    }
    .nested-cell.nested-cell-bad {
      background: ${COLORS.badBackground};
    }
    .nested-cell.nested-cell-bad h4 {
      color: ${COLORS.badForeground};
    }
    .nested-cell.nested-cell-bad li {
      color: ${COLORS.badForeground};
    }
    .grid-cell-table {
      padding: ${Math.max(4, s.padding / 2)}px;
    }
    .grid-table,
    .composite-table {
      width: 100%;
      border-collapse: collapse;
    }
    .grid-table th,
    .grid-table td,
    .composite-table th,
    .composite-table td {
      padding: ${Math.max(4, s.padding / 3)}px;
      border: 1px solid ${COLORS.border};
      text-align: left;
      vertical-align: middle;
    }
    .grid-table th,
    .composite-table th {
      background: ${COLORS.darkBg};
      color: ${COLORS.white};
      font-weight: 600;
    }
    .grid-table td,
    .composite-table td {
      background: ${COLORS.white};
    }
    .grid-table th p,
    .grid-table td p,
    .composite-table th p,
    .composite-table td p {
      margin: 0;
      font-size: ${Math.max(8, s.itemFontSize - 1)}px;
    }
    .grid-table th p,
    .composite-table th p {
      color: ${COLORS.white};
    }
    .grid-table td p,
    .composite-table td p {
      color: ${COLORS.text};
    }
    .grid-cell-flow {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .grid-flow {
      display: flex;
      align-items: center;
      gap: ${Math.max(4, s.gap / 2)}px;
      flex-wrap: wrap;
      justify-content: center;
    }
    .grid-flow-item {
      background: ${COLORS.primary};
      border-radius: ${Math.max(4, s.borderRadius / 2)}px;
      padding: ${Math.max(4, s.padding / 3)}px ${Math.max(8, s.padding / 2)}px;
    }
    .grid-flow-item p {
      margin: 0;
      color: ${COLORS.white};
      font-size: ${Math.max(9, s.itemFontSize)}px;
      font-weight: 500;
    }
    .grid-flow-arrow p {
      margin: 0;
      color: ${COLORS.muted};
      font-size: ${Math.max(12, s.titleFontSize)}px;
    }`;
}

/**
 * Generate HTML for nested grid within a parent grid cell
 */
function generateNestedGridHtml(item, parentRows, parentCols) {
  const COLORS = getColors();
  const layout = item.compositeLayout;
  const items = item.compositeItems || [];
  const nestedRows = layout.rows;
  const nestedCols = layout.cols;
  const totalCells = nestedRows * nestedCols;

  // Calculate gap for nested grid based on parent size
  const depth = Math.max(parentRows, parentCols);
  const gap = Math.max(2, 8 - depth);

  // Expand nested cards
  let expandedItems = [];
  for (const nestedItem of items) {
    if (nestedItem.type === 'cards' && nestedItem.cards && nestedItem.cards.length > 1) {
      for (const card of nestedItem.cards) {
        expandedItems.push({ type: 'cards', cards: [card] });
      }
    } else {
      expandedItems.push(nestedItem);
    }
  }

  // Generate nested cells
  const cellsHtml = expandedItems
    .slice(0, totalCells)
    .map((nestedItem) => {
      if (nestedItem.type === 'cards' && nestedItem.cards && nestedItem.cards.length > 0) {
        const card = nestedItem.cards[0];
        const itemsHtml = card.items.map((i) => `              <li>${escapeHtml(i)}</li>`).join('\n');

        const variantClass =
          card.variant === 'good' ? ' nested-cell-good' : card.variant === 'bad' ? ' nested-cell-bad' : '';

        return `          <div class="nested-cell${variantClass}">
            <h4>${escapeHtml(card.name)}</h4>
            <ul>
${itemsHtml}
            </ul>
          </div>`;
      } else if (nestedItem.type === 'bulletList' && nestedItem.items) {
        const itemsHtml = nestedItem.items
          .map((i) => {
            const text = typeof i === 'string' ? i : i.text;
            return `              <li>${escapeHtml(text)}</li>`;
          })
          .join('\n');
        return `          <div class="nested-cell">
            <ul>
${itemsHtml}
            </ul>
          </div>`;
      }
      return `          <div class="nested-cell"></div>`;
    })
    .join('\n');

  // Fill remaining cells
  const filledCells =
    expandedItems.length < totalCells
      ? cellsHtml +
        '\n' +
        Array(totalCells - expandedItems.length)
          .fill('          <div class="nested-cell"></div>')
          .join('\n')
      : cellsHtml;

  return `        <div class="nested-grid" style="display: grid; grid-template-columns: repeat(${nestedCols}, 1fr); grid-template-rows: repeat(${nestedRows}, 1fr); gap: ${gap}px; height: 100%;">
${filledCells}
        </div>`;
}

/**
 * Generate a table cell for grid layout (native table with data-pptx-table)
 */
function generateGridTableCell(table) {
  const COLORS = getColors();
  if (!table || !table.headers || table.headers.length === 0) return '      <div class="grid-cell"></div>';

  const pptxRows = [table.headers, ...table.rows];

  // JSON data for PPTX native table with theme colors
  const pptxTableJson = JSON.stringify({
    rows: pptxRows,
    options: {
      fontFace: 'Meiryo',
      fontSize: 10,
      border: { pt: 1, color: COLORS.border.replace('#', '') },
      headerBg: '0F172A',
      headerColor: 'FFFFFF',
      labelBg: COLORS.headerBg.replace('#', ''),
      labelColor: COLORS.text.replace('#', ''),
      cellBg: 'FFFFFF',
      cellColor: COLORS.muted.replace('#', ''),
    },
  });

  const headerCells = table.headers.map((h) => `              <th><p>${escapeHtml(h)}</p></th>`).join('\n');

  const dataRows = table.rows
    .map((row) => {
      const cells = row.map((cell) => `              <td><p>${escapeHtml(cell)}</p></td>`).join('\n');
      return `            <tr>\n${cells}\n            </tr>`;
    })
    .join('\n');

  return `      <div class="grid-cell grid-cell-table">
          <table class="grid-table" data-pptx-table='${pptxTableJson}'>
            <thead>
            <tr>
${headerCells}
            </tr>
            </thead>
            <tbody>
${dataRows}
            </tbody>
          </table>
      </div>`;
}

/**
 * Generate a flow cell for grid layout
 */
function generateGridFlowCell(flowItems) {
  if (!flowItems || flowItems.length === 0) return '      <div class="grid-cell"></div>';

  const flowHtml = flowItems
    .map((item, index) => {
      const arrow = index < flowItems.length - 1 ? '\n            <div class="grid-flow-arrow"><p>→</p></div>' : '';
      return `            <div class="grid-flow-item">
              <p>${escapeHtml(item)}</p>
            </div>${arrow}`;
    })
    .join('\n');

  return `      <div class="grid-cell grid-cell-flow">
          <div class="grid-flow">
${flowHtml}
          </div>
      </div>`;
}

/**
 * Generate grid composite slide (NxM layout, supports 1x2 to 8x8)
 */
function generateCompositeGrid(slide, items, rows, cols) {
  const totalCells = rows * cols;

  // Calculate responsive sizes using extracted function
  const s = calculateGridStyles(rows, cols, items);

  // Generate CSS using extracted function
  const style = generateGridCss(s);

  const section = slide.section ? `    <p class="section-num">${escapeHtml(slide.section)}</p>\n` : '';
  const title = slide.title || slide.name;

  // Expand items only if needed to fill the grid
  let expandedItems = [];
  if (items.length >= totalCells) {
    // Keep items as-is - each item gets one cell
    expandedItems = items;
  } else {
    // Expand cards to fill available cells
    for (const item of items) {
      if (item.type === 'cards' && item.cards && item.cards.length > 1) {
        for (const card of item.cards) {
          expandedItems.push({ type: 'cards', cards: [card] });
        }
      } else {
        expandedItems.push(item);
      }
    }
  }

  // Helper to render a cards item (may contain multiple cards)
  const renderCardsCell = (item) => {
    const COLORS = getColors();
    if (item.cards.length === 1) {
      // Single card - with white card container
      const card = item.cards[0];
      const itemsHtml = card.items.map((i) => `          <li>${escapeHtml(i)}</li>`).join('\n');
      const codeBlockHtml = card.codeBlock
        ? `
        <div class="card-code"><pre><code class="language-${escapeHtml(card.codeBlock.language)}">${highlightCode(card.codeBlock.code, card.codeBlock.language)}</code></pre></div>`
        : '';

      const variantClass =
        card.variant === 'good'
          ? ' grid-cell-card-good'
          : card.variant === 'bad'
            ? ' grid-cell-card-bad'
            : '';

      return `      <div class="grid-cell grid-cell-card${variantClass}">
        <h3>${escapeHtml(card.name)}</h3>
        <ul>
${itemsHtml}
        </ul>${codeBlockHtml}
      </div>`;
    } else {
      // Multiple cards in one cell - render as inline cards
      const cardsHtml = item.cards
        .map((card) => {
          const itemsHtml = card.items.map((i) => `            <li>${escapeHtml(i)}</li>`).join('\n');
          const codeBlockHtml = card.codeBlock
            ? `
            <div class="card-code"><code class="language-${escapeHtml(card.codeBlock.language)}">${highlightCode(card.codeBlock.code, card.codeBlock.language)}</code></div>`
            : '';

          // Handle step variant with step number badge
          if (card.variant === 'step') {
            const stepNum = card.number !== undefined ? card.number : '';
            return `          <div class="inline-card inline-card-step">
            <div class="step-num"><p>${stepNum}</p></div>
            <div class="step-content">
              <h4>${escapeHtml(card.name)}</h4>
              <ul>
${itemsHtml}
              </ul>${codeBlockHtml}
            </div>
          </div>`;
          }

          const cardClass =
            card.variant === 'good'
              ? 'inline-card inline-card-good'
              : card.variant === 'bad'
                ? 'inline-card inline-card-bad'
                : 'inline-card';
          return `          <div class="${cardClass}">
            <h4>${escapeHtml(card.name)}</h4>
            <ul>
${itemsHtml}
            </ul>${codeBlockHtml}
          </div>`;
        })
        .join('\n');
      return `      <div class="grid-cell grid-cell-multi-cards">
${cardsHtml}
      </div>`;
    }
  };

  // Generate cells for grid
  const cellsHtml = expandedItems
    .slice(0, totalCells)
    .map((item) => {
      if (item.type === 'composite' && item.compositeLayout && item.compositeItems) {
        // Nested composite - render as nested grid
        const nestedHtml = generateNestedGridHtml(item, rows, cols);
        return `      <div class="grid-cell grid-cell-nested">\n${nestedHtml}\n      </div>`;
      } else if (item.type === 'cards' && item.cards && item.cards.length > 0) {
        return renderCardsCell(item);
      } else if (item.type === 'bulletList' && item.items) {
        const itemsHtml = item.items
          .map((i) => {
            const text = typeof i === 'string' ? i : i.text;
            return `          <li>${escapeHtml(text)}</li>`;
          })
          .join('\n');
        return `      <div class="grid-cell">
        <ul>
${itemsHtml}
        </ul>
      </div>`;
      } else if (item.type === 'code' && item.codeBlock) {
        // Special handling for Mermaid diagrams (NOT escaped)
        if (isMermaidCode(item.codeBlock)) {
          return `      <div class="grid-cell grid-cell-mermaid">
        <div class="mermaid-container">
          <pre class="mermaid">${item.codeBlock.code}</pre>
        </div>
      </div>`;
        }
        const lang = item.codeBlock.language || 'plaintext';
        const highlightedCode = highlightCode(item.codeBlock.code, lang);
        return `      <div class="grid-cell grid-cell-code">
        <pre><code class="language-${escapeHtml(lang)}">${highlightedCode}</code></pre>
      </div>`;
      } else if (item.type === 'table' && item.table) {
        return generateGridTableCell(item.table);
      } else if (item.type === 'flow' && item.flowItems) {
        return generateGridFlowCell(item.flowItems);
      }
      return `      <div class="grid-cell"></div>`;
    })
    .join('\n');

  // Fill remaining cells if less than totalCells items
  const filledCells =
    expandedItems.length < totalCells
      ? cellsHtml +
        '\n' +
        Array(totalCells - expandedItems.length)
          .fill('      <div class="grid-cell"></div>')
          .join('\n')
      : cellsHtml;

  // Determine required CDN scripts (check both original items and expanded items)
  const requiredScripts = getRequiredScripts([...items, ...expandedItems]);
  const mermaidScript = requiredScripts.has('mermaid') ? generateCdnScript('mermaid') : '';

  const body = `${section}    <h1>${escapeHtml(title)}</h1>
    <div class="grid-container">
${filledCells}
    </div>${mermaidScript}`;

  return { style, body };
}

/**
 * Generate Composite Slide
 */
function generateCompositeSlide(slide) {
  const layout = slide.compositeLayout || { rows: 1, cols: 2 };
  const items = slide.compositeItems || [];

  // All numeric grid layouts use generateCompositeGrid (1x2, 2x1, 1x3, 2x2, etc.)
  if (layout.rows >= 1 && layout.cols >= 1 && layout.rows <= 8 && layout.cols <= 8) {
    return generateCompositeGrid(slide, items, layout.rows, layout.cols);
  }
  // Fallback to 1x2 grid
  return generateCompositeGrid(slide, items, 1, 2);
}

module.exports = generateCompositeSlide;
