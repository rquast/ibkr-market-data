import express from 'express';
import { MarketDataManager } from '@stoqey/ibkr';
import ibkr from '@stoqey/ibkr';

const app = express();
const port = 3000;

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

app.get('/marketdata/:symbol', async (req, res) => {
  const symbol = req.params.symbol;

  try {
    // Ensure IBKR connection is initialized
    await ibkr();

    // Get MarketDataManager instance
    const mkdManager = MarketDataManager.Instance;

    // Get contract details (optional, but recommended)
    console.log('READ SYMBOL DATA', symbol);
    const contractDetails = await mkdManager.getContract({
      symbol,
      secType: 'STK',
    });

    if (!contractDetails) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const endDateTime = formatUTCDate();
    const duration = '1 D';
    const barSize = '1 min';
    const whatToShow = 'TRADES';
    const useRTH = true;

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

app.get('/historicalticks/:symbol', async (req, res) => {
  const symbol = req.params.symbol;

  try {
    // Ensure IBKR connection is initialized
    await ibkr();

    // Get MarketDataManager instance
    const mkdManager = MarketDataManager.Instance;

    // Get contract details
    console.log('READ HISTORICAL TICKS FOR', symbol);
    const contractDetails = await mkdManager.getContract({
      symbol,
      secType: 'STK',
    });

    if (!contractDetails) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Calculate start date (1 month ago)
    const startDateObj = new Date();
    startDateObj.setMonth(startDateObj.getMonth() - 1);
    const startDate = formatUTCDate(startDateObj);
    
    // Current date as end date
    const endDate = formatUTCDate();
    
    // Number of ticks to retrieve
    const numberOfTicks = 1000; // Adjust as needed
    
    // Use regular trading hours
    const useRTH = true;

    const ticksData = await mkdManager.getHistoricalTicksLast(
      contractDetails,
      startDate,
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
