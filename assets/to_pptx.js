#!/usr/bin/env node
/**
 * HTML to PowerPoint ビルドスクリプト
 *
 * 使い方:
 * 1. npm install (初回のみ)
 * 2. node to_pptx.js
 * 3. node to_pptx.js part1 (フィルター指定)
 * 4. node to_pptx.js --input ./2_htmls --output ./3_pptxs
 * 5. node to_pptx.js --input ./2_htmls --output ./3_pptxs part1 part2
 *
 * 環境変数:
 * - HTML2PPTX_PATH: html2pptxライブラリのパス (省略時はスキルのassetsを参照)
 */

const path = require("path");

function parseArgs(argv) {
  const args = argv.slice(2);
  const result = {
    input: null,
    output: null,
    filters: [],
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--input" && i + 1 < args.length) {
      result.input = args[++i];
    } else if (args[i] === "--output" && i + 1 < args.length) {
      result.output = args[++i];
    } else if (!args[i].startsWith("--")) {
      result.filters.push(args[i]);
    }
  }

  return result;
}

async function main() {
  const { input, output, filters } = parseArgs(process.argv);

  const slidesDir = input
    ? path.resolve(process.cwd(), input)
    : path.join(process.cwd(), "2_htmls");
  const outputDir = output
    ? path.resolve(process.cwd(), output)
    : path.join(process.cwd(), "3_pptxs");

  const { convertHtmlToPptx } = await import("./to_pptx_core.mjs");

  console.log("🎨 プレゼンテーションを作成中...");

  const filterList = filters.length === 0 ? [null] : filters;
  const results = [];

  for (const filter of filterList) {
    const outputFile = filter
      ? path.join(outputDir, `${filter}.pptx`)
      : path.join(outputDir, "presentation.pptx");

    const result = await convertHtmlToPptx({
      slidesDir,
      outputPath: outputFile,
      filter: filter || undefined,
    });

    console.log(`  ✅ ${result.file} 作成完了 (${result.count}枚)`);
    results.push(result);
  }

  console.log("\n✨ 完成しました!");
  console.log("📊 生成ファイル:");
  for (const r of results) {
    console.log(`   - ${r.file} (${r.count}枚)`);
  }
}

main()
  .then(() => {
    console.log("\n🎉 プレゼンテーションの作成が完了しました！");
  })
  .catch((error) => {
    console.error("\n❌ エラーが発生しました:", error.message);
    console.error("\nトラブルシューティング:");
    console.error("1. npm install を実行してください");
    console.error("2. npx playwright install chromium を実行してください");
    console.error("3. 2_htmls/ フォルダにHTMLファイルがあることを確認してください");
    process.exit(1);
  });
