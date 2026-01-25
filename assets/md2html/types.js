/**
 * Type definitions for md2html
 * JSDoc type definitions for slide structures
 */

/**
 * @typedef {Object} CardDef
 * @property {string} name
 * @property {string[]} items
 * @property {CodeBlockDef} [codeBlock]
 * @property {'normal'|'good'|'bad'|'step'} [variant] - Card style variant (default: 'normal')
 * @property {number} [number] - Step number (only used when variant='step')
 */

/**
 * @typedef {Object} TableDef
 * @property {string[]} headers
 * @property {string[][]} rows
 */

/**
 * @typedef {Object} CodeBlockDef
 * @property {string} language
 * @property {string} code
 */

/**
 * @typedef {Object} SubItem
 * @property {string} text
 * @property {string[]} [subSubItems]
 */

/**
 * @typedef {Object} ContentItem
 * @property {string} text
 * @property {SubItem[]} [subItems]
 */

/**
 * @typedef {Object} SlideDefinition
 * @property {number} number
 * @property {string} name
 * @property {'title'|'bulletList'|'cards'|'table'|'flow'|'code'|'leanCanvas'|'javelinBoard'|'barChart'} type
 * @property {number} [partNumber]
 * @property {string} [mainTitle]
 * @property {string} [subtitle]
 * @property {string} [section]
 * @property {string} [title]
 * @property {string[]|ContentItem[]} [items]
 * @property {CardDef[]} [cards]
 * @property {TableDef} [table]
 * @property {string[]} [flowItems]
 * @property {CodeBlockDef} [codeBlock]
 * @property {BarChartDef} [barChart]
 * @property {'horizontal'|'vertical'} [layout] - Card layout direction (default: 'horizontal')
 */

/**
 * @typedef {Object} CompositeLayoutDef
 * @property {number} rows
 * @property {number} cols
 * @property {boolean} [reverse]
 */

/**
 * @typedef {Object} CompositeItemDef
 * @property {'bulletList'|'code'|'table'|'cards'|'flow'|'composite'} type
 * @property {ContentItem[]} [items]
 * @property {CodeBlockDef} [codeBlock]
 * @property {TableDef} [table]
 * @property {CardDef[]} [cards]
 * @property {string[]} [flowItems]
 * @property {CompositeLayoutDef} [compositeLayout]
 * @property {CompositeItemDef[]} [compositeItems]
 * @property {'horizontal'|'vertical'} [layout] - Card layout direction (default: 'horizontal')
 */

/**
 * @typedef {Object} LeanCanvasSection
 * @property {string} label
 * @property {string[]} items
 */

/**
 * @typedef {Object.<string, LeanCanvasSection>} LeanCanvasSections
 */

/**
 * @typedef {Object} JavelinExperiment
 * @property {string} label - Experiment label (e.g., "実験1")
 * @property {string} [date] - Date of experiment
 * @property {string} [customer] - Target customer
 * @property {string} [assumption] - Key assumption to validate
 * @property {string} [result] - Experiment result
 * @property {string} [decision] - Decision (continue/pivot/stop)
 */

/**
 * @typedef {Object} JavelinBoardData
 * @property {string[]} headers - Table headers ["項目", "実験1", "実験2", ...]
 * @property {string[][]} rows - Table rows [["日付", "2024-01", "2024-02"], ...]
 */

/**
 * @typedef {Object} BarChartDef
 * @property {string[]} labels - X-axis labels (categories)
 * @property {number[]} values - Y-axis values
 * @property {'vertical'|'horizontal'} [orientation] - Chart orientation (default: 'vertical')
 * @property {string} [xAxisLabel] - X-axis label
 * @property {string} [yAxisLabel] - Y-axis label
 * @property {boolean} [showValues] - Show values on bars (default: false)
 */

// Export empty object for module compatibility
// Types are consumed via JSDoc comments
module.exports = {};
