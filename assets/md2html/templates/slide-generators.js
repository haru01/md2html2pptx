/**
 * Slide generator registry
 * Maps slide types to their generator functions
 */

const generateTitleSlide = require('./title');
const generateBulletListSlide = require('./bullet-list');
const generateCardsSlide = require('./cards');
const generateTableSlide = require('./table');
const generateFlowSlide = require('./flow');
const generateCodeSlide = require('./code');
const generateCompositeSlide = require('./composite');
const generateLeanCanvasSlide = require('./lean-canvas');
const generateJavelinBoardSlide = require('./javelin-board');
const generateBarChartSlide = require('./bar-chart');
const generateCustomerJourneySlide = require('./customer-journey');

/**
 * Type-specific slide generators
 * Each returns { style: string, body: string }
 * @type {Object.<string, function(import('../types').SlideDefinition): {style: string, body: string}>}
 */
const slideGenerators = {
  title: generateTitleSlide,
  bulletList: generateBulletListSlide,
  cards: generateCardsSlide,
  table: generateTableSlide,
  flow: generateFlowSlide,
  code: generateCodeSlide,
  composite: generateCompositeSlide,
  leanCanvas: generateLeanCanvasSlide,
  javelinBoard: generateJavelinBoardSlide,
  barChart: generateBarChartSlide,
  customerJourney: generateCustomerJourneySlide,
};

module.exports = slideGenerators;
