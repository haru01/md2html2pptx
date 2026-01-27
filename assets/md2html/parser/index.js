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
 * @returns {{number: number, name: string, section?: string, title?: string, partNumber?: number, mainTitle?: string, isJavelinBoardHeader?: boolean}}
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

  // Check for javelin board header: ## ジャベリンボード: タイトル or ## シャベリボード: タイトル
  const javelinBoardMatch = header.match(PATTERNS.javelinBoardHeader);
  if (javelinBoardMatch) {
    return {
      number: index + 1,
      name: javelinBoardMatch[1].trim(),
      title: javelinBoardMatch[1].trim(),
      isJavelinBoardHeader: true,
    };
  }

  // Check for lean canvas header: ## リーンキャンバス: タイトル
  const leanCanvasMatch = header.match(PATTERNS.leanCanvasHeader);
  if (leanCanvasMatch) {
    return {
      number: index + 1,
      name: leanCanvasMatch[1].trim(),
      title: leanCanvasMatch[1].trim(),
      isLeanCanvasHeader: true,
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
    if (PATTERNS.barChart.test(content)) return 'barChart';
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
 * Maximum experiments per javelin board slide
 */
const JAVELIN_BOARD_MAX_EXPERIMENTS = 4;

/**
 * Split javelin board slide into multiple slides if experiments exceed max
 * @param {object} slide - Slide definition with javelinBoardData
 * @returns {object[]} - Array of slide definitions (1 or more)
 */
function splitJavelinBoardSlide(slide) {
  const experiments = slide.javelinBoardData?.experiments || [];
  if (experiments.length <= JAVELIN_BOARD_MAX_EXPERIMENTS) {
    return [slide];
  }

  const slides = [];
  const totalPages = Math.ceil(experiments.length / JAVELIN_BOARD_MAX_EXPERIMENTS);

  for (let page = 0; page < totalPages; page++) {
    const startIdx = page * JAVELIN_BOARD_MAX_EXPERIMENTS;
    const pageExperiments = experiments.slice(startIdx, startIdx + JAVELIN_BOARD_MAX_EXPERIMENTS);
    const pageTitle = `${slide.title || slide.name} (${page + 1}/${totalPages})`;

    slides.push({
      ...slide,
      title: pageTitle,
      name: pageTitle,
      javelinBoardData: {
        experiments: pageExperiments,
      },
    });
  }

  return slides;
}

/**
 * Parse markdown content into slide definitions
 * @param {string} markdown - Markdown content
 * @returns {import('../types').SlideDefinition[]}
 */
function parseMarkdown(markdown) {
  const lines = markdown.split('\n');
  const chunks = splitBySlideHeaders(lines);

  const rawSlides = chunks.map((chunk, index) => {
    const base = parseSlideHeader(chunk.header, index);
    // Title slide is determined by header pattern (## PART N:メインタイトル)
    // Javelin board can be determined by header pattern (## ジャベリンボード: タイトル)
    // Lean canvas can be determined by header pattern (## リーンキャンバス: タイトル)
    let type;
    if (base.partNumber !== undefined) {
      type = 'title';
    } else if (base.isJavelinBoardHeader) {
      type = 'javelinBoard';
    } else if (base.isLeanCanvasHeader) {
      type = 'leanCanvas';
    } else {
      type = detectSlideType(chunk.bodyLines);
    }
    const metadata = parseSlideMetadata(chunk.bodyLines);
    const content = slideParsers[type]?.(chunk.bodyLines, base) ?? {};

    return { ...base, type, ...metadata, ...content };
  });

  // Split javelin board slides if needed and renumber all slides
  const slides = rawSlides.flatMap((slide) => {
    if (slide.type === 'javelinBoard') {
      return splitJavelinBoardSlide(slide);
    }
    return [slide];
  });

  // Renumber slides after splitting
  return slides.map((slide, index) => ({
    ...slide,
    number: index + 1,
  }));
}

module.exports = { parseMarkdown };
