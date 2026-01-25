/**
 * Style injection utilities for html2pptx
 */

/**
 * Add a style element to the page
 * @param {import('playwright').Page} page
 * @param {string} cssContent
 */
async function addStyleElement(page, cssContent) {
  await page.evaluate((css) => {
    async function addStyleContent(content, target) {
      const style = document.createElement('style');
      style.type = 'text/css';
      style.appendChild(document.createTextNode(content));
      const promise = new Promise((res, rej) => {
        style.onload = res;
        style.onerror = rej;
      });
      if (target) target.parentNode?.insertBefore(style, target);
      else document.head.appendChild(style);
      await promise;
      return style;
    }
    return addStyleContent(css, document.head.firstChild);
  }, cssContent);
}

module.exports = {
  addStyleElement,
};
