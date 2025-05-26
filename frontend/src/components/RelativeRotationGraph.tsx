import { useState, useCallback, useMemo } from 'react'
import Highcharts from 'highcharts/highstock'
import HighchartsReact from 'highcharts-react-official'

// Import required modules for relative rotation graph
import IndicatorsAll from 'highcharts/indicators/indicators-all'
import AnnotationsAdvanced from 'highcharts/modules/annotations-advanced'
import DragPanes from 'highcharts/modules/drag-panes'

// Initialize modules
IndicatorsAll(Highcharts)
AnnotationsAdvanced(Highcharts)
DragPanes(Highcharts)

// Add rounded border effect on chart load
Highcharts.addEvent(Highcharts.Chart, 'load', function () {
    if (this.options.chart?.className?.indexOf('rounded-plot-border') !== -1) {
        (this as any).plotBorder?.attr({
            rx: 10,
            ry: 10,
            zIndex: 6
        });
    }
});

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

interface StockSymbol {
    symbol: string
    name: string
    data: BarData[]
    loading: boolean
    error: string
    color: string
}

// Predefined index groups
const ASX_INDEXES = [
    { symbol: 'XEJ', name: 'S&P/ASX 200 Energy' },
    { symbol: 'XUJ', name: 'S&P/ASX 200 Utilities' },
    { symbol: 'XHJ', name: 'S&P/ASX 200 Health Care' },
    { symbol: 'XFJ', name: 'S&P/ASX 200 Financials' },
    { symbol: 'XTJ', name: 'S&P/ASX 200 Telecommunications' },
    { symbol: 'XNJ', name: 'S&P/ASX 200 Information Technology' },
    { symbol: 'XMJ', name: 'S&P/ASX 200 Materials' },
    { symbol: 'XDJ', name: 'S&P/ASX 200 Consumer Discretionary' },
    { symbol: 'XSJ', name: 'S&P/ASX 200 Consumer Staples' },
    { symbol: 'XIJ', name: 'S&P/ASX 200 Industrials' },
    { symbol: 'XPJ', name: 'S&P/ASX 200 Property Trusts' }
]

const US_INDEXES = [
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF' },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust' },
    { symbol: 'IWM', name: 'iShares Russell 2000 ETF' },
    { symbol: 'DIA', name: 'SPDR Dow Jones Industrial Average ETF' },
    { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF' },
    { symbol: 'XLF', name: 'Financial Select Sector SPDR Fund' },
    { symbol: 'XLK', name: 'Technology Select Sector SPDR Fund' },
    { symbol: 'XLE', name: 'Energy Select Sector SPDR Fund' },
    { symbol: 'XLV', name: 'Health Care Select Sector SPDR Fund' },
    { symbol: 'XLI', name: 'Industrial Select Sector SPDR Fund' },
    { symbol: 'XLY', name: 'Consumer Discretionary Select Sector SPDR Fund' },
    { symbol: 'XLP', name: 'Consumer Staples Select Sector SPDR Fund' }
]

const COLORS = [
    '#2f7ed8', '#0d233a', '#8bbc21', '#910000', '#1aadce',
    '#492970', '#f28f43', '#77a1e5', '#c42525', '#a6c96a'
]

const RelativeRotationGraph: React.FC = () => {
    // Get current date and time in EST/EDT
    const now = new Date()
    const defaultEndDateTime = now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, '0') +
        now.getDate().toString().padStart(2, '0') + '-' +
        now.getHours().toString().padStart(2, '0') + ':' +
        now.getMinutes().toString().padStart(2, '0') + ':' +
        now.getSeconds().toString().padStart(2, '0')

    const [formData, setFormData] = useState<MarketDataRequest>({
        symbol: '',
        secType: 'STK',
        endDateTime: defaultEndDateTime,
        duration: '1 Y',
        barSize: '1 day',
        whatToShow: 'TRADES',
        useRTH: true
    })

    const [benchmarkSymbol, setBenchmarkSymbol] = useState('SPY')
    const [newSymbol, setNewSymbol] = useState('')
    const [stocks, setStocks] = useState<StockSymbol[]>([])
    const [selectedPrefill, setSelectedPrefill] = useState('')

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }))
    }

    const fetchMarketData = async (symbol: string): Promise<BarData[]> => {
        const response = await fetch('/api/marketdata', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...formData,
                symbol: symbol
            }),
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to fetch data')
        }

        const result = await response.json()
        return Array.isArray(result) ? result : result.data || []
    }

    const addStock = useCallback(async () => {
        if (!newSymbol.trim()) return

        const symbol = newSymbol.trim().toUpperCase()
        if (stocks.some(stock => stock.symbol === symbol)) {
            alert('Symbol already added')
            return
        }

        const color = COLORS[stocks.length % COLORS.length]
        const newStock: StockSymbol = {
            symbol,
            name: symbol,
            data: [],
            loading: true,
            error: '',
            color
        }

        setStocks(prev => [...prev, newStock])
        setNewSymbol('')

        try {
            const data = await fetchMarketData(symbol)
            setStocks(prev => prev.map(stock =>
                stock.symbol === symbol
                    ? { ...stock, data, loading: false }
                    : stock
            ))
        } catch (error) {
            setStocks(prev => prev.map(stock =>
                stock.symbol === symbol
                    ? { ...stock, loading: false, error: error instanceof Error ? error.message : 'Failed to fetch data' }
                    : stock
            ))
        }
    }, [newSymbol, formData, stocks])

    const removeStock = (symbolToRemove: string) => {
        setStocks(prev => prev.filter(stock => stock.symbol !== symbolToRemove))
    }

    const handlePrefillChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value
        setSelectedPrefill(value)

        if (!value) return

        const indexGroup = value === 'asx' ? ASX_INDEXES : US_INDEXES

        // Clear existing stocks
        setStocks([])

        // Add all symbols from the selected group
        const newStocks: StockSymbol[] = indexGroup.map((index, i) => ({
            symbol: index.symbol,
            name: index.name,
            data: [],
            loading: true,
            error: '',
            color: COLORS[i % COLORS.length]
        }))

        setStocks(newStocks)

        // Fetch data for all symbols
        for (const stock of newStocks) {
            try {
                const data = await fetchMarketData(stock.symbol)
                setStocks(prev => prev.map(s =>
                    s.symbol === stock.symbol
                        ? { ...s, data, loading: false }
                        : s
                ))
            } catch (error) {
                setStocks(prev => prev.map(s =>
                    s.symbol === stock.symbol
                        ? { ...s, loading: false, error: error instanceof Error ? error.message : 'Failed to fetch data' }
                        : s
                ))
            }
        }
    }

    // Calculate relative strength and momentum for RRG using proper methodology
    const calculateRRGData = useMemo(() => {
        const validStocks = stocks.filter(stock => stock.data.length > 0 && !stock.error)
        if (validStocks.length === 0) return []

        // Find benchmark data - look for benchmark symbol first, then use SPY, then first stock
        let benchmarkStock = validStocks.find(stock => stock.symbol === benchmarkSymbol)
        if (!benchmarkStock) {
            benchmarkStock = validStocks.find(stock => stock.symbol === 'SPY')
        }
        if (!benchmarkStock) {
            benchmarkStock = validStocks[0]
        }

        const benchmarkData = benchmarkStock.data
        
        // Relax the data requirement for now - need at least 60 days for basic calculations
        if (benchmarkData.length < 60) return []

        // Helper function to calculate returns
        const calculateReturns = (prices: number[], periods: number) => {
            const returns: number[] = []
            for (let i = periods; i < prices.length; i++) {
                const currentPrice = prices[i]
                const pastPrice = prices[i - periods]
                if (pastPrice > 0) {
                    returns.push((currentPrice - pastPrice) / pastPrice)
                } else {
                    returns.push(0)
                }
            }
            return returns
        }

        // Helper function for Z-score normalization
        const zScoreNormalize = (values: number[]) => {
            const mean = values.reduce((sum, val) => sum + val, 0) / values.length
            const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
            const stdDev = Math.sqrt(variance)

            if (stdDev === 0) return values.map(() => 100) // If no variance, return neutral values

            return values.map(val => 100 + ((val - mean) / stdDev))
        }

        const series = validStocks.map(stock => {
            // Don't skip benchmark - include it in the chart too
            const stockData = stock.data
            
            if (stockData.length < 60) return null // Need at least 60 days of data

            // Align data by date
            const alignedData: Array<{ stock: number, benchmark: number }> = []
            const stockDataMap = new Map(stockData.map(d => [d.date, d.close]))

            for (const benchmarkPoint of benchmarkData) {
                const stockPrice = stockDataMap.get(benchmarkPoint.date)
                if (stockPrice !== undefined) {
                    alignedData.push({
                        stock: stockPrice,
                        benchmark: benchmarkPoint.close
                    })
                }
            }

            if (alignedData.length < 60) return null

            // Calculate relative strength ratios (stock/benchmark * 100)
            const rsRatios = alignedData.map(d => (d.stock / d.benchmark) * 100)

            // Use shorter periods for momentum calculation if we don't have enough data
            const stockPrices = alignedData.map(d => d.stock)
            const longPeriod = Math.min(60, Math.floor(alignedData.length * 0.8)) // 60 days or 80% of data
            const shortPeriod = Math.min(21, Math.floor(alignedData.length * 0.3)) // 21 days or 30% of data
            
            const returnsLong = calculateReturns(stockPrices, longPeriod)
            const returnsShort = calculateReturns(stockPrices, shortPeriod)

            // Calculate momentum using adapted method
            const momentum: number[] = []
            const minLength = Math.min(returnsLong.length, returnsShort.length)

            for (let i = 0; i < minLength; i++) {
                const rLong = returnsLong[i]
                const rShort = returnsShort[i]
                // Momentum = ln(1 + rLong) - ln(1 + rShort)
                const mom = Math.log(1 + rLong) - Math.log(1 + rShort)
                momentum.push(mom)
            }
            


            // If momentum calculation failed, use simple price change as momentum
            let finalMomentum = momentum
            if (momentum.length === 0) {
                finalMomentum = rsRatios.slice(1).map((curr, i) => curr - rsRatios[i])
            }

            // Take the ratios that align with momentum periods
            const alignedRsRatios = finalMomentum.length > 0 ? rsRatios.slice(-finalMomentum.length) : rsRatios

            if (alignedRsRatios.length === 0) {
                return null
            }

            // Normalize using Z-score
            const normalizedRatios = zScoreNormalize(alignedRsRatios)
            const normalizedMomentum = zScoreNormalize(finalMomentum)

            // Create data points for the trail (last 12 weeks)
            const dataPoints: Array<{x: number, y: number, date: string, sequenceNumber: number}> = []
            const numPoints = Math.min(12, normalizedRatios.length)
            const step = Math.max(1, Math.floor(normalizedRatios.length / numPoints))

            for (let i = 0; i < numPoints; i++) {
                const index = normalizedRatios.length - 1 - (i * step)
                if (index >= 0 && index < alignedData.length) {
                    // Get the corresponding date from the aligned data
                    const dataIndex = alignedData.length - normalizedRatios.length + index
                    const correspondingDate = dataIndex >= 0 && dataIndex < stockData.length ? 
                        stockData[dataIndex].date : stockData[stockData.length - 1].date
                    
                    dataPoints.unshift({
                        x: normalizedRatios[index],
                        y: normalizedMomentum[index],
                        date: correspondingDate,
                        sequenceNumber: i + 1
                    })
                }
            }

            return {
                type: 'line',
                name: stock.symbol,
                color: stock.color,
                data: dataPoints,
                marker: {
                    enabled: true,
                    radius: 3,
                    symbol: 'circle'
                },
                lineWidth: 2
            }
        }).filter(Boolean)

        return series
    }, [stocks, benchmarkSymbol])

    // Calculate dynamic axis ranges based on data
    const getAxisRanges = () => {
        const seriesData = calculateRRGData
        if (seriesData.length === 0) return { xMin: 96, xMax: 104, yMin: 96, yMax: 104 }

        let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity

        seriesData.forEach((series: any) => {
            if (series?.data) {
                series.data.forEach((point: any) => {
                    const x = point.x || point[0]
                    const y = point.y || point[1]
                    xMin = Math.min(xMin, x)
                    xMax = Math.max(xMax, x)
                    yMin = Math.min(yMin, y)
                    yMax = Math.max(yMax, y)
                })
            }
        })

        // Add padding and ensure reasonable bounds
        const xPadding = (xMax - xMin) * 0.1 || 2
        const yPadding = (yMax - yMin) * 0.1 || 2

        return {
            xMin: Math.min(96, xMin - xPadding),
            xMax: Math.max(104, xMax + xPadding),
            yMin: Math.min(96, yMin - yPadding),
            yMax: Math.max(104, yMax + yPadding)
        }
    }

    const axisRanges = getAxisRanges()

    const chartOptions: Highcharts.Options = {
        chart: {
            type: 'scatter',
            height: '90%',
            plotBorderWidth: 10,
            plotBorderColor: '#ffffff',
            backgroundColor: '#f7f7f8',
            spacing: [10, 85, 15, 20],
            style: {
                fontFamily: 'IBM Plex Sans'
            },
            className: 'rounded-plot-border'
        },
        title: {
            text: 'Relative Rotation Graph®️'
        },
        legend: {
            enabled: false
        },
        annotations: [{
            draggable: '' as any,
            shapeOptions: {
                type: 'path',
                strokeWidth: 0
            },
            shapes: [{
                fill: {
                    radialGradient: {
                        cx: 0,
                        cy: 1,
                        r: 1.1
                    },
                    stops: [
                        [0, 'rgba(255, 0, 0, 0.2)'],
                        [1, 'rgba(255,255,255, 0.1)']
                    ]
                },
                points: [{
                    x: axisRanges.xMin, y: 100, xAxis: 0, yAxis: 0
                }, {
                    x: 100, y: 100, xAxis: 0, yAxis: 0
                }, {
                    x: 100, y: axisRanges.yMin, xAxis: 0, yAxis: 0
                }, {
                    x: axisRanges.xMin, y: axisRanges.yMin, xAxis: 0, yAxis: 0
                }]
            }, {
                fill: {
                    radialGradient: {
                        cx: 0,
                        cy: 0,
                        r: 1.1
                    },
                    stops: [
                        [0, 'rgba(0, 0, 255, 0.1)'],
                        [1, 'rgba(255,255,255, 0.1)']
                    ]
                },
                points: [{
                    x: axisRanges.xMin, y: axisRanges.yMax, xAxis: 0, yAxis: 0
                }, {
                    x: 100, y: axisRanges.yMax, xAxis: 0, yAxis: 0
                }, {
                    x: 100, y: 100, xAxis: 0, yAxis: 0
                }, {
                    x: axisRanges.xMin, y: 100, xAxis: 0, yAxis: 0
                }]
            }, {
                fill: {
                    radialGradient: {
                        cx: 1,
                        cy: 0,
                        r: 1.1
                    },
                    stops: [
                        [0, 'rgba(0, 255, 0, 0.1)'],
                        [1, 'rgba(255,255,255, 0.1)']
                    ]
                },
                points: [{
                    x: 100, y: axisRanges.yMax, xAxis: 0, yAxis: 0
                }, {
                    x: axisRanges.xMax, y: axisRanges.yMax, xAxis: 0, yAxis: 0
                }, {
                    x: axisRanges.xMax, y: 100, xAxis: 0, yAxis: 0
                }, {
                    x: 100, y: 100, xAxis: 0, yAxis: 0
                }]
            }, {
                fill: {
                    radialGradient: {
                        cx: 1,
                        cy: 1,
                        r: 1.1
                    },
                    stops: [
                        [0, 'rgba(255, 255, 0, 0.2)'],
                        [1, 'rgba(255,255,255, 0.1)']
                    ]
                },
                points: [{
                    x: 100, y: 100, xAxis: 0, yAxis: 0
                }, {
                    x: axisRanges.xMax, y: 100, xAxis: 0, yAxis: 0
                }, {
                    x: axisRanges.xMax, y: axisRanges.yMin, xAxis: 0, yAxis: 0
                }, {
                    x: 100, y: axisRanges.yMin, xAxis: 0, yAxis: 0
                }]
            }],
            labelOptions: {
                backgroundColor: 'transparent',
                borderWidth: 0,
                y: 0,
                padding: 10,
                style: {
                    fontSize: '12px',
                    fontWeight: '700',
                    textOutline: '3px #ffffff80'
                }
            },
            labels: [{
                text: 'LAGGING',
                style: {
                    color: '#c80056'
                },
                point: {
                    x: (axisRanges.xMin + 100) / 2,
                    y: (axisRanges.yMin + 100) / 2,
                    xAxis: 0,
                    yAxis: 0
                }
            }, {
                text: 'IMPROVING',
                style: {
                    color: '#004bb3'
                },
                point: {
                    x: (axisRanges.xMin + 100) / 2,
                    y: (100 + axisRanges.yMax) / 2,
                    xAxis: 0,
                    yAxis: 0
                }
            }, {
                text: 'LEADING',
                style: {
                    color: '#008224'
                },
                point: {
                    x: (100 + axisRanges.xMax) / 2,
                    y: (100 + axisRanges.yMax) / 2,
                    xAxis: 0,
                    yAxis: 0
                }
            }, {
                text: 'WEAKENING',
                style: {
                    color: '#9a5c00'
                },
                point: {
                    x: (100 + axisRanges.xMax) / 2,
                    y: (axisRanges.yMin + 100) / 2,
                    xAxis: 0,
                    yAxis: 0
                }
            }]
        }],
        xAxis: {
            min: axisRanges.xMin,
            max: axisRanges.xMax,
            plotLines: [{
                value: 100,
                width: 1,
                color: '#000000',
                zIndex: 1
            }],
            title: {
                text: 'JdK RS-Ratio®️',
                style: {
                    fontWeight: 'bold'
                }
            },
            tickWidth: 0,
            lineWidth: 0,
            gridLineWidth: 1
        },
        yAxis: {
            min: axisRanges.yMin,
            max: axisRanges.yMax,
            plotLines: [{
                value: 100,
                width: 1,
                color: '#000000',
                zIndex: 1
            }],
            title: {
                text: 'JdK RS-Momentum®️',
                style: {
                    fontWeight: 'bold'
                }
            },
            gridLineWidth: 1
        },
        plotOptions: {
            series: {
                lineWidth: 2,
                marker: {
                    enabled: true,
                    radius: 3,
                    symbol: 'circle'
                }
            }
        },
        tooltip: {
            useHTML: true,
            formatter: function() {
                const point = this.point as any;
                const series = this.series;
                const seriesData = series.data;
                const pointIndex = seriesData.indexOf(point);
                
                const xVal = typeof point.x === 'number' ? point.x.toFixed(2) : 'N/A';
                const yVal = typeof point.y === 'number' ? point.y.toFixed(2) : 'N/A';
                const date = point.date || 'N/A';
                const sequenceNumber = point.sequenceNumber || (pointIndex + 1);
                
                // Format date for display
                const formattedDate = date !== 'N/A' ? new Date(date).toLocaleDateString() : 'N/A';
                
                return `<div style="padding: 8px;">
                    <div style="display: flex; align-items: center; margin-bottom: 5px;">
                        <span style="color: ${series.color}; font-size: 16px; margin-right: 5px;">●</span>
                        <strong>${series.name}</strong>
                    </div>
                    <div>Date: <b>${formattedDate}</b></div>
                    <div>RS-Ratio®️: <b>${xVal}</b></div>
                    <div>RS-Momentum®️: <b>${yVal}</b></div>
                    <div>Color: <span style="color: ${series.color}; font-weight: bold;">${series.color}</span></div>
                    <div>Sequence: <b>${sequenceNumber}</b> of <b>${seriesData.length}</b></div>
                </div>`;
            }
        },
        series: calculateRRGData as any,
        navigation: {
            buttonOptions: {
                theme: {
                    fill: 'none'
                },
                y: -7
            }
        }
    }

    return (
        <div>
            <div className="form-section">
                <h2>Relative Rotation Graph Parameters</h2>

                {/* Prefill Section */}
                <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label htmlFor="prefill">Quick Add Index Groups:</label>
                    <select
                        id="prefill"
                        value={selectedPrefill}
                        onChange={handlePrefillChange}
                        style={{ marginRight: '10px' }}
                    >
                        <option value="">Select a group...</option>
                        <option value="asx">ASX Sector Indexes</option>
                        <option value="us">US Market Indexes</option>
                    </select>
                </div>

                {/* Add Individual Stock Section */}
                <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label htmlFor="newSymbol">Add Stock Symbol:</label>
                    <input
                        type="text"
                        id="newSymbol"
                        value={newSymbol}
                        onChange={(e) => setNewSymbol(e.target.value)}
                        placeholder="Enter symbol (e.g., AAPL)"
                        style={{ marginRight: '10px' }}
                        onKeyPress={(e) => e.key === 'Enter' && addStock()}
                    />
                    <button type="button" onClick={addStock} className="submit-btn">
                        Add Stock
                    </button>
                </div>

                {/* Common Parameters */}
                <form>
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="duration">Duration</label>
                            <select
                                id="duration"
                                name="duration"
                                value={formData.duration}
                                onChange={handleInputChange}
                            >
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
                                <option value="1 day">1 Day</option>
                                <option value="1 week">1 Week</option>
                                <option value="1 month">1 Month</option>
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
                        <div className="form-group">
                            <label htmlFor="benchmarkSymbol">Benchmark Symbol</label>
                            <input
                                type="text"
                                id="benchmarkSymbol"
                                value={benchmarkSymbol}
                                onChange={(e) => setBenchmarkSymbol(e.target.value)}
                                placeholder="SPY"
                            />
                        </div>
                    </div>
                </form>
            </div>

            {/* Added Stocks List */}
            {stocks.length > 0 && (
                <div className="form-section">
                    <h3>Added Stocks ({stocks.length})</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {stocks.map((stock) => (
                            <div
                                key={stock.symbol}
                                style={{
                                    padding: '8px 12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    backgroundColor: stock.loading ? '#f0f0f0' : stock.error ? '#ffe6e6' : '#e6f7ff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <span style={{ color: stock.color, fontWeight: 'bold' }}>●</span>
                                <span>{stock.symbol}</span>
                                {stock.loading && <span style={{ fontSize: '12px', color: '#666' }}>Loading...</span>}
                                {stock.error && <span style={{ fontSize: '12px', color: '#d00' }}>Error</span>}
                                <button
                                    onClick={() => removeStock(stock.symbol)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#999',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                    title="Remove"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Chart */}
            {stocks.some(stock => stock.data.length > 0 && !stock.error) && (
                <div className="chart-section">
                    <HighchartsReact
                        highcharts={Highcharts}
                        options={chartOptions}
                    />
                    <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
                        <p><strong>RRG Quadrants:</strong></p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', maxWidth: '600px' }}>
                            <div style={{ padding: '10px', backgroundColor: 'rgba(0, 0, 255, 0.1)', borderRadius: '4px' }}>
                                <strong style={{ color: '#004bb3' }}>IMPROVING (Top-Left)</strong><br />
                                Strong momentum, weak relative strength
                            </div>
                            <div style={{ padding: '10px', backgroundColor: 'rgba(0, 255, 0, 0.1)', borderRadius: '4px' }}>
                                <strong style={{ color: '#008224' }}>LEADING (Top-Right)</strong><br />
                                Strong momentum, strong relative strength
                            </div>
                            <div style={{ padding: '10px', backgroundColor: 'rgba(255, 0, 0, 0.1)', borderRadius: '4px' }}>
                                <strong style={{ color: '#c80056' }}>LAGGING (Bottom-Left)</strong><br />
                                Weak momentum, weak relative strength
                            </div>
                            <div style={{ padding: '10px', backgroundColor: 'rgba(255, 255, 0, 0.1)', borderRadius: '4px' }}>
                                <strong style={{ color: '#9a5c00' }}>WEAKENING (Bottom-Right)</strong><br />
                                Weak momentum, strong relative strength
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {stocks.length === 0 && (
                <div className="no-data">Add stocks using the controls above to generate the relative rotation graph.</div>
            )}
        </div>
    )
}

export default RelativeRotationGraph