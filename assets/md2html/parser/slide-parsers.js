/**
 * Slide parser registry
 * Maps slide types to their parser functions
 */

const parseTitle = require('./title');
const parseBulletList = require('./bullet-list');
const parseCode = require('./code');
const parseTable = require('./table');
const parseFlow = require('./flow');
const parseCards = require('./cards');
const parseComposite = require('./composite');
const parseLeanCanvas = require('./lean-canvas');

/**
 * Type-specific slide parsers (pure functions returning partial slide data)
 * @type {Object.<string, function(string[], Object): Object>}
 */
const slideParsers = {
  title: parseTitle,
  bulletList: parseBulletList,
  code: parseCode,
  table: parseTable,
  flow: parseFlow,
  cards: parseCards,
  composite: parseComposite,
  leanCanvas: parseLeanCanvas,
};

module.exports = slideParsers;
