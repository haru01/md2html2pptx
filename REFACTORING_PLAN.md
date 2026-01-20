# リファクタリング計画

## 実施状況

| # | 項目 | 状態 |
|---|------|------|
| 1 | パス解決関数の統合 | ✅ 完了 |
| 2 | カードマッチャーの抽象化 | ✅ 完了 |
| 3 | 複合アイテム解析の改善 | ✅ 完了 |
| 4 | グリッドレイアウト整理 | ✅ 完了 |
| 5 | スタイルビルダーの関数化 | ✅ 完了 |

## 概要

重複コードを削減し、関数型プログラミングパターンを適用して可読性と保守性を向上させる。

**推定削減行数**: 約200行（全体の5%）

---

## 1. パス解決関数の統合

### 対象ファイル
- `assets/to_html.js` (lines 23-36, 70-82)
- `assets/to_pptx.js` (lines 22-35)

### 現状の問題
3つのほぼ同一の関数が存在:
- `resolveMd2html()`
- `resolveThemeCss()`
- `resolveHtml2pptx()`

### リファクタリング案

**新規ファイル**: `assets/utils/resolve.js`

```javascript
const fs = require('fs');
const path = require('path');

/**
 * 高階関数: パス解決関数を生成
 * @param {string} envVar - 環境変数名
 * @param {string[]} fallbackPaths - フォールバックパス配列
 * @param {string|null} errorMsg - 見つからない場合のエラーメッセージ (nullなら例外なし)
 * @returns {() => string|null}
 */
const createResolver = (envVar, fallbackPaths, errorMsg = null) => () => {
  const candidates = [process.env[envVar], ...fallbackPaths].filter(Boolean);
  const found = candidates.find(fs.existsSync);
  if (!found && errorMsg) throw new Error(errorMsg);
  return found || null;
};

module.exports = { createResolver };
```

**使用例**:
```javascript
const { createResolver } = require('./utils/resolve');

const resolveMd2html = createResolver(
  'MD2HTML_PATH',
  [path.join(process.cwd(), 'md2html'), path.join(__dirname, 'md2html')],
  'md2html not found. Set MD2HTML_PATH or copy md2html to project.'
);

const resolveThemeCss = createResolver(
  null,
  [path.join(process.cwd(), 'theme.css'), path.join(__dirname, 'html2pptx/playwright/theme.css')],
  null // エラーなし
);
```

**削減効果**: 約40行

---

## 2. カードマッチャーの抽象化

### 対象ファイル
- `assets/md2html/parser.js` (lines 737-797)

### 現状の問題
4種類のカードパターン（card, step, good, bad）で同一のロジックが繰り返し:
1. パターンマッチ
2. 新グループ開始判定
3. カード作成・追加

### リファクタリング案

**宣言的なマッチャー定義**:

```javascript
/**
 * カードマッチャー定義
 */
const CARD_MATCHERS = [
  {
    pattern: PATTERNS.card,
    variant: 'normal',
    getName: (match) => match[2].trim(),
    shouldStartNewGroup: (cards) => cards.every(c => c.variant === 'step')
  },
  {
    pattern: PATTERNS.step,
    variant: 'step',
    getName: (match) => match[2].trim(),
    getNumber: (match) => parseInt(match[1], 10),
    shouldStartNewGroup: (cards) => cards.some(c => c.variant !== 'step')
  },
  {
    pattern: PATTERNS.good,
    variant: 'good',
    getName: (match) => match[1].trim(),
    shouldStartNewGroup: () => false
  },
  {
    pattern: PATTERNS.bad,
    variant: 'bad',
    getName: (match) => match[1].trim(),
    shouldStartNewGroup: () => false
  }
];

/**
 * コンテンツに対してカードマッチャーを適用
 * @param {string} content - マッチ対象の文字列
 * @returns {{matcher: Object, match: RegExpMatchArray}|null}
 */
const findCardMatch = (content) => {
  for (const matcher of CARD_MATCHERS) {
    const match = content.match(matcher.pattern);
    if (match) return { matcher, match };
  }
  return null;
};

/**
 * カードマッチ結果を処理してカードを作成
 * @param {{matcher: Object, match: RegExpMatchArray}} result
 * @param {Object} state - 現在の状態
 * @returns {Object} - 新しい状態
 */
const processCardMatch = (result, state) => {
  const { matcher, match } = result;
  const { currentItem, currentCard } = state;

  const hasIncompatibleGroup = currentItem?.type === 'cards' &&
    currentItem.cards.length > 0 &&
    matcher.shouldStartNewGroup(currentItem.cards);

  const needNewGroup = !currentItem || currentItem.type !== 'cards' || hasIncompatibleGroup;

  const newCard = createCard(matcher.getName(match), matcher.variant);
  if (matcher.getNumber) newCard.number = matcher.getNumber(match);

  if (needNewGroup) {
    return {
      ...state,
      savedItem: currentItem,
      currentItem: { type: 'cards', cards: currentCard ? [currentCard] : [] },
      currentCard: newCard
    };
  }

  return {
    ...state,
    currentItem: currentCard
      ? { ...currentItem, cards: [...currentItem.cards, currentCard] }
      : currentItem,
    currentCard: newCard
  };
};
```

**削減効果**: 約50行

---

## 3. 複合アイテム解析のReduce化

### 対象ファイル
- `assets/md2html/parser.js` (lines 590-827)

### 現状の問題
237行の命令型ループ:
- `while`ループでインデックスを手動管理
- 複数の状態変数（`currentItem`, `currentCard`, `inCodeBlock`など）
- ネストした条件分岐

### リファクタリング案

**状態オブジェクトとハンドラー関数の分離**:

```javascript
/**
 * 複合アイテム解析の初期状態
 */
const createInitialState = (baseIndent, depth) => ({
  items: [],
  currentItem: null,
  currentCard: null,
  currentContentItem: null,
  inCodeBlock: false,
  codeBlockLang: '',
  codeBlockLines: [],
  baseIndent,
  depth,
  done: false
});

/**
 * 行の種類を判定
 */
const classifyLine = (line, state) => {
  const trimmed = line.trim();

  if (PATTERNS.slideHeader.test(trimmed)) return { type: 'SLIDE_HEADER' };
  if (PATTERNS.codeBlockMarker.test(trimmed)) return { type: 'CODE_MARKER', lang: trimmed.slice(3).trim() };
  if (state.inCodeBlock) return { type: 'CODE_LINE', line };
  if (PATTERNS.tableRow.test(trimmed)) return { type: 'TABLE_ROW', trimmed };
  if (!trimmed) return { type: 'EMPTY' };

  const indentMatch = line.match(PATTERNS.listItem);
  if (!indentMatch) return { type: 'UNKNOWN' };

  return {
    type: 'LIST_ITEM',
    indent: indentMatch[1].length,
    content: indentMatch[2]
  };
};

/**
 * 行タイプ別のハンドラーマップ
 */
const lineHandlers = {
  SLIDE_HEADER: (state) => ({ ...state, done: true }),
  CODE_MARKER: (state, info) => handleCodeMarker(state, info),
  CODE_LINE: (state, info) => ({ ...state, codeBlockLines: [...state.codeBlockLines, info.line] }),
  TABLE_ROW: (state, info) => handleTableRow(state, info),
  EMPTY: (state) => state,
  UNKNOWN: (state) => state,
  LIST_ITEM: (state, info) => handleListItem(state, info)
};

/**
 * 複合アイテムを関数型で解析
 */
const parseCompositeItemsFunctional = (lines, startIndex, baseIndent, depth = 0) => {
  const initialState = createInitialState(baseIndent, depth);

  const finalState = lines.slice(startIndex).reduce((state, line, idx) => {
    if (state.done) return state;

    const lineInfo = classifyLine(line, state);
    const handler = lineHandlers[lineInfo.type];

    return handler ? handler(state, lineInfo, lines, startIndex + idx) : state;
  }, initialState);

  // 最終アイテムを保存
  const result = finalizeState(finalState);
  return { items: result.items, endIndex: startIndex + lines.slice(startIndex).length };
};
```

**削減効果**: 約100行（リファクタリング後は約140行）

---

## 4. グリッドレイアウト条件分岐の整理

### 対象ファイル
- `assets/md2html/templates.js` (lines 1091-1539)

### 現状の問題
449行のモノリシックな関数:
- スタイル計算、CSS生成、HTML生成が混在
- 類似のセルレンダリングロジックが複数箇所に

### リファクタリング案

**関心の分離**:

```javascript
/**
 * グリッドサイズに基づくスタイル計算
 */
const calculateGridStyles = (rows, cols, items) => {
  const gridSize = Math.max(rows, cols);
  const maxCardsInCell = items.reduce((max, item) =>
    item.type === 'cards' && item.cards ? Math.max(max, item.cards.length) : max, 1);

  const scaleFactor = Math.max(
    maxCardsInCell > 1 ? Math.min(maxCardsInCell, 2) : 0,
    gridSize <= 2 ? 0 : gridSize - 2
  );

  return {
    gap: Math.max(4, 16 - scaleFactor * 2),
    padding: Math.max(6, 16 - scaleFactor * 2),
    titleFontSize: Math.max(14, 24 - scaleFactor * 3),
    itemFontSize: Math.max(14, 24 - scaleFactor * 3),
    codeFontSize: Math.max(11, Math.round((24 - scaleFactor * 3) * 0.75)),
    borderRadius: Math.max(4, 12 - scaleFactor),
    headerMargin: Math.max(2, 10 - scaleFactor),
    containerWidth: 840,
    containerHeight: rows >= 5 ? 400 : 380
  };
};

/**
 * セルタイプ別レンダラー
 */
const cellRenderers = {
  cards: (item, styles) => renderCardsCell(item, styles),
  bulletList: (item, styles) => renderBulletListCell(item, styles),
  code: (item, styles) => renderCodeCell(item, styles),
  table: (item, styles) => renderTableCell(item, styles),
  flow: (item, styles) => renderFlowCell(item, styles),
  composite: (item, styles, rows, cols) => renderNestedCell(item, styles, rows, cols),
  empty: () => '      <div class="grid-cell"></div>'
};

/**
 * アイテムをセルHTMLにレンダリング
 */
const renderCell = (item, styles, rows, cols) => {
  const renderer = cellRenderers[item?.type] || cellRenderers.empty;
  return renderer(item, styles, rows, cols);
};

/**
 * グリッドCSSを生成
 */
const generateGridCss = (styles, rows, cols) => {
  // 共通スタイルを一箇所で定義
  return `
    .grid-container { ... }
    .grid-cell { ... }
    ...
  `;
};

/**
 * グリッドスライドを生成（リファクタリング後）
 */
const generateCompositeGrid = (slide, items, rows, cols) => {
  const styles = calculateGridStyles(rows, cols, items);
  const expandedItems = expandItemsForGrid(items, rows * cols);

  const css = generateGridCss(styles, rows, cols);
  const cellsHtml = expandedItems
    .slice(0, rows * cols)
    .map(item => renderCell(item, styles, rows, cols))
    .join('\n');

  return wrapWithBase(css, generateGridBody(slide, cellsHtml, styles));
};
```

**削減効果**: 約200行（構造化により可読性向上）

---

## 5. スタイルビルダーの関数化

### 対象ファイル
- `assets/md2html/templates.js` (複数箇所)

### 現状の問題
各ジェネレーター関数でスタイル文字列を条件付きで連結:
```javascript
const codeBlockStyles = hasCodeBlock ? `...` : '';
const variantStyles = hasVariants ? `...` : '';
const style = `${base}${codeBlockStyles}${variantStyles}`;
```

### リファクタリング案

**条件付きスタイル合成ユーティリティ**:

```javascript
/**
 * 条件付きスタイルブロックを合成
 * @param {Object.<string, boolean>} conditions - スタイル名とその適用条件
 * @param {Object.<string, string>} styleBlocks - スタイル名とCSS文字列
 * @returns {string}
 */
const buildStyles = (conditions, styleBlocks) =>
  Object.entries(conditions)
    .filter(([_, shouldInclude]) => shouldInclude)
    .map(([key]) => styleBlocks[key] || '')
    .join('');

// カードスライドのスタイルブロック定義
const CARD_STYLE_BLOCKS = {
  codeBlock: `
    .card-code { ... }
    ...
  `,
  variants: `
    .card-good { ... }
    .card-bad { ... }
    ...
  `,
  steps: `
    .card-step { ... }
    ...
  `
};

// 使用例
const generateCardsSlide = (slide) => {
  const cards = slide.cards || [];
  const hasCodeBlock = cards.some(c => c.codeBlock);
  const hasVariants = cards.some(c => c.variant === 'good' || c.variant === 'bad');
  const hasSteps = cards.some(c => c.variant === 'step');

  const conditionalStyles = buildStyles(
    { codeBlock: hasCodeBlock, variants: hasVariants, steps: hasSteps },
    CARD_STYLE_BLOCKS
  );

  const style = `${baseCardStyle}${conditionalStyles}`;
  // ...
};
```

**削減効果**: 約60行

---

## 6. スライドタイプのディスパッチマップ化

### 対象ファイル
- `assets/md2html/templates.js` (lines 1657-1675)

### 現状の問題
```javascript
switch (slide.type) {
  case 'title': return generateTitleSlide(slide);
  case 'composite': return generateCompositeSlide(slide);
  // ...
}
```

### リファクタリング案

```javascript
/**
 * スライドタイプ別ジェネレーターマップ
 */
const SLIDE_GENERATORS = {
  title: generateTitleSlide,
  composite: generateCompositeSlide,
  cards: generateCardsSlide,
  table: generateTableSlide,
  flow: generateFlowSlide,
  code: generateCodeSlide
};

/**
 * スライドHTMLを生成
 */
const generateSlideHtml = (slide) =>
  (SLIDE_GENERATORS[slide.type] || generateContentSlide)(slide);
```

**削減効果**: 約10行

---

## 実装順序

1. **パス解決関数の統合** (低リスク、高効果)
2. **スライドタイプのディスパッチマップ化** (低リスク、低工数)
3. **カードマッチャーの抽象化** (中リスク、中工数)
4. **スタイルビルダーの関数化** (中リスク、中工数)
5. **グリッドレイアウト条件分岐の整理** (高リスク、高工数)
6. **複合アイテム解析のReduce化** (高リスク、高工数)

---

## テスト戦略

各リファクタリング後に以下を確認:
1. `node to_html.js 1_mds/sample.md` でHTML生成が正常に動作
2. `node to_pptx.js` でPPTX生成が正常に動作
3. 生成されたHTMLの視覚的な確認（preview.jsで確認）

---

## 注意事項

- 既存のAPIインターフェースは維持（`generateSlideHtml`, `parseMarkdown`など）
- テーマ設定機能は変更なし
- 段階的にリファクタリングし、各ステップで動作確認
