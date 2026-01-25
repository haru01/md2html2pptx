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
  /** @type {{indent: number, content: string}[]} */
  const parsedLines = lines
    .map((line) => line.match(PATTERNS.listItem))
    .filter(Boolean)
    .map(([, spaces, content]) => ({ indent: spaces.length, content }));

  const isMetadata = (content) => PATTERNS.section.test(content) || PATTERNS.title.test(content);

  const initialState = {
    items: [],
    active: false,
  };

  const addTopLevelItem = (items, content) => [...items, { text: content, subItems: [] }];

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

  const finalState = parsedLines.reduce((state, { indent, content }) => {
    if (isMetadata(content)) return state;
    if (PATTERNS.bulletList.test(content)) return { ...state, active: true };
    if (!state.active) return state;

    if (indent < INDENT.FIRST_LEVEL) {
      return { ...state, items: addTopLevelItem(state.items, content) };
    }
    if (indent < INDENT.SECOND_LEVEL) {
      return { ...state, items: addSubItem(state.items, content) };
    }
    return { ...state, items: addSubSubItem(state.items, content) };
  }, initialState);

  return { items: finalState.items };
}

module.exports = parseBulletList;
