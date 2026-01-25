# to_html

MarkdownファイルからHTMLスライドを生成する。

## 引数

`[mds-file]` (省略可、例: 1_mds/part1.md)

- 引数なし: `1_mds/` 以下の全 `.md` ファイルを変換
- 引数あり: 指定ファイルのみ変換

## 実行コマンド

```bash
npm run to_html                    # 1_mds/ 以下すべて
npm run to_html -- <mds-file>      # 指定ファイルのみ
```

## 使用例

```bash
# 1_mds/ 以下の全ファイルを変換
npm run to_html

# 指定ファイルのみ変換
npm run to_html -- 1_mds/sample.md

# 出力先を指定
npm run to_html -- 1_mds/sample.md --output 2_htmls

# ファイル名プレフィックスを指定
npm run to_html -- 1_mds/sample.md --prefix slide

# ドライラン（ファイルを書き込まずに確認）
npm run to_html -- --dry-run
```

## Markdown記法

[README.md](../README.md) の「Markdown記法」セクションを参照。
