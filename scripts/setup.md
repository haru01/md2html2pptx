# setup

プロジェクトの初期セットアップを行う。

## 手順

1. skills 側で依存関係インストール（初回のみ）
2. フォルダ作成
3. サンプルファイルをコピー
4. package.json生成（scriptsのみ、dependenciesなし）
5. 完了メッセージを表示

※ 利用元プロジェクトでは npm install 不要（skills 側の node_modules を使用）

## 実行内容

### 1. skills 側で依存関係インストール（初回のみ）

skills の node_modules がない場合のみ実行:

```bash
cd <skill-path> && npm install && npx playwright install chromium
```

### 2. フォルダ作成

```bash
mkdir -p 1_mds 2_htmls 3_pptxs
```

### 3. サンプルファイルをコピー

`1_mds/` にサンプルファイルをコピー（存在しない場合のみ）:

```bash
cp <skill-path>/assets/1_mds/sample.md 1_mds/sample.md
cp <skill-path>/assets/1_mds/theme.json 1_mds/theme.json
```

### 4. package.json生成

既存のpackage.jsonがない場合は新規作成。
**注意**: dependencies は含めない（skills 側の node_modules を使用）

```json
{
  "name": "md2html2pptx-project",
  "version": "1.0.0",
  "scripts": {
    "to_html": "NODE_PATH=<skill-path>/node_modules node <skill-path>/assets/to_html.js",
    "preview": "NODE_PATH=<skill-path>/node_modules node <skill-path>/assets/preview.js",
    "to_pptx": "NODE_PATH=<skill-path>/node_modules node <skill-path>/assets/to_pptx.js",
    "clean_to_html_all": "rm -rf 2_htmls/* && npm run to_html"
  }
}
```

既存のpackage.jsonがある場合は、scripts セクションに上記のスクリプトを追加（マージ）する。

### 5. 完了メッセージ

```
✅ セットアップ完了！

📁 作成されたフォルダ:
   1_mds/    - Markdownファイルを置く (sample.md をコピー済み)
   2_htmls/  - 生成されたHTMLスライド
   3_pptxs/  - 生成されたPowerPoint

🚀 使い方:
   1. npm run to_html                → HTMLスライド生成（1_mds/ 以下すべて）
   2. npm run to_html 1_mds/xxx.md   → 指定ファイルのみ変換
   3. npm run preview                → ブラウザでプレビュー
   4. npm run to_pptx                → PowerPoint生成
```

## オプション: Full Setup

プロジェクトにスキルのassetsをコピーする場合:

```bash
cp -r <skill-path>/assets/html2pptx ./
cp -r <skill-path>/assets/md2html ./
cp <skill-path>/assets/to_html.js ./
cp <skill-path>/assets/preview.js ./
cp <skill-path>/assets/to_pptx.js ./
```

この場合、package.jsonのスクリプトを以下に変更:

```json
{
  "scripts": {
    "to_html": "node to_html.js",
    "preview": "node preview.js",
    "to_pptx": "node to_pptx.js"
  }
}
```

## トラブルシューティング

### モジュールが見つからないエラー

skills 側で npm install が実行されていない可能性:

```bash
cd <skill-path> && npm install
```

### Playwrightエラー

skills 側で Chromium がインストールされていない場合:

```bash
cd <skill-path> && npx playwright install chromium
```

### モジュール解決エラー

NODE_PATH が正しく設定されているか確認:

```bash
echo $NODE_PATH
# <skill-path>/node_modules が表示されるはず
```
