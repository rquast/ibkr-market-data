import { Injectable } from '@nestjs/common';
import { MarketDataManager } from '@stoqey/ibkr';
import ibkr from '@stoqey/ibkr';
import { MarketDataRequestDto } from '../dto/market-data-request.dto';
import { HistoricalTicksRequestDto } from '../dto/historical-ticks-request.dto';

@Injectable()
export class MarketDataService {
  private formatUTCDate(date: Date = new Date()): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}-${hours}:${minutes}:${seconds}`;
  }

  async getHistoricalData(request: MarketDataRequestDto) {
    const {
      symbol,
      secType = 'STK',
      endDateTime = this.formatUTCDate(),
      duration = '1 D',
      barSize = '1 min',
      whatToShow = 'TRADES',
      useRTH = true
    } = request;

    // Ensure IBKR connection is initialized
    await ibkr();

    // Get MarketDataManager instance
    const mkdManager = MarketDataManager.Instance;

    // Get contract details
    console.log('READ SYMBOL DATA', symbol);
    const contractDetails = await mkdManager.getContract({
      symbol,
      secType,
    });

    if (!contractDetails) {
      throw new Error('Contract not found');
    }

    const marketData = await mkdManager.getHistoricalData(
      contractDetails,
      endDateTime,
      duration,
      barSize as any,
      whatToShow as any,
      useRTH
    );

    return marketData;
  }

  async getHistoricalTicks(request: HistoricalTicksRequestDto) {
    const {
      symbol,
      secType = 'STK',
      startDate,
      endDate = this.formatUTCDate(),
      numberOfTicks = 1000,
      useRTH = true
    } = request;

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
      throw new Error('Contract not found');
    }

    // Calculate start date (1 month ago) if not provided
    let formattedStartDate = startDate;
    if (!startDate) {
      const startDateObj = new Date();
      startDateObj.setMonth(startDateObj.getMonth() - 1);
      formattedStartDate = this.formatUTCDate(startDateObj);
    }

    const ticksData = await mkdManager.getHistoricalTicksLast(
      contractDetails,
      formattedStartDate,
      endDate,
      numberOfTicks,
      useRTH
    );

    return ticksData;
  }
}