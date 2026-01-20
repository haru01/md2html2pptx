# md2html2pptx

Markdown → HTML → PowerPoint 変換ツール

## インストール

このスキルをAIコーディングアシスタントで使用するには、以下の場所に配置してください:

| ツール | 配置先 |
|--------|--------|
| **Claude Code** | `~/.claude/skills/md2html2pptx/`（グローバル） |
| **GitHub Copilot** |  |
| **Codex CLI** |  |
| **Cursor** |  |

```bash
# Claude Code (グローバル)
mkdir -p ~/.claude/skills
cp -r md2html2pptx ~/.claude/skills/
```

## クイックスタート

### 1. セットアップ

```
/md2html2pptx setup
```

これで以下が自動的に行われます:
- フォルダ作成 (`1_mds/`, `2_htmls/`, `3_pptxs/`)
- `package.json` 生成
- 依存パッケージのインストール

### 2. Markdownを書く

`1_mds/` フォルダにMarkdownファイルを作成:

```markdown
## タイトルスライド
- PART 1
- プレゼンテーション入門
- 副題: サブタイトル

## 1.1: 概要
- リスト:
  - ポイント1
  - ポイント2
  - ポイント3

## 1.2: 3つの機能
- カード1: 機能A
  - 説明1
  - 説明2
- カード2: 機能B
  - 説明1
  - 説明2
- カード3: 機能C
  - 説明1
  - 説明2
```

### 3. HTMLスライドを生成

```
/md2html2pptx to_html 1_mds/example.md
```

内部で以下のコマンドが実行されます:
```bash
npm run to_html -- 1_mds/example.md
```

### 4. プレビュー

```
/md2html2pptx preview
```

内部で以下のコマンドが実行されます:
```bash
npm run preview
```

ブラウザでスライドを確認。矢印キーでページ送り。

### 5. PowerPointを生成

```
/md2html2pptx to_pptx
```

`3_pptxs/presentation.pptx` が生成されます。

## コマンド一覧

| コマンド | 説明 |
|----------|------|
| `/md2html2pptx setup` | 初期セットアップ |
| `/md2html2pptx to_html <file>` | MarkdownからHTMLスライドを生成 |
| `/md2html2pptx preview` | ブラウザでプレビュー |
| `/md2html2pptx to_pptx [filter]` | HTMLからPowerPointを生成 |

## Markdown記法

| 記法 | 説明 |
|------|------|
| `## セクション: タイトル` | スライド定義（例: `## 1.1: 概要`） |
| `## タイトル` | タイトルスライド（セクション番号なし） |
| `- PART N` | タイトルスライドのパート番号 |
| `- リスト:` + 子項目 | 箇条書きリスト |
| `- カードN: 名前` + 子項目 | カードレイアウト |
| `- ステップN: ラベル` + 子項目 | ステップ形式 |
| `- テーブル:` + マークダウン表 | 比較表 |
| `- フロー:` + 子項目 | フロー図 |

## スライドタイプ

| タイプ | トリガー | 説明 |
|-------|---------|------|
| `title` | `- PART N` | ダーク背景のタイトルスライド |
| `content` | `- リスト:` | 箇条書きリスト |
| `cards` | `- カードN:` | カードレイアウト（自動幅計算） |
| `steps` | `- ステップN:` | ステップ形式（番号付き） |
| `table` | マークダウンテーブル | 比較表 |
| `flow` | `- フロー:` | 横並びフロー図 |

## フォルダ構成

```
project/
├── 1_mds/    # Markdownソース
├── 2_htmls/  # 生成されたHTMLスライド
└── 3_pptxs/  # 生成されたPowerPoint
```

## Tips

- Markdown記法に従えば決定論的にHTMLが生成される
- HTMLは960x540px（16:9）で設計されている
- 複数パートに分けて生成可能: `/md2html2pptx to_pptx part1`
- 生成後のHTMLは手動編集も可能
