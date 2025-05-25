import { useState } from 'react'
import MarketDataChart from './components/MarketDataChart'
import HistoricalTicksChart from './components/HistoricalTicksChart'

function App() {
  const [activeTab, setActiveTab] = useState('marketdata')

  return (
    <div className="container">
      <header className="header">
        <h1>IBKR Market Data Dashboard</h1>
        <p>Interactive visualization of Interactive Brokers market data</p>
      </header>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'marketdata' ? 'active' : ''}`}
          onClick={() => setActiveTab('marketdata')}
        >
          Historical Bar Data
        </button>
        <button
          className={`tab ${activeTab === 'historicalticks' ? 'active' : ''}`}
          onClick={() => setActiveTab('historicalticks')}
        >
          Historical Tick Data
        </button>
      </div>

      {activeTab === 'marketdata' && <MarketDataChart />}
      {activeTab === 'historicalticks' && <HistoricalTicksChart />}
    </div>
  )
}

export default App