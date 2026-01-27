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

  const finalizeCard = (state) =>
    state.currentCard ? { ...state, cards: [...state.cards, state.currentCard], currentCard: null } : state;

  const initialState = {
    cards: [],
    currentCard: null,
    inCodeBlock: false,
    codeBlockLang: '',
    codeBlockLines: [],
    h3Mode: false, // Track if we're in H3 card mode
    h3Variant: 'normal', // Track variant for H3 cards (normal or step)
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

    // Check for H3 card header (### Card Name)
    const h3Match = trimmed.match(PATTERNS.cardH3);
    if (h3Match && state.h3Mode) {
      const finalized = finalizeCard(state);
      const newCard = createCard(h3Match[1].trim(), state.h3Variant);
      // Add step number for step variant
      if (state.h3Variant === 'step') {
        newCard.number = finalized.cards.filter(c => c.variant === 'step').length + 1;
      }
      return { ...finalized, currentCard: newCard, h3Mode: true, h3Variant: state.h3Variant };
    }

    // Parse list items
    const match = line.match(PATTERNS.listItem);
    if (!match) return state;
    const [, spaces, content] = match;
    const indent = spaces.length;

    if (isMetadata(content)) return state;

    // Check for card trigger (- !カード:)
    if (PATTERNS.cardTrigger.test(content)) {
      return { ...state, h3Mode: true, h3Variant: 'normal' };
    }

    // Check for step trigger (- !ステップ:)
    if (PATTERNS.step.test(content)) {
      return { ...state, h3Mode: true, h3Variant: 'step' };
    }

    // Check for good trigger (- !Good:)
    if (PATTERNS.good.test(content)) {
      return { ...state, h3Mode: true, h3Variant: 'good' };
    }

    // Check for bad trigger (- !Bad:)
    if (PATTERNS.bad.test(content)) {
      return { ...state, h3Mode: true, h3Variant: 'bad' };
    }

    // Add item to current card
    const acceptItem = state.currentCard; // H3モードが常にアクティブなため
    if (acceptItem) {
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
