import { useState, useRef } from 'react'
import Highcharts from 'highcharts/highstock'
import HighchartsReact from 'highcharts-react-official'

// Import Highcharts modules
import IndicatorsAll from 'highcharts/indicators/indicators-all'
import StockTools from 'highcharts/modules/stock-tools'
import AnnotationsAdvanced from 'highcharts/modules/annotations-advanced'
import PriceIndicator from 'highcharts/modules/price-indicator'
import FullScreen from 'highcharts/modules/full-screen'
import DragPanes from 'highcharts/modules/drag-panes'

// Initialize modules
IndicatorsAll(Highcharts)
StockTools(Highcharts)
AnnotationsAdvanced(Highcharts)
PriceIndicator(Highcharts)
FullScreen(Highcharts)
DragPanes(Highcharts)

interface BarData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  instrument?: any
}

interface MarketDataRequest {
  symbol: string
  secType?: string
  endDateTime?: string
  duration?: string
  barSize?: string
  whatToShow?: string
  useRTH?: boolean
}

const MarketDataChart: React.FC = () => {
  // Get current date and time in EST/EDT
  const now = new Date()
  const defaultEndDateTime = now.getFullYear().toString() + 
    (now.getMonth() + 1).toString().padStart(2, '0') + 
    now.getDate().toString().padStart(2, '0') + '-' +
    now.getHours().toString().padStart(2, '0') + ':' +
    now.getMinutes().toString().padStart(2, '0') + ':' +
    now.getSeconds().toString().padStart(2, '0')

  const [formData, setFormData] = useState<MarketDataRequest>({
    symbol: 'AAPL',
    secType: 'STK',
    endDateTime: defaultEndDateTime,
    duration: '2 D',
    barSize: '5 mins',
    whatToShow: 'TRADES',
    useRTH: true
  })
  const [data, setData] = useState<BarData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const chartRef = useRef<Highcharts.Chart | null>(null)
  const [selectedOverlay, setSelectedOverlay] = useState('pc')
  const [selectedOscillator, setSelectedOscillator] = useState('macd')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleOverlayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setSelectedOverlay(value)
    
    if (chartRef.current) {
      const series = chartRef.current.get('overlay')
      if (series) {
        series.remove(false)
      }
      try {
        chartRef.current.addSeries({
          type: value as any,
          linkedTo: formData.symbol.toLowerCase(),
          id: 'overlay',
          yAxis: 0
        })
        chartRef.current.redraw()
      } catch (error) {
        console.warn('Could not add overlay indicator:', error)
      }
    }
  }

  const handleOscillatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setSelectedOscillator(value)
    
    if (chartRef.current) {
      const series = chartRef.current.get('oscillator')
      if (series) {
        series.remove(false)
      }
      try {
        chartRef.current.addSeries({
          type: value as any,
          linkedTo: formData.symbol.toLowerCase(),
          id: 'oscillator',
          yAxis: 2
        })
        chartRef.current.redraw()
      } catch (error) {
        console.warn('Could not add oscillator indicator:', error)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/marketdata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch data')
      }

      const result = await response.json()
      // Extract data array from response
      setData(Array.isArray(result) ? result : result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Prepare data for Highcharts
  const ohlcData = data.filter(item => 
    item && item.date && item.open != null && item.high != null && item.low != null && item.close != null
  ).map(item => [
    new Date(item.date).getTime(),
    item.open,
    item.high,
    item.low,
    item.close
  ])

  const volumeData = data.filter(item => 
    item && item.date && item.volume != null
  ).map(item => [
    new Date(item.date).getTime(),
    item.volume
  ])

  const chartOptions: Highcharts.Options = {
    chart: {
      height: 600
    },
    title: {
      text: `${formData.symbol} Historical`
    },
    subtitle: {
      text: 'All indicators'
    },
    accessibility: {
      series: {
        descriptionFormat: '{seriesDescription}.'
      },
      description: 'Use the dropdown menus above to display different indicator series on the chart.',
      screenReaderSection: {
        beforeChartFormat: '<{headingTagName}>{chartTitle}</{headingTagName}><div>{typeDescription}</div><div>{chartSubtitle}</div><div>{chartLongdesc}</div>'
      }
    },
    legend: {
      enabled: true
    },
    rangeSelector: {
      selected: 2
    },
    yAxis: [{
      height: '60%'
    }, {
      top: '60%',
      height: '20%'
    }, {
      top: '80%',
      height: '20%'
    }],
    plotOptions: {
      series: {
        showInLegend: true,
        accessibility: {
          exposeAsGroupOnly: true
        }
      }
    },
    series: [{
      type: 'candlestick',
      id: formData.symbol.toLowerCase(),
      name: formData.symbol,
      data: ohlcData
    }, {
      type: 'column',
      id: 'volume',
      name: 'Volume',
      data: volumeData,
      yAxis: 1
    }]
  }

  return (
    <div>
      <div className="form-section">
        <h2>Market Data Parameters</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="symbol">Symbol *</label>
              <input
                type="text"
                id="symbol"
                name="symbol"
                value={formData.symbol}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="secType">Security Type</label>
              <select
                id="secType"
                name="secType"
                value={formData.secType}
                onChange={handleInputChange}
              >
                <option value="STK">Stock</option>
                <option value="OPT">Option</option>
                <option value="FUT">Future</option>
                <option value="CASH">Forex</option>
                <option value="IND">Index</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="duration">Duration</label>
              <select
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
              >
                <option value="1 D">1 Day</option>
                <option value="2 D">2 Days</option>
                <option value="1 W">1 Week</option>
                <option value="1 M">1 Month</option>
                <option value="3 M">3 Months</option>
                <option value="6 M">6 Months</option>
                <option value="1 Y">1 Year</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="barSize">Bar Size</label>
              <select
                id="barSize"
                name="barSize"
                value={formData.barSize}
                onChange={handleInputChange}
              >
                <option value="1 min">1 Minute</option>
                <option value="5 mins">5 Minutes</option>
                <option value="15 mins">15 Minutes</option>
                <option value="30 mins">30 Minutes</option>
                <option value="1 hour">1 Hour</option>
                <option value="1 day">1 Day</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="whatToShow">What to Show</label>
              <select
                id="whatToShow"
                name="whatToShow"
                value={formData.whatToShow}
                onChange={handleInputChange}
              >
                <option value="TRADES">Trades</option>
                <option value="MIDPOINT">Midpoint</option>
                <option value="BID">Bid</option>
                <option value="ASK">Ask</option>
                <option value="BID_ASK">Bid/Ask</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="endDateTime">End Date/Time</label>
              <input
                type="text"
                id="endDateTime"
                name="endDateTime"
                value={formData.endDateTime || ''}
                onChange={handleInputChange}
                placeholder="YYYYMMDD-HH:MM:SS"
              />
            </div>
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="useRTH"
                checked={formData.useRTH}
                onChange={handleInputChange}
              />
              Use Regular Trading Hours
            </label>
          </div>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Loading...' : 'Get Market Data'}
          </button>
        </form>
      </div>

      {error && <div className="error">{error}</div>}

      {loading && <div className="loading">Fetching market data...</div>}

      {data.length > 0 && (
        <div className="chart-section">
          <div className="indicator-controls" style={{ marginBottom: '20px' }}>
            <label htmlFor="overlays" style={{ marginRight: '10px' }}>
              Overlay Indicators:
              <select id="overlays" value={selectedOverlay} onChange={handleOverlayChange} style={{ marginLeft: '5px' }}>
                <option value="pc">Price Channel (PC)</option>
                <option value="bb">Bollinger Bands (BB)</option>
                <option value="ema">Exponential Moving Average (EMA)</option>
                <option value="sma">Simple Moving Average (SMA)</option>
                <option value="keltner">Keltner Channels</option>
                <option value="psar">Parabolic SAR</option>
                <option value="pivotpoints">Pivot Points</option>
                <option value="vbp">Volume by Price</option>
              </select>
            </label>
            <label htmlFor="oscillators" style={{ marginLeft: '20px' }}>
              Oscillator Indicators:
              <select id="oscillators" value={selectedOscillator} onChange={handleOscillatorChange} style={{ marginLeft: '5px' }}>
                <option value="macd">MACD</option>
                <option value="rsi">RSI</option>
                <option value="stochastic">Stochastic</option>
                <option value="cci">CCI</option>
                <option value="ao">Awesome Oscillator</option>
                <option value="aroon">Aroon</option>
                <option value="atr">ATR</option>
                <option value="momentum">Momentum</option>
                <option value="obv">On Balance Volume</option>
                <option value="williams">Williams %R</option>
              </select>
            </label>
          </div>
          <HighchartsReact
            highcharts={Highcharts}
            constructorType={'stockChart'}
            options={chartOptions}
            callback={(chartInstance: Highcharts.Chart) => {
              chartRef.current = chartInstance
              
              // Add initial technical indicators
              try {
                chartInstance.addSeries({
                  type: selectedOverlay as any,
                  id: 'overlay',
                  linkedTo: formData.symbol.toLowerCase(),
                })
                
                chartInstance.addSeries({
                  type: selectedOscillator as any,
                  id: 'oscillator', 
                  linkedTo: formData.symbol.toLowerCase(),
                  yAxis: 2
                })
              } catch (error) {
                console.warn('Could not add technical indicators:', error)
              }
            }}
          />
        </div>
      )}

      {!loading && data.length === 0 && !error && (
        <div className="no-data">No data to display. Submit the form to fetch market data.</div>
      )}
    </div>
  )
}

export default MarketDataChart