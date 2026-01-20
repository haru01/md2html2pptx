---
name: md2html2pptx
description: Markdown to HTML to PowerPoint presentation converter using html2pptx library. Use when creating slide presentations from markdown content, generating HTML slides with strict layout constraints for PPTX conversion, or building PowerPoint files from HTML templates. Triggers on requests to create presentations, slides, PPTX files, or convert markdown to slides.
---

# md2html2pptx

Convert Markdown content to HTML slides, then to PowerPoint presentations.

## Project Setup

### Minimal Setup (No Copy Required)

スキルのassetsを直接参照して動作:

```bash
# Create project structure
mkdir -p 1_mds 2_htmls 3_pptxs

# Create minimal package.json
cat > package.json << 'EOF'
{
  "scripts": {
    "to_html": "node <skill-path>/assets/to_html.js",
    "preview": "node <skill-path>/assets/preview.js",
    "to_pptx": "NODE_PATH=$PWD/node_modules node <skill-path>/assets/to_pptx.js"
  },
  "dependencies": { "playwright": "^1.40.0", "pptxgenjs": "^3.12.0", "sharp": "^0.34.5" }
}
EOF

# Install
npm install
npx playwright install chromium
```

### Full Setup (Copy to Project)

プロジェクトに全ファイルをコピー:

```bash
cp -r <skill-path>/assets/html2pptx ./
cp -r <skill-path>/assets/md2html ./
cp <skill-path>/assets/package.json ./
cp <skill-path>/assets/to_html.js ./
cp <skill-path>/assets/preview.js ./
cp <skill-path>/assets/to_pptx.js ./
mkdir -p 1_mds 2_htmls 3_pptxs
npm install
npx playwright install chromium
```

## Workflow

1. **Markdown → HTML**: Generate HTML slides from markdown in `1_mds/`
2. **Preview**: View slides in browser to verify layout
3. **HTML → PPTX**: Convert HTML slides to PowerPoint

## Slash Commands

| Command | Description |
|---------|-------------|
| `/md2html2pptx setup` | Initial project setup (see [setup.md](scripts/setup.md)) |
| `/md2html2pptx to_html <file>` | Generate HTML slides from markdown (see [to_html.md](scripts/to_html.md)) |
| `/md2html2pptx preview` | Preview slides in browser with validation (see [preview.md](scripts/preview.md)) |
| `/md2html2pptx to_pptx [filter]` | Build PPTX from HTML slides (see [to_pptx.md](scripts/to_pptx.md)) |

## Setup Instructions

`/md2html2pptx setup` を実行すると以下を行う:

1. フォルダ作成: `mkdir -p 1_mds 2_htmls 3_pptxs`
2. サンプルファイルをコピー: `cp <skill-path>/assets/1_mds/sample.md 1_mds/sample.md`
3. package.json生成（既存の場合は依存関係を追加）
4. `npm install` 実行
5. `npx playwright install chromium` 実行
6. 使い方を表示

### セットアップ完了メッセージ

```
✅ セットアップ完了！

📁 作成されたフォルダ:
   1_mds/    - Markdownファイルを置く (sample.md をコピー済み)
   2_htmls/  - 生成されたHTMLスライド
   3_pptxs/  - 生成されたPowerPoint

🚀 使い方:
   1. /md2html2pptx to_html 1_mds/sample.md  → HTMLスライド生成
   2. /md2html2pptx preview                  → ブラウザでプレビュー
   3. /md2html2pptx to_pptx                  → PowerPoint生成
```

## Directory Structure

```
project/
├── package.json              # npm dependencies
├── 1_mds/                    # Markdown source files
├── 2_htmls/                  # HTML slide templates
└── 3_pptxs/                  # Generated PPTX files
```

## Build Commands

```bash
npm run to_html -- 1_mds/sample.md   # Markdown → HTML
npm run preview                       # Browser preview with validation
npm run preview -- part1              # Preview filtered slides
npm run to_pptx                       # HTML → PowerPoint (all)
npm run to_pptx -- part1              # HTML → PowerPoint (filtered)
```

## html2pptx Function

```javascript
const { slide, placeholders } = await html2pptx("slides/example.html", pptx);
```

Returns slide object and placeholder positions for PptxGenJS charts/tables.

## Critical Rules

- **Slide size**: 960px × 540px (16:9)
- **Text wrapping**: All text must be in `<p>`, `<h1>`-`<h6>`, `<ul>`, `<ol>`
- **No bullets in p**: Never start `<p>` with `-`, `•`, `*`
- **Flex widths**: Use fixed width (e.g., `width: 380px`) for flex children

## Troubleshooting

```bash
npm install
npx playwright install chromium
```
