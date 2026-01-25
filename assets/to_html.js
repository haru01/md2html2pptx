#!/usr/bin/env node
/**
 * Markdown to HTML スライド変換スクリプト
 *
 * 使い方:
 * 1. node to_html.js                     (1_mds/ 以下の全 .md を変換)
 * 2. node to_html.js 1_mds/sample.md     (指定ファイルのみ)
 * 3. node to_html.js 1_mds/sample.md --output 2_htmls
 * 4. node to_html.js 1_mds/sample.md --prefix slide
 *
 * オプション:
 * --output, -o  出力ディレクトリ (デフォルト: 2_htmls)
 * --prefix, -p  ファイル名プレフィックス (デフォルト: slide)
 * --dry-run     ファイルを書き込まずに確認
 */

const path = require("path");
const fs = require("fs");

/**
 * コマンドライン引数をパース
 */
function parseArgs(args) {
  const result = {
    input: null,
    output: "2_htmls",
    prefix: null,
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

  return result;
}

// スクリプトのディレクトリ (assets/)
const scriptDir = __dirname;

/**
 * 1_mds/ フォルダ内の全 .md ファイルを取得
 */
function getMdFilesInDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }
  return fs.readdirSync(dirPath)
    .filter(file => file.endsWith('.md'))
    .map(file => path.join(dirPath, file));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  // 入力ファイルリストを決定
  let inputFiles = [];
  if (args.input) {
    inputFiles = [args.input];
  } else {
    // 引数がない場合は 1_mds/ 以下の全 .md を対象
    // スクリプトと同じディレクトリ (assets/) にある 1_mds/ を探す
    const mdsDir = path.join(scriptDir, '1_mds');
    inputFiles = getMdFilesInDir(mdsDir);
    if (inputFiles.length === 0) {
      console.error("1_mds/ フォルダにMarkdownファイルが見つかりません。");
      console.error("");
      console.error("使い方: node to_html.js [markdown-file] [options]");
      console.error("  引数なしの場合、1_mds/ 以下の全 .md ファイルを変換します。");
      console.error("");
      console.error("オプション:");
      console.error("  --output, -o  出力ディレクトリ (デフォルト: 2_htmls)");
      console.error("  --prefix, -p  ファイル名プレフィックス (デフォルト: slide)");
      console.error("  --dry-run     ファイルを書き込まずに確認");
      process.exit(1);
    }
    console.log(`📂 1_mds/ 以下の ${inputFiles.length} 個のMarkdownファイルを処理します\n`);
  }

  // 出力ディレクトリはスクリプトのディレクトリを基準にする
  const outputDir = path.isAbsolute(args.output)
    ? args.output
    : path.join(scriptDir, args.output);

  const { convertMdToHtml } = await import("./to_html_core.mjs");

  let totalSlides = 0;
  let totalGenerated = 0;

  for (const inputFile of inputFiles) {
    const inputPath = path.isAbsolute(inputFile)
      ? inputFile
      : path.join(process.cwd(), inputFile);

    console.log(`📄 読み込み: ${inputFile}`);

    const { slides, generated } = await convertMdToHtml({
      inputPath,
      outputDir,
      prefix: args.prefix,
      dryRun: args.dryRun,
    });

    console.log(`📊 ${slides.length}枚のスライドを検出`);

    if (args.dryRun) {
      for (const { filename, slide } of generated) {
        console.log(`  📝 生成予定: ${filename} (${slide.type}: ${slide.name})`);
      }
    } else {
      for (const { filename, slide } of generated) {
        console.log(`  ✅ 生成: ${filename} (${slide.type}: ${slide.name})`);
      }
    }

    totalSlides += slides.length;
    totalGenerated += generated.length;
    console.log('');
  }

  if (args.dryRun) {
    console.log(`🔍 ドライラン完了。合計 ${totalGenerated}枚のスライドが生成されます。`);
  } else {
    console.log(`✨ 合計 ${totalGenerated}枚のHTMLスライドを ${args.output}/ に生成しました！`);
  }
}

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
