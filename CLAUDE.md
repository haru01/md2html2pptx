# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a Claude Code skill that converts Markdown to HTML slides, then to PowerPoint presentations. The workflow is:

1. **Markdown → Structured Data**: `md2html/parser.js` parses custom markdown syntax into slide definitions
2. **Structured Data → HTML**: `md2html/templates.js` generates HTML slides with strict layout constraints
3. **HTML → PPTX**: `html2pptx/index.mjs` uses Playwright to render HTML and pptxgenjs to create PowerPoint

## Build Commands

Run these from the `assets/` directory:

```bash
npm run to_html -- 1_mds/sample.md   # Markdown → HTML slides
npm run preview                       # Open browser preview with validation
npm run to_pptx                       # HTML → PowerPoint (all slides)
npm run to_pptx -- part1              # HTML → PowerPoint (filtered)
npm run clean_dev                     # Rebuild all HTML and preview
```

## Running Tests

Tests use Vitest and are located in `assets/__tests__/`:

```bash
cd assets && npx vitest              # Run all tests (watch mode)
cd assets && npx vitest run          # Single run
```

## Architecture

### Core Pipeline

```
1_mds/*.md → parser.js → SlideDefinition[] → templates.js → 2_htmls/*.html → html2pptx → 3_pptxs/*.pptx
```

### Key Files

- `assets/md2html/parser.js` - Markdown parser with type definitions for all slide types (title, bulletList, cards, table, flow, code, composite)
- `assets/md2html/templates.js` - HTML template generator, handles theming and code highlighting
- `assets/html2pptx/index.mjs` - Main conversion library using Playwright for DOM extraction
- `assets/to_html.js`, `assets/preview.js`, `assets/to_pptx.js` - CLI entry points

### Slide Types

The parser detects slide types from markdown patterns:
- `## PART N: Title` → title slide
- `- カードN:` / `- ステップN:` / `- Good:` / `- Bad:` → cards
- `- 複合: N:M` → composite (grid layout)
- `- リスト:` → bulletList
- `- テーブル:` → table
- `- フロー:` → flow
- `- リーンキャンバス:` → leanCanvas (9-box business model canvas)
- `## ジャベリンボード: タイトル` → javelinBoard (hypothesis validation timeline, PPTX native table)
  - 変更時は `__tests__/fixtures/inputs/javelin-board-slide.md` と `1_mds/sample.md` も更新すること
- Code fences → code

## Critical Constraints

### HTML Requirements for PPTX Conversion

- **Slide size**: 960px × 540px (16:9 aspect ratio)
- **Text wrapping**: All text must be in `<p>`, `<h1>`-`<h6>`, `<ul>`, `<ol>` - raw text in `<div>` breaks conversion
- **No bullet prefixes in `<p>`**: Never start `<p>` content with `-`, `•`, `*`
- **Flex children**: Use fixed widths (e.g., `width: 380px`) instead of percentages
- **Bottom margin**: Leave at least 0.5" margin at bottom of slide

### Parser Conventions

- Mermaid blocks are parsed as `type: 'code'` with `language: 'mermaid'` - templates.js handles rendering method
- Composite slides support up to 3 levels of nesting (`MAX_COMPOSITE_DEPTH = 3`)
- Card variants: `normal`, `good`, `bad`, `step` - determined by markdown prefix

### Testing

Tests validate PPTX XML structure using JSZip. Key assertions check:
- Required PPTX structure files exist
- Slide XML contains expected text elements
- Shape counts match expected layout

## Debugging

```bash
HTML2PPTX_DEBUG=always npm run to_pptx  # Pause browser for inspection
HTML2PPTX_DEBUG=error npm run to_pptx   # Pause only on validation errors
```

Preview validation panel (`V` key) checks:
- Overflow detection
- Text wrapping violations
- Invalid bullet prefixes
- Style placement issues
