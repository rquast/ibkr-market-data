import { useState } from 'react'
import Highcharts from 'highcharts/highstock'
import HighchartsReact from 'highcharts-react-official'

interface BarData {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
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
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const chartOptions: Highcharts.Options = {
    rangeSelector: {
      selected: 1
    },
    title: {
      text: `${formData.symbol} Stock Price`
    },
    yAxis: [{
      labels: {
        align: 'right',
        x: -3
      },
      title: {
        text: 'OHLC'
      },
      height: '60%',
      lineWidth: 2,
      resize: {
        enabled: true
      }
    }, {
      labels: {
        align: 'right',
        x: -3
      },
      title: {
        text: 'Volume'
      },
      top: '65%',
      height: '35%',
      offset: 0,
      lineWidth: 2
    }],
    tooltip: {
      split: true
    },
    series: [{
      type: 'candlestick',
      name: formData.symbol,
      data: data.filter(item => item && item.time && item.open != null && item.high != null && item.low != null && item.close != null).map(item => [
        new Date(item.time).getTime(),
        item.open,
        item.high,
        item.low,
        item.close
      ])
    }, {
      type: 'column',
      name: 'Volume',
      data: data.filter(item => item && item.time && item.volume != null).map(item => [
        new Date(item.time).getTime(),
        item.volume
      ]),
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
          <HighchartsReact
            highcharts={Highcharts}
            constructorType={'stockChart'}
            options={chartOptions}
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