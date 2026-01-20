/**
 * PPTX テスト用ユーティリティ
 *
 * - MD → HTML → PPTX 変換
 * - PPTX 解凍・XML 取得
 * - XML 正規化（フレーク対策）
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ASSETS_DIR = path.join(__dirname, '../..');
export const TMP_DIR = path.join(__dirname, '../tmp');

/**
 * テスト用一時ディレクトリを初期化
 */
export function setupTmpDir() {
  if (fs.existsSync(TMP_DIR)) {
    fs.rmSync(TMP_DIR, { recursive: true });
  }
  fs.mkdirSync(TMP_DIR, { recursive: true });
  fs.mkdirSync(path.join(TMP_DIR, '1_mds'), { recursive: true });
  fs.mkdirSync(path.join(TMP_DIR, '2_htmls'), { recursive: true });
  fs.mkdirSync(path.join(TMP_DIR, '3_pptxs'), { recursive: true });
}

/**
 * テスト用一時ディレクトリを削除
 */
export function cleanupTmpDir() {
  if (fs.existsSync(TMP_DIR)) {
    fs.rmSync(TMP_DIR, { recursive: true });
  }
}

/**
 * MD コンテンツから PPTX を生成
 * @param {string} mdContent - Markdown コンテンツ
 * @param {string} [filename='test'] - ファイル名（拡張子なし）
 * @returns {Promise<string>} 生成された PPTX ファイルパス
 */
export async function mdToPptx(mdContent, filename = 'test') {
  const mdPath = path.join(TMP_DIR, '1_mds', `${filename}.md`);
  fs.writeFileSync(mdPath, mdContent);

  // MD → HTML
  execSync(`node "${path.join(ASSETS_DIR, 'to_html.js')}" "${mdPath}"`, {
    cwd: TMP_DIR,
    stdio: 'pipe'
  });

  // HTML → PPTX
  execSync(`node "${path.join(ASSETS_DIR, 'to_pptx.js')}"`, {
    cwd: TMP_DIR,
    stdio: 'pipe',
    env: {
      ...process.env,
      HTML2PPTX_PATH: path.join(ASSETS_DIR, 'html2pptx')
    }
  });

  return path.join(TMP_DIR, '3_pptxs', 'presentation.pptx');
}

/**
 * PPTX ファイルからスライド XML を取得
 * @param {string} pptxPath - PPTX ファイルパス
 * @param {number} [slideNum=1] - スライド番号 (1-indexed)
 * @returns {Promise<string>} スライド XML 文字列
 */
export async function getSlideXml(pptxPath, slideNum = 1) {
  const buffer = fs.readFileSync(pptxPath);
  const zip = await JSZip.loadAsync(buffer);
  const xmlFile = zip.file(`ppt/slides/slide${slideNum}.xml`);

  if (!xmlFile) {
    throw new Error(`Slide ${slideNum} not found in PPTX`);
  }

  return xmlFile.async('string');
}

/**
 * PPTX ファイルから全スライド XML を取得
 * @param {string} pptxPath - PPTX ファイルパス
 * @returns {Promise<string[]>} スライド XML 文字列の配列
 */
export async function getAllSlideXmls(pptxPath) {
  const buffer = fs.readFileSync(pptxPath);
  const zip = await JSZip.loadAsync(buffer);

  const slideFiles = Object.keys(zip.files)
    .filter(name => name.match(/^ppt\/slides\/slide\d+\.xml$/))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)[1]);
      const numB = parseInt(b.match(/slide(\d+)/)[1]);
      return numA - numB;
    });

  const xmls = [];
  for (const file of slideFiles) {
    xmls.push(await zip.file(file).async('string'));
  }

  return xmls;
}

/**
 * PPTX ファイルの内容一覧を取得
 * @param {string} pptxPath - PPTX ファイルパス
 * @returns {Promise<string[]>} ファイル名の配列
 */
export async function listPptxContents(pptxPath) {
  const buffer = fs.readFileSync(pptxPath);
  const zip = await JSZip.loadAsync(buffer);
  return Object.keys(zip.files).sort();
}

/**
 * XML を正規化してフレークテストを防ぐ
 * - タイムスタンプ・動的IDを除去
 * - 座標を丸める
 * @param {string} xml - XML 文字列
 * @returns {string} 正規化された XML
 */
export function normalizeXml(xml) {
  return xml
    // name属性の動的部分を正規化
    .replace(/name="[^"]*-\d+"/g, 'name="normalized"')
    // 座標を 10000 EMU 単位で丸める (約 0.11 インチ精度)
    .replace(/ x="(\d+)"/g, (_, v) => ` x="${Math.round(parseInt(v) / 10000) * 10000}"`)
    .replace(/ y="(\d+)"/g, (_, v) => ` y="${Math.round(parseInt(v) / 10000) * 10000}"`)
    .replace(/ cx="(\d+)"/g, (_, v) => ` cx="${Math.round(parseInt(v) / 10000) * 10000}"`)
    .replace(/ cy="(\d+)"/g, (_, v) => ` cy="${Math.round(parseInt(v) / 10000) * 10000}"`);
}

/**
 * XML からテキスト内容を抽出
 * @param {string} xml - XML 文字列
 * @returns {string[]} テキスト内容の配列
 */
export function extractTexts(xml) {
  const matches = xml.match(/<a:t>([^<]*)<\/a:t>/g) || [];
  return matches.map(m => m.replace(/<\/?a:t>/g, ''));
}

/**
 * XML から図形の数をカウント
 * @param {string} xml - XML 文字列
 * @returns {number} 図形数
 */
export function countShapes(xml) {
  return (xml.match(/<p:sp>/g) || []).length;
}

/**
 * XML に特定のパターンが含まれるかチェック
 * @param {string} xml - XML 文字列
 * @param {RegExp|string} pattern - パターン
 * @returns {boolean}
 */
export function hasPattern(xml, pattern) {
  if (typeof pattern === 'string') {
    return xml.includes(pattern);
  }
  return pattern.test(xml);
}

/**
 * PPTX ファイルから画像ファイルの数をカウント
 * @param {string} pptxPath - PPTX ファイルパス
 * @returns {Promise<number>} 画像ファイル数
 */
export async function countImages(pptxPath) {
  const buffer = fs.readFileSync(pptxPath);
  const zip = await JSZip.loadAsync(buffer);
  const imageFiles = Object.keys(zip.files).filter(name =>
    name.startsWith('ppt/media/') && /\.(png|jpg|jpeg|gif|svg)$/i.test(name)
  );
  return imageFiles.length;
}

/**
 * XML から画像参照（p:pic要素）の数をカウント
 * @param {string} xml - XML 文字列
 * @returns {number} 画像参照数
 */
export function countPicElements(xml) {
  return (xml.match(/<p:pic>/g) || []).length;
}
