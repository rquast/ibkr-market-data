// Import all technical indicators for Highcharts Stock
import Highcharts from 'highcharts/highstock'

// Check if indicators are available, if not, use a fallback
try {
  // Try to import indicators
  const indicatorsAll = require('highcharts/indicators/indicators-all')
  const dragPanes = require('highcharts/modules/drag-panes')
  
  // Initialize indicators
  indicatorsAll(Highcharts)
  dragPanes(Highcharts)
} catch (error) {
  console.warn('Technical indicators not available:', error)
}

export default Highcharts