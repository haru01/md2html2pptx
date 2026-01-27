/**
 * Bullet list (content) slide parser
 */

const { PATTERNS, INDENT } = require('../constants');

/**
 * Parse bullet list slide
 * @param {string[]} lines - Body lines
 * @returns {{items: import('../types').ContentItem[]}}
 */
function parseBulletList(lines) {
  /** @type {{indent: number, content: string, isHeading: boolean}[]} */
  const parsedLines = lines
    .map((line) => {
      // Check for h3 heading (### xxx)
      const headingMatch = line.match(/^###\s+(.+)$/);
      if (headingMatch) {
        return { indent: 0, content: headingMatch[1], isHeading: true };
      }
      // Check for list item (- xxx)
      const listMatch = line.match(PATTERNS.listItem);
      if (listMatch) {
        return { indent: listMatch[1].length, content: listMatch[2], isHeading: false };
      }
      return null;
    })
    .filter(Boolean);

  const isMetadata = (content) => PATTERNS.section.test(content) || PATTERNS.title.test(content);

  const initialState = {
    items: [],
    active: false,
    underH3: false, // Track if we're under an H3 heading
  };

  const addTopLevelItem = (items, content, isHeading = false) => [
    ...items,
    { text: content, subItems: [], ...(isHeading && { isHeading: true }) },
  ];

  const addSubItem = (items, content) => {
    if (items.length === 0) return items;
    const lastItem = items[items.length - 1];
    return [
      ...items.slice(0, -1),
      {
        ...lastItem,
        subItems: [...lastItem.subItems, { text: content, subSubItems: [] }],
      },
    ];
  };

  const addSubSubItem = (items, content) => {
    if (items.length === 0) return items;
    const lastItem = items[items.length - 1];
    if (lastItem.subItems.length === 0) return items;
    const lastSubItem = lastItem.subItems[lastItem.subItems.length - 1];
    return [
      ...items.slice(0, -1),
      {
        ...lastItem,
        subItems: [
          ...lastItem.subItems.slice(0, -1),
          { ...lastSubItem, subSubItems: [...lastSubItem.subSubItems, content] },
        ],
      },
    ];
  };

  const finalState = parsedLines.reduce((state, { indent, content, isHeading }) => {
    if (isMetadata(content)) return state;
    if (PATTERNS.bulletList.test(content)) return { ...state, active: true };
    if (!state.active) return state;

    // H3 headings are always top-level
    if (isHeading) {
      return { ...state, items: addTopLevelItem(state.items, content, isHeading), underH3: true };
    }

    // When under H3 heading:
    // - indent 0 → sub-item under H3
    // - indent 2 → sub-sub-item under last sub-item
    // - indent 4+ → sub-sub-item under last sub-item
    if (state.underH3) {
      if (indent === 0) {
        return { ...state, items: addSubItem(state.items, content) };
      } else {
        // indent >= 2: sub-sub-item
        return { ...state, items: addSubSubItem(state.items, content) };
      }
    }

    // When not under H3 (regular bullet list):
    // - indent 0 or 2 → top-level
    // - indent 4 → sub-item
    // - indent 6+ → sub-sub-item
    if (indent <= INDENT.TOP_LEVEL) {
      return { ...state, items: addTopLevelItem(state.items, content, false) };
    }
    if (indent <= INDENT.FIRST_LEVEL) {
      return { ...state, items: addSubItem(state.items, content) };
    }
    return { ...state, items: addSubSubItem(state.items, content) };
  }, initialState);

  return { items: finalState.items };
}

module.exports = parseBulletList;
