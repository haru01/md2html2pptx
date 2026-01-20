/**
 * Path resolution utilities
 * 高階関数でパス解決関数を生成
 */

const fs = require('fs');

/**
 * パス解決関数を生成する高階関数
 * @param {string|null} envVar - 環境変数名 (nullの場合は環境変数をスキップ)
 * @param {string[]} fallbackPaths - フォールバックパス配列
 * @param {string|null} errorMsg - 見つからない場合のエラーメッセージ (nullなら例外なし)
 * @returns {() => string|null} - パスを返す関数
 */
const createResolver = (envVar, fallbackPaths, errorMsg = null) => () => {
  const envPath = envVar ? process.env[envVar] : null;
  const candidates = [envPath, ...fallbackPaths].filter(Boolean);
  const found = candidates.find(fs.existsSync);
  if (!found && errorMsg) throw new Error(errorMsg);
  return found || null;
};

module.exports = { createResolver };
