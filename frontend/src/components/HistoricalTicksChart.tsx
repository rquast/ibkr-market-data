import { useState } from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

interface TickData {
  time: string
  price: number
  size: number
}

interface HistoricalTicksRequest {
  symbol: string
  secType?: string
  startDate?: string
  endDate?: string
  numberOfTicks?: number
  useRTH?: boolean
}

const HistoricalTicksChart: React.FC = () => {
  // Get current date and time, and yesterday for defaults
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const formatDateTime = (date: Date) => {
    return date.getFullYear().toString() + 
      (date.getMonth() + 1).toString().padStart(2, '0') + 
      date.getDate().toString().padStart(2, '0') + '-' +
      date.getHours().toString().padStart(2, '0') + ':' +
      date.getMinutes().toString().padStart(2, '0') + ':' +
      date.getSeconds().toString().padStart(2, '0')
  }

  const [formData, setFormData] = useState<HistoricalTicksRequest>({
    symbol: 'AAPL',
    secType: 'STK',
    startDate: formatDateTime(yesterday),
    endDate: formatDateTime(now),
    numberOfTicks: 1000,
    useRTH: true
  })
  const [data, setData] = useState<TickData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              name === 'numberOfTicks' ? parseInt(value) || 0 : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/historicalticks', {
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

  const priceChartOptions: Highcharts.Options = {
    title: {
      text: `${formData.symbol} Tick Price Data`
    },
    xAxis: {
      type: 'datetime',
      title: {
        text: 'Time'
      }
    },
    yAxis: {
      title: {
        text: 'Price ($)'
      }
    },
    tooltip: {
      headerFormat: '<b>{series.name}</b><br>',
      pointFormat: '{point.x:%Y-%m-%d %H:%M:%S}<br/>Price: ${point.y:.2f}<br/>Size: {point.size}'
    },
    series: [{
      type: 'line',
      name: 'Price',
      data: data.map(item => ({
        x: new Date(item.time).getTime(),
        y: item.price,
        size: item.size
      })),
      marker: {
        enabled: true,
        radius: 2
      }
    }],
    plotOptions: {
      line: {
        marker: {
          enabled: true
        }
      }
    }
  }

  const sizeChartOptions: Highcharts.Options = {
    title: {
      text: `${formData.symbol} Tick Size Data`
    },
    xAxis: {
      type: 'datetime',
      title: {
        text: 'Time'
      }
    },
    yAxis: {
      title: {
        text: 'Size'
      }
    },
    tooltip: {
      headerFormat: '<b>{series.name}</b><br>',
      pointFormat: '{point.x:%Y-%m-%d %H:%M:%S}<br/>Size: {point.y}<br/>Price: ${point.price:.2f}'
    },
    series: [{
      type: 'column',
      name: 'Trade Size',
      data: data.map(item => ({
        x: new Date(item.time).getTime(),
        y: item.size,
        price: item.price
      })),
      color: '#7cb5ec'
    }]
  }

  return (
    <div>
      <div className="form-section">
        <h2>Historical Ticks Parameters</h2>
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
              <label htmlFor="numberOfTicks">Number of Ticks</label>
              <input
                type="number"
                id="numberOfTicks"
                name="numberOfTicks"
                value={formData.numberOfTicks}
                onChange={handleInputChange}
                min="1"
                max="10000"
              />
            </div>
            <div className="form-group">
              <label htmlFor="startDate">Start Date</label>
              <input
                type="text"
                id="startDate"
                name="startDate"
                value={formData.startDate || ''}
                onChange={handleInputChange}
                placeholder="YYYYMMDD-HH:MM:SS"
              />
            </div>
            <div className="form-group">
              <label htmlFor="endDate">End Date</label>
              <input
                type="text"
                id="endDate"
                name="endDate"
                value={formData.endDate || ''}
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
            {loading ? 'Loading...' : 'Get Historical Ticks'}
          </button>
        </form>
      </div>

      {error && <div className="error">{error}</div>}

      {loading && <div className="loading">Fetching tick data...</div>}

      {data.length > 0 && (
        <>
          <div className="chart-section">
            <HighchartsReact
              highcharts={Highcharts}
              options={priceChartOptions}
            />
          </div>
          <div className="chart-section" style={{ marginTop: '20px' }}>
            <HighchartsReact
              highcharts={Highcharts}
              options={sizeChartOptions}
            />
          </div>
        </>
      )}

      {!loading && data.length === 0 && !error && (
        <div className="no-data">No data to display. Submit the form to fetch tick data.</div>
      )}
    </div>
  )
}

export default HistoricalTicksChart