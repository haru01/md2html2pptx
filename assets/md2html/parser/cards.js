/**
 * Cards slide parser
 */

const { PATTERNS, INDENT } = require('../constants');

/**
 * Create a card definition
 * @param {string} name - Card name
 * @param {'normal'|'good'|'bad'|'step'} [variant='normal'] - Card variant
 * @returns {import('../types').CardDef}
 */
function createCard(name, variant = 'normal') {
  const card = { name, items: [] };
  if (variant !== 'normal') {
    card.variant = variant;
  }
  return card;
}

/**
 * Parse cards slide
 * @param {string[]} lines - Body lines
 * @returns {{cards: import('../types').CardDef[]}}
 */
function parseCards(lines) {
  const isMetadata = (content) =>
    PATTERNS.section.test(content) || PATTERNS.title.test(content) || PATTERNS.layout.test(content);

  const parseCardHeader = (content) => {
    const cardMatch = content.match(PATTERNS.card);
    if (cardMatch) return { name: cardMatch[2].trim(), variant: 'normal', number: null };
    const stepMatch = content.match(PATTERNS.step);
    if (stepMatch) return { name: stepMatch[2].trim(), variant: 'step', number: parseInt(stepMatch[1], 10) };
    const goodMatch = content.match(PATTERNS.good);
    if (goodMatch) return { name: goodMatch[1].trim(), variant: 'good', number: null };
    const badMatch = content.match(PATTERNS.bad);
    if (badMatch) return { name: badMatch[1].trim(), variant: 'bad', number: null };
    return null;
  };

  const finalizeCard = (state) =>
    state.currentCard ? { ...state, cards: [...state.cards, state.currentCard], currentCard: null } : state;

  const initialState = {
    cards: [],
    currentCard: null,
    inCodeBlock: false,
    codeBlockLang: '',
    codeBlockLines: [],
  };

  const finalState = lines.reduce((state, line) => {
    const trimmed = line.trim();

    // Handle code block markers
    if (PATTERNS.codeBlockMarker.test(trimmed)) {
      if (!state.inCodeBlock) {
        return {
          ...state,
          inCodeBlock: true,
          codeBlockLang: trimmed.slice(3).trim() || 'plaintext',
          codeBlockLines: [],
        };
      }
      // End code block: attach to current card
      if (state.currentCard) {
        return {
          ...state,
          inCodeBlock: false,
          currentCard: {
            ...state.currentCard,
            codeBlock: { language: state.codeBlockLang, code: state.codeBlockLines.join('\n') },
          },
        };
      }
      return { ...state, inCodeBlock: false };
    }

    // Collect code block lines
    if (state.inCodeBlock) {
      return { ...state, codeBlockLines: [...state.codeBlockLines, line] };
    }

    // Parse list items
    const match = line.match(PATTERNS.listItem);
    if (!match) return state;
    const [, spaces, content] = match;
    const indent = spaces.length;

    if (isMetadata(content)) return state;

    // Check for card header
    const header = parseCardHeader(content);
    if (header) {
      const finalized = finalizeCard(state);
      const newCard = createCard(header.name, header.variant);
      if (header.number !== null) {
        newCard.number = header.number;
      }
      return { ...finalized, currentCard: newCard };
    }

    // Add item to current card
    if (state.currentCard && indent >= INDENT.TOP_LEVEL) {
      return {
        ...state,
        currentCard: { ...state.currentCard, items: [...state.currentCard.items, content] },
      };
    }

    return state;
  }, initialState);

  const { cards } = finalizeCard(finalState);
  return { cards };
}

// Export createCard for use by composite parser
parseCards.createCard = createCard;

module.exports = parseCards;
