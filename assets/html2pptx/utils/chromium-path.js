/**
 * Chromium path resolution utilities
 */

const { chromium } = require('playwright');
const { join } = require('path');
const { access, readdir } = require('fs/promises');

/**
 * Helper function to check if a file exists
 * @param {string} path
 * @returns {Promise<boolean>}
 */
async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Determines the best path to a globally installed Chromium binary
 * Falls back to alternative revisions if the expected one is not found
 * @returns {Promise<string>}
 */
async function getChromiumPath() {
  const executablePath = chromium.executablePath();
  if (await fileExists(executablePath)) return executablePath;

  const pathParts = executablePath.split('/');
  const chromiumDirIndex = pathParts.findIndex((part) => part.startsWith('chromium-'));
  if (chromiumDirIndex === -1) {
    throw new Error(`Could not find chromium revision in path: ${executablePath}`);
  }

  const chromiumDirName = pathParts[chromiumDirIndex];
  const expectedRevision = parseInt(chromiumDirName.replace('chromium-', ''), 10);
  const parentDir = pathParts.slice(0, chromiumDirIndex).join('/');
  const relativePath = pathParts.slice(chromiumDirIndex + 1).join('/');

  let availableDirs = [];
  try {
    availableDirs = (await readdir(parentDir)).filter((dir) => dir.startsWith('chromium-'));
  } catch (_error) {
    throw new Error(`Could not read directory: ${parentDir}`);
  }

  if (availableDirs.length === 0) {
    throw new Error(`No chromium installations found in: ${parentDir}`);
  }

  let closestDiff = Infinity;
  let closestPath = undefined;

  for (const dir of availableDirs) {
    const revision = parseInt(dir.replace('chromium-', ''), 10);
    const diff = Math.abs(revision - expectedRevision);
    if (diff < closestDiff) {
      const candidatePath = join(parentDir, dir, relativePath);
      if (await fileExists(candidatePath)) {
        closestDiff = diff;
        closestPath = candidatePath;
      }
    }
  }

  if (!closestPath) {
    throw new Error(`No valid chromium executable found. Tried ${availableDirs.length} alternatives.`);
  }

  return closestPath;
}

module.exports = {
  fileExists,
  getChromiumPath,
};
