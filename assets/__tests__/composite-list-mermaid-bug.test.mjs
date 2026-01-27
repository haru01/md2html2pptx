/**
 * Reproduction test for composite slide with bulletList (H3) and Mermaid bug
 *
 * Bug: When a composite slide contains a bulletList with H3 headings and a Mermaid diagram,
 * the bulletList is completely missing from the parsed output.
 *
 * Root cause: In parseCompositeItems (composite.js), H3 headers (### xxx) are not list items,
 * so they don't match PATTERNS.listItem. The parser skips them at line 297-301:
 *
 *   const indentMatch = line.match(PATTERNS.listItem);
 *   if (!indentMatch) {
 *     i++;
 *     continue;
 *   }
 *
 * H3 headers are only processed for 'cards' type (line 278-294), but not for 'bulletList'.
 * This causes the bulletList structure to be incomplete and get dropped.
 */

import { describe, test, expect } from 'vitest';
import { parseMarkdown } from '../md2html/parser/index.js';

describe('Composite slide with bulletList (H3) and Mermaid - Bug reproduction', () => {
  test('should parse both bulletList and Mermaid items', () => {
    const markdown = `## 3.2: リストとMermaid
- !複合: 1:2

- !リスト:
### システム構成の概要
- フロントエンド
- バックエンド
- データベース
### 各層の役割
- UIの提供
- ビジネスロジック
- データ永続化

- !Mermaid:
\`\`\`mermaid
flowchart TD
    A[フロントエンド] --> B[バックエンド]
    B --> C[(データベース)]
    B --> D[外部API]
\`\`\`
`;

    const slides = parseMarkdown(markdown);

    expect(slides).toHaveLength(1);

    const slide = slides[0];
    expect(slide.type).toBe('composite');
    expect(slide.compositeLayout).toEqual({ rows: 1, cols: 2 });
    expect(slide.compositeItems).toBeDefined();

    // BUG: Currently only 1 item (Mermaid) is parsed, bulletList is missing
    // Expected: 2 items (bulletList + Mermaid)
    console.log('Actual compositeItems count:', slide.compositeItems.length);
    console.log('Actual items:', JSON.stringify(slide.compositeItems.map(i => ({ type: i.type })), null, 2));

    // This assertion FAILS due to the bug
    expect(slide.compositeItems).toHaveLength(2);

    // Verify bulletList item
    const bulletListItem = slide.compositeItems.find(item => item.type === 'bulletList');
    expect(bulletListItem).toBeDefined();
    expect(bulletListItem.items).toBeDefined();
    expect(bulletListItem.items.length).toBeGreaterThan(0);

    // Check H3 headings are present
    const hasH3 = bulletListItem.items.some(item =>
      item.text === 'システム構成の概要' || item.text === '各層の役割'
    );
    expect(hasH3).toBe(true);

    // Verify Mermaid item
    const mermaidItem = slide.compositeItems.find(item =>
      item.type === 'code' && item.codeBlock?.language === 'mermaid'
    );
    expect(mermaidItem).toBeDefined();
    expect(mermaidItem.codeBlock.code).toContain('flowchart TD');
  });

  test('should handle bulletList with H3 in standalone slide', () => {
    // This should work as a baseline comparison
    const markdown = `## リストのみ
- !リスト:
### セクション1
- 項目1
- 項目2
### セクション2
- 項目3
- 項目4
`;

    const slides = parseMarkdown(markdown);
    expect(slides).toHaveLength(1);

    const slide = slides[0];
    expect(slide.type).toBe('bulletList');
    expect(slide.items).toBeDefined();
    expect(slide.items.length).toBeGreaterThan(0);
  });
});
