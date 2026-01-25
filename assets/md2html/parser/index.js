/**
 * Markdown Parser for md2html
 * Parses markdown slide definitions into structured data
 */

const { PATTERNS } = require('../constants');
const slideParsers = require('./slide-parsers');
const { matchElementType } = require('./composite');

/**
 * Split markdown into slide chunks by ## headers
 * @param {string[]} lines
 * @returns {{header: string, bodyLines: string[]}[]}
 */
function splitBySlideHeaders(lines) {
  const chunks = [];
  let currentChunk = null;
  let inCodeBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Track code fence boundaries
    if (PATTERNS.codeBlockMarker.test(trimmed)) {
      inCodeBlock = !inCodeBlock;
    }

    if (!inCodeBlock && PATTERNS.slideHeader.test(trimmed)) {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = { header: trimmed, bodyLines: [] };
    } else if (currentChunk) {
      currentChunk.bodyLines.push(line);
    }
  }
  if (currentChunk) chunks.push(currentChunk);
  return chunks;
}

/**
 * Parse slide header to extract number, section, and title
 * @param {string} header
 * @param {number} index - 0-based chunk index
 * @returns {{number: number, name: string, section?: string, title?: string, partNumber?: number, mainTitle?: string}}
 */
function parseSlideHeader(header, index) {
  // Check for title slide header: ## PART N:メインタイトル
  const titleSlideMatch = header.match(PATTERNS.titleSlideHeader);
  if (titleSlideMatch) {
    const partNumber = parseInt(titleSlideMatch[1], 10);
    const mainTitle = titleSlideMatch[2].trim();
    return {
      number: index + 1,
      name: mainTitle,
      partNumber,
      mainTitle,
    };
  }

  const numberedMatch = header.match(PATTERNS.slideNumbered);
  if (numberedMatch) {
    const sectionStr = numberedMatch[1];
    const titleStr = numberedMatch[2].trim();
    return {
      number: index + 1,
      name: titleStr,
      section: sectionStr,
      title: titleStr,
    };
  }
  const simpleMatch = header.match(PATTERNS.slideSimple);
  return { number: index + 1, name: simpleMatch ? simpleMatch[1].trim() : '' };
}

/**
 * Detect slide type from body lines
 * @param {string[]} bodyLines
 * @returns {string}
 */
function detectSlideType(bodyLines) {
  let hasCards = false;
  let hasOtherElement = false;

  for (const line of bodyLines) {
    const match = line.match(PATTERNS.listItem);
    if (!match) continue;
    const content = match[2];

    if (PATTERNS.leanCanvas.test(content)) return 'leanCanvas';
    if (PATTERNS.javelinBoard.test(content)) return 'javelinBoard';
    if (PATTERNS.composite.test(content)) return 'composite';
    if (PATTERNS.part.test(content)) return 'title';

    // Track cards and other element types at top level (indent=0)
    const indent = match[1].length;
    if (indent === 0) {
      if (
        PATTERNS.card.test(content) ||
        PATTERNS.good.test(content) ||
        PATTERNS.bad.test(content) ||
        PATTERNS.step.test(content)
      ) {
        hasCards = true;
      } else if (matchElementType(content)) {
        hasOtherElement = true;
      }
    }

    if (PATTERNS.table.test(content)) {
      if (hasCards) return 'composite';
      return 'table';
    }
    if (PATTERNS.flow.test(content)) {
      if (hasCards) return 'composite';
      return 'flow';
    }
  }

  // Cards mixed with other element types → treat as composite
  if (hasCards && hasOtherElement) return 'composite';
  if (hasCards) return 'cards';

  // Check for inline table
  if (bodyLines.some((l) => PATTERNS.tableRow.test(l.trim()))) return 'table';
  // Check for code block
  if (bodyLines.some((l) => PATTERNS.codeBlockMarker.test(l.trim()))) return 'code';
  return 'bulletList';
}

/**
 * Parse section and title metadata from body lines (pure function)
 * @param {string[]} bodyLines
 * @returns {{section?: string, title?: string, subtitle?: string, layout?: 'horizontal'|'vertical'}}
 */
function parseSlideMetadata(bodyLines) {
  const result = {};

  for (const line of bodyLines) {
    const match = line.match(PATTERNS.listItem);
    if (!match) continue;
    const content = match[2];

    const sectionMatch = content.match(PATTERNS.section);
    if (sectionMatch) {
      result.section = sectionMatch[1].trim();
      continue;
    }

    const titleMatch = content.match(PATTERNS.title);
    if (titleMatch) {
      result.title = titleMatch[1].trim();
      continue;
    }

    const subtitleMatch = content.match(PATTERNS.subtitle);
    if (subtitleMatch) {
      result.subtitle = subtitleMatch[1].trim();
      continue;
    }

    const layoutMatch = content.match(PATTERNS.layout);
    if (layoutMatch) {
      const layoutValue = layoutMatch[1].trim().toLowerCase();
      if (layoutValue === 'vertical' || layoutValue === 'horizontal') {
        result.layout = layoutValue;
      }
    }
  }

  return result;
}

/**
 * Parse markdown content into slide definitions
 * @param {string} markdown - Markdown content
 * @returns {import('../types').SlideDefinition[]}
 */
function parseMarkdown(markdown) {
  const lines = markdown.split('\n');
  const chunks = splitBySlideHeaders(lines);

  return chunks.map((chunk, index) => {
    const base = parseSlideHeader(chunk.header, index);
    // Title slide is determined by header pattern (## PART N:メインタイトル)
    const type = base.partNumber !== undefined ? 'title' : detectSlideType(chunk.bodyLines);
    const metadata = parseSlideMetadata(chunk.bodyLines);
    const content = slideParsers[type]?.(chunk.bodyLines, base) ?? {};

    return { ...base, type, ...metadata, ...content };
  });
}

module.exports = { parseMarkdown };
