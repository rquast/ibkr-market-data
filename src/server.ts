import express from 'express';
import { MarketDataManager } from '@stoqey/ibkr';
import ibkr from '@stoqey/ibkr';

const app = express();
const port = 3000;

// Add middleware to parse JSON bodies
app.use(express.json());

// Add CORS middleware to allow requests from any origin
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Helper function to format date in UTC format: yyyymmdd-hh:mm:ss
const formatUTCDate = (date: Date = new Date()) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}-${hours}:${minutes}:${seconds}`;
};

app.post('/marketdata', async (req, res) => {
  const { 
    symbol, 
    secType = 'STK',
    endDateTime = formatUTCDate(),
    duration = '1 D',
    barSize = '1 min',
    whatToShow = 'TRADES',
    useRTH = true
  } = req.body;

  if (!symbol) {
    return res.status(400).json({ error: 'Symbol is required' });
  }

  try {
    // Ensure IBKR connection is initialized
    await ibkr();

    // Get MarketDataManager instance
    const mkdManager = MarketDataManager.Instance;

    // Get contract details (optional, but recommended)
    console.log('READ SYMBOL DATA', symbol);
    const contractDetails = await mkdManager.getContract({
      symbol,
      secType,
    });

    if (!contractDetails) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const marketData = await mkdManager.getHistoricalData(
      contractDetails,
      endDateTime,
      duration,
      barSize as any,
      whatToShow,
      useRTH
    );

    res.json(marketData);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/historicalticks', async (req, res) => {
  const { 
    symbol, 
    secType = 'STK',
    startDate,
    endDate = formatUTCDate(),
    numberOfTicks = 1000,
    useRTH = true
  } = req.body;

  if (!symbol) {
    return res.status(400).json({ error: 'Symbol is required' });
  }

  try {
    // Ensure IBKR connection is initialized
    await ibkr();

    // Get MarketDataManager instance
    const mkdManager = MarketDataManager.Instance;

    // Get contract details
    console.log('READ HISTORICAL TICKS FOR', symbol);
    const contractDetails = await mkdManager.getContract({
      symbol,
      secType,
    });

    if (!contractDetails) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Calculate start date (1 month ago) if not provided
    let formattedStartDate = startDate;
    if (!startDate) {
      const startDateObj = new Date();
      startDateObj.setMonth(startDateObj.getMonth() - 1);
      formattedStartDate = formatUTCDate(startDateObj);
    }

    const ticksData = await mkdManager.getHistoricalTicksLast(
      contractDetails,
      formattedStartDate,
      endDate,
      numberOfTicks,
      useRTH
    );

    res.json(ticksData);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.listen(port, () => {
  console.log(`IBKR market data server running at http://localhost:${port}`);
});
