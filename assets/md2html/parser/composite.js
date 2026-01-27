/**
 * Composite slide parser
 * Handles complex grid layouts with nested content
 */

const { PATTERNS, INDENT, MAX_COMPOSITE_DEPTH, ELEMENT_TYPE_CREATORS, CARD_MATCHERS } = require('../constants');
const { createCard } = require('./cards');
const { parseTableFromLines } = require('./table');

/**
 * Find matching card pattern in content
 * @param {string} content - Content to match against
 * @returns {{matcher: Object, match: RegExpMatchArray}|null}
 */
function findCardMatch(content) {
  for (const matcher of CARD_MATCHERS) {
    const match = content.match(matcher.pattern);
    if (match) return { matcher, match };
  }
  return null;
}

/**
 * Process a card match and update state
 * @param {{matcher: Object, match: RegExpMatchArray}} result - Match result from findCardMatch
 * @param {Object} currentItem - Current composite item
 * @param {import('../types').CardDef|null} currentCard - Current card being built
 * @param {Function} saveCurrentItem - Function to save current item
 * @returns {{currentItem: Object, currentCard: import('../types').CardDef}}
 */
function processCardMatch(result, currentItem, currentCard, saveCurrentItem) {
  const { matcher, match } = result;

  const needsNewGroup =
    !currentItem ||
    currentItem.type !== 'cards' ||
    (currentItem.cards.length > 0 && matcher.shouldStartNewGroup(currentItem.cards));

  let newCurrentItem = currentItem;
  if (needsNewGroup) {
    saveCurrentItem();
    newCurrentItem = { type: 'cards', cards: [] };
  } else if (currentCard) {
    newCurrentItem = { ...currentItem, cards: [...currentItem.cards, currentCard] };
  }

  const newCard = createCard(matcher.getName(match), matcher.variant);
  if (matcher.getNumber) {
    newCard.number = matcher.getNumber(match);
  }

  return { currentItem: newCurrentItem, currentCard: newCard };
}

/**
 * Finalize a composite item and add it to the items array
 * @param {import('../types').CompositeItemDef} item - The composite item to finalize
 * @param {import('../types').CardDef|null} currentCard - Current card being built
 * @param {import('../types').CompositeItemDef[]} items - Array to push finalized item to
 * @returns {{card: import('../types').CardDef|null}} - Reset card values
 */
function finalizeCompositeItem(item, currentCard, items) {
  if (!item) return { card: currentCard };

  let card = currentCard;

  switch (item.type) {
    case 'bulletList':
      if (item.items && item.items.length > 0) {
        items.push(item);
      }
      break;
    case 'cards':
      if (currentCard) {
        item.cards.push(currentCard);
        card = null;
      }
      if (item.cards && item.cards.length > 0) {
        items.push(item);
      }
      break;
    case 'table':
      if (item.tableLines && item.tableLines.length > 0) {
        item.table = parseTableFromLines(item.tableLines);
        delete item.tableLines;
        items.push(item);
      }
      break;
    case 'flow':
      if (item.flowItems && item.flowItems.length > 0) {
        items.push(item);
      }
      break;
    case 'code':
      if (item.codeBlock) {
        items.push(item);
      }
      break;
    case 'composite':
      if (item.compositeItems && item.compositeItems.length > 0) {
        items.push(item);
      }
      break;
  }

  return { card };
}

/**
 * Parse composite layout string (e.g., "1:2", "2:1", "1:1:1")
 * @param {string} layoutStr - Layout string like "1:2" or "1:1:1"
 * @returns {import('../types').CompositeLayoutDef|null}
 */
function parseCompositeLayout(layoutStr) {
  const parts = layoutStr.split(':').map((n) => parseInt(n, 10));
  if (parts.some(isNaN)) return null;

  if (parts.length === 2) {
    // "1:2" → horizontal (1 row, 2 cols), "2:1" → vertical (2 rows, 1 col)
    return { rows: parts[0], cols: parts[1] };
  } else if (parts.length === 3) {
    // "1:1:1" → 3 columns
    return { rows: 1, cols: 3 };
  }
  return null;
}

/**
 * Check if content matches an element type declaration and return the type
 *
 * Note: Mermaid declarations are intentionally treated as 'code' type here.
 * The actual rendering method (Mermaid.js vs highlight.js) is determined
 * in templates.js based on the codeBlock.language property ('mermaid').
 * This design keeps the parser simple while allowing templates.js to handle
 * all rendering decisions.
 *
 * @param {string} content - Content to check
 * @returns {'bulletList'|'code'|'table'|'flow'|null} - Element type or null
 */
function matchElementType(content) {
  if (PATTERNS.bulletList.test(content)) return 'bulletList';
  if (PATTERNS.code.test(content)) return 'code';
  // Mermaid is treated as 'code' - templates.js checks codeBlock.language
  // to determine whether to render with Mermaid.js or highlight.js
  if (PATTERNS.mermaid.test(content)) return 'code';
  if (PATTERNS.table.test(content)) return 'table';
  if (PATTERNS.flow.test(content)) return 'flow';
  return null;
}

/**
 * Handle content at deeper levels within a composite item
 * @param {Object} currentItem - Current composite item
 * @param {Object} currentContentItem - Current content item for bullet lists
 * @param {Object} currentCard - Current card for card items
 * @param {string} content - Content to add
 * @param {number} indent - Current indentation
 * @param {number} baseIndent - Base indentation level
 * @returns {{currentContentItem: Object}} - Updated content item
 */
function handleDeepContent(currentItem, currentContentItem, currentCard, content, indent, baseIndent) {
  if (!currentItem) return { currentContentItem };

  if (currentItem.type === 'bulletList') {
    if (indent < baseIndent + 4) {
      // First level content item
      const newContentItem = { text: content, subItems: [] };
      currentItem.items.push(newContentItem);
      return { currentContentItem: newContentItem };
    } else if (currentContentItem) {
      // Sub-item
      currentContentItem.subItems.push({ text: content, subSubItems: [] });
    }
  } else if (currentItem.type === 'flow') {
    currentItem.flowItems.push(content);
  } else if (currentItem.type === 'cards' && currentCard) {
    currentCard.items.push(content);
  }

  return { currentContentItem };
}

/**
 * Parse composite items recursively
 * @param {string[]} lines - All lines from markdown
 * @param {number} startIndex - Starting line index
 * @param {number} baseIndent - Base indentation level for items
 * @param {number} depth - Current nesting depth
 * @returns {{items: import('../types').CompositeItemDef[], endIndex: number}}
 */
function parseCompositeItems(lines, startIndex, baseIndent, depth = 0) {
  const items = [];
  let i = startIndex;
  let currentItem = null;
  let currentCard = null;
  let currentContentItem = null;
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockLines = [];

  // Helper to save current item using shared function
  const saveCurrentItem = () => {
    const result = finalizeCompositeItem(currentItem, currentCard, items);
    currentCard = result.card;
    currentItem = null;
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check for slide header - end of composite section
    if (!inCodeBlock && PATTERNS.slideHeader.test(trimmed)) {
      break;
    }

    // Handle code blocks
    if (PATTERNS.codeBlockMarker.test(trimmed)) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLang = trimmed.slice(3).trim() || 'plaintext';
        codeBlockLines = [];
        i++;
        continue;
      } else {
        inCodeBlock = false;
        const codeContent = codeBlockLines.join('\n');
        if (currentItem && currentItem.type === 'code') {
          // Standalone code block
          currentItem.codeBlock = {
            language: codeBlockLang,
            code: codeContent,
          };
          items.push(currentItem);
          currentItem = null;
        } else if (currentItem && currentItem.type === 'cards' && currentCard) {
          // Code block inside a card - add as codeBlock property
          currentCard.codeBlock = {
            language: codeBlockLang,
            code: codeContent,
          };
        }
        i++;
        continue;
      }
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      i++;
      continue;
    }

    // Handle table rows
    if (PATTERNS.tableRow.test(trimmed)) {
      if (currentItem && currentItem.type === 'table') {
        currentItem.tableLines.push(trimmed);
      }
      i++;
      continue;
    }

    // Skip empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // Check for H3 card header (### Card Name)
    const h3Match = trimmed.match(PATTERNS.cardH3);
    if (h3Match && currentItem && currentItem.type === 'cards' && currentCard) {
      // Update current card's name
      currentCard.name = h3Match[1].trim();
      i++;
      continue;
    }

    // Check indentation
    const indentMatch = line.match(PATTERNS.listItem);
    if (!indentMatch) {
      i++;
      continue;
    }

    const indent = indentMatch[1].length;
    const content = indentMatch[2];

    // If indent is less than baseIndent, we've exited this composite level
    if (indent < baseIndent) {
      break;
    }

    // Item at this level (baseIndent)
    if (indent >= baseIndent && indent < baseIndent + 2) {
      // Check for nested composite
      const nestedCompositeMatch = content.match(PATTERNS.composite);
      if (nestedCompositeMatch && depth < MAX_COMPOSITE_DEPTH) {
        saveCurrentItem();
        const layout = parseCompositeLayout(nestedCompositeMatch[1].trim());
        if (layout) {
          // Parse nested composite items
          const result = parseCompositeItems(lines, i + 1, baseIndent + 2, depth + 1);
          currentItem = {
            type: 'composite',
            compositeLayout: layout,
            compositeItems: result.items,
          };
          items.push(currentItem);
          currentItem = null;
          i = result.endIndex;
          continue;
        }
      }

      // Check for element type declarations (bulletList, code, table, flow)
      const elementType = matchElementType(content);
      if (elementType) {
        saveCurrentItem();
        currentItem = ELEMENT_TYPE_CREATORS[elementType]();
        if (elementType === 'bulletList') currentContentItem = null;
        i++;
        continue;
      }

      // Card patterns (card, step, good, bad)
      const cardMatchResult = findCardMatch(content);
      if (cardMatchResult) {
        const result = processCardMatch(cardMatchResult, currentItem, currentCard, saveCurrentItem);
        currentItem = result.currentItem;
        currentCard = result.currentCard;
        i++;
        continue;
      }

      // In new H3 format, card items can be at baseIndent level (same as trigger)
      if (currentItem && currentItem.type === 'cards' && currentCard) {
        currentCard.items.push(content);
        i++;
        continue;
      }
    }

    // Content at deeper levels
    if (indent >= baseIndent + 2) {
      const deepResult = handleDeepContent(currentItem, currentContentItem, currentCard, content, indent, baseIndent);
      currentContentItem = deepResult.currentContentItem;
    }

    i++;
  }

  // Save any remaining item
  saveCurrentItem();

  return { items, endIndex: i };
}

/**
 * Parse composite slide
 * @param {string[]} lines - Body lines
 * @returns {{compositeLayout?: import('../types').CompositeLayoutDef, compositeItems?: import('../types').CompositeItemDef[]}}
 */
function parseComposite(lines) {
  const compositeIndex = lines.findIndex((line) => {
    const match = line.match(PATTERNS.listItem);
    return match && PATTERNS.composite.test(match[2]);
  });

  if (compositeIndex === -1) {
    // No explicit 複合: line — implicit composite (e.g., cards + Mermaid mixed)
    const result = parseCompositeItems(lines, 0, 0, 0);
    if (result.items.length >= 2) {
      return { compositeLayout: { rows: 1, cols: result.items.length }, compositeItems: result.items };
    }
    return {};
  }

  const match = lines[compositeIndex].match(PATTERNS.listItem);
  const compositeMatch = match[2].match(PATTERNS.composite);
  const layout = parseCompositeLayout(compositeMatch[1].trim());

  if (!layout) return {};

  const result = parseCompositeItems(lines, compositeIndex + 1, 0, 0);
  return { compositeLayout: layout, compositeItems: result.items };
}

// Export helper functions for use elsewhere
parseComposite.matchElementType = matchElementType;
parseComposite.parseCompositeItems = parseCompositeItems;

module.exports = parseComposite;
