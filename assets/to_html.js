#!/usr/bin/env node
/**
 * Markdown to HTML スライド変換スクリプト
 *
 * 使い方:
 * 1. node to_html.js 1_mds/sample.md
 * 2. node to_html.js 1_mds/sample.md --output 2_htmls
 * 3. node to_html.js 1_mds/sample.md --prefix slide
 *
 * オプション:
 * --output, -o  出力ディレクトリ (デフォルト: 2_htmls)
 * --prefix, -p  ファイル名プレフィックス (デフォルト: slide)
 * --dry-run     ファイルを書き込まずに確認
 */

const fs = require("fs");
const path = require("path");
const { createResolver } = require("./utils/resolve");

// md2htmlのパスを解決
const resolveMd2html = createResolver(
  "MD2HTML_PATH",
  [path.join(process.cwd(), "md2html"), path.join(__dirname, "md2html")],
  "md2html not found. Set MD2HTML_PATH or copy md2html to project."
);

const md2htmlPath = resolveMd2html();
const { parseMarkdown } = require(path.join(md2htmlPath, "parser"));
const { generateSlideHtml, setThemeConfig } = require(path.join(md2htmlPath, "templates"));

/**
 * theme.jsonを読み込む
 * 優先順位:
 * 1. Markdownファイルと同じディレクトリのtheme.json
 * 2. カレントディレクトリの1_mds/theme.json
 * 3. スキルのassets/1_mds/theme.json
 */
function loadThemeConfig(inputPath) {
  const candidates = [
    inputPath ? path.join(path.dirname(inputPath), "theme.json") : null,
    path.join(process.cwd(), "1_mds", "theme.json"),
    path.join(__dirname, "1_mds", "theme.json"),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      try {
        const content = fs.readFileSync(candidate, "utf-8");
        return { config: JSON.parse(content), path: candidate };
      } catch (e) {
        console.warn(`  ⚠️ theme.json読み込みエラー: ${candidate}`);
      }
    }
  }
  return { config: null, path: null };
}

// theme.cssのパスを解決
const resolveThemeCss = createResolver(
  null,
  [path.join(process.cwd(), "theme.css"), path.join(__dirname, "html2pptx/playwright/theme.css")],
  null
);

/**
 * 入力ファイル名からプレフィックスを生成
 * 例: 1_mds/part1.md -> "part1-"
 */
function getDefaultPrefix(inputPath) {
  if (!inputPath) return "slide";
  const basename = path.basename(inputPath, path.extname(inputPath));
  return `${basename}-`;
}

/**
 * コマンドライン引数をパース
 */
function parseArgs(args) {
  const result = {
    input: null,
    output: "2_htmls",
    prefix: null, // nullの場合は入力ファイル名から自動生成
    dryRun: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--output" || arg === "-o") {
      result.output = args[++i];
    } else if (arg === "--prefix" || arg === "-p") {
      result.prefix = args[++i];
    } else if (arg === "--dry-run") {
      result.dryRun = true;
    } else if (!arg.startsWith("-")) {
      result.input = arg;
    }
  }

  // プレフィックスが指定されていない場合は入力ファイル名から生成
  if (result.prefix === null) {
    result.prefix = getDefaultPrefix(result.input);
  }

  return result;
}

/**
 * スライド番号をゼロパディング
 */
function formatSlideNumber(num) {
  return String(num).padStart(2, "0");
}

/**
 * メイン処理
 */
async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.input) {
    console.error("使い方: node to_html.js <markdown-file> [options]");
    console.error("");
    console.error("オプション:");
    console.error("  --output, -o  出力ディレクトリ (デフォルト: 2_htmls)");
    console.error("  --prefix, -p  ファイル名プレフィックス (デフォルト: slide)");
    console.error("  --dry-run     ファイルを書き込まずに確認");
    process.exit(1);
  }

  // Markdownファイルを読み込み
  const inputPath = path.isAbsolute(args.input)
    ? args.input
    : path.join(process.cwd(), args.input);

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ ファイルが見つかりません: ${inputPath}`);
    process.exit(1);
  }

  const markdown = fs.readFileSync(inputPath, "utf-8");

  console.log(`📄 読み込み: ${args.input}`);
  console.log(`   md2html: ${md2htmlPath}`);

  // theme.jsonを読み込み
  const { config: themeConfig, path: themePath } = loadThemeConfig(inputPath);
  if (themeConfig) {
    setThemeConfig(themeConfig);
    console.log(`   theme: ${themePath}`);
  }

  // Markdownをパース
  const slides = parseMarkdown(markdown);

  if (slides.length === 0) {
    console.error("❌ スライドが見つかりません");
    process.exit(1);
  }

  console.log(`📊 ${slides.length}枚のスライドを検出`);

  // 出力ディレクトリを作成
  const outputDir = path.isAbsolute(args.output)
    ? args.output
    : path.join(process.cwd(), args.output);

  if (!args.dryRun && !fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // theme.cssを出力ディレクトリにコピー
  const themeCssPath = resolveThemeCss();
  const themeOutputPath = path.join(outputDir, "theme.css");
  if (themeCssPath && !args.dryRun) {
    fs.copyFileSync(themeCssPath, themeOutputPath);
    console.log(`  📋 コピー: theme.css`);
  } else if (themeCssPath && args.dryRun) {
    console.log(`  📋 コピー予定: theme.css`);
  } else {
    console.warn(`  ⚠️ theme.cssが見つかりません`);
  }

  // 各スライドのHTMLを生成
  const generated = [];

  for (const slide of slides) {
    const html = generateSlideHtml(slide);
    const filename = `${args.prefix}${formatSlideNumber(slide.number)}.html`;
    const outputPath = path.join(outputDir, filename);

    if (args.dryRun) {
      console.log(`  📝 生成予定: ${filename} (${slide.type}: ${slide.name})`);
    } else {
      fs.writeFileSync(outputPath, html, "utf-8");
      console.log(`  ✅ 生成: ${filename} (${slide.type}: ${slide.name})`);
    }

    generated.push({ filename, slide });
  }

  console.log("");

  if (args.dryRun) {
    console.log(`🔍 ドライラン完了。${generated.length}枚のスライドが生成されます。`);
  } else {
    console.log(`✨ ${generated.length}枚のHTMLスライドを ${args.output}/ に生成しました！`);
  }

  return { slides, generated };
}

// 実行
main()
  .then(() => {
    console.log("\n🎉 HTML生成が完了しました！");
  })
  .catch((error) => {
    console.error("\n❌ エラーが発生しました:", error.message);
    console.error("\nトラブルシューティング:");
    console.error("1. Markdownファイルのパスを確認してください");
    console.error("2. Markdown記法が正しいか確認してください");
    console.error("   例: ## タイトル  または  ## スライド1: タイトル");
    process.exit(1);
  });
