import { Injectable } from '@nestjs/common';
import { MarketDataManager } from '@stoqey/ibkr';
import ibkr from '@stoqey/ibkr';
import { MarketDataRequestDto } from '../dto/market-data-request.dto';
import { HistoricalTicksRequestDto } from '../dto/historical-ticks-request.dto';
import { QuestDBService } from './questdb.service';

@Injectable()
export class MarketDataService {
  constructor(private readonly questDBService: QuestDBService) {}
  private formatUTCDate(date: Date = new Date()): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}-${hours}:${minutes}:${seconds}`;
  }

  private parseDateTime(dateTimeStr: string): Date {
    // Parse format: yyyymmdd-hh:mm:ss
    const [datePart, timePart] = dateTimeStr.split('-');
    const year = parseInt(datePart.substring(0, 4));
    const month = parseInt(datePart.substring(4, 6)) - 1; // Month is 0-indexed
    const day = parseInt(datePart.substring(6, 8));
    
    const [hours, minutes, seconds] = timePart.split(':').map(s => parseInt(s));
    
    return new Date(Date.UTC(year, month, day, hours, minutes, seconds));
  }

  private calculateStartTime(endTime: Date, duration: string): Date {
    const [value, unit] = duration.split(' ');
    const num = parseInt(value);
    const startTime = new Date(endTime);

    switch (unit.toUpperCase()) {
      case 'S':
      case 'SEC':
      case 'SECS':
        startTime.setUTCSeconds(startTime.getUTCSeconds() - num);
        break;
      case 'D':
      case 'DAY':
      case 'DAYS':
        startTime.setUTCDate(startTime.getUTCDate() - num);
        break;
      case 'W':
      case 'WEEK':
      case 'WEEKS':
        startTime.setUTCDate(startTime.getUTCDate() - (num * 7));
        break;
      case 'M':
      case 'MONTH':
      case 'MONTHS':
        startTime.setUTCMonth(startTime.getUTCMonth() - num);
        break;
      case 'Y':
      case 'YEAR':
      case 'YEARS':
        startTime.setUTCFullYear(startTime.getUTCFullYear() - num);
        break;
      default:
        // Default to days
        startTime.setUTCDate(startTime.getUTCDate() - num);
    }

    return startTime;
  }

  private calculateDuration(startTime: Date, endTime: Date): string {
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) {
      const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
      if (diffHours <= 1) {
        const diffMins = Math.ceil(diffMs / (1000 * 60));
        return `${diffMins} S`; // Use seconds for very short durations
      }
      return `${diffHours * 3600} S`; // Convert hours to seconds
    }
    
    return `${diffDays} D`;
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

    // Parse the time range from duration and endDateTime
    const endTime = this.parseDateTime(endDateTime);
    const startTime = this.calculateStartTime(endTime, duration);

    console.log(`Checking for existing data: ${symbol} from ${startTime.toISOString()} to ${endTime.toISOString()}`);

    // First, get existing data from QuestDB
    const existingData = await this.questDBService.getMarketData(
      symbol,
      barSize,
      startTime,
      endTime,
      secType,
      whatToShow,
      useRTH
    );

    console.log(`Found ${existingData.length} existing records for ${symbol}`);

    // Check for gaps in existing data
    const gaps = await this.questDBService.findDataGaps(
      symbol,
      barSize,
      startTime,
      endTime,
      secType,
      whatToShow,
      useRTH
    );

    console.log(`Found ${gaps.length} data gaps for ${symbol}`);

    let newGapData: any[] = [];

    if (gaps.length > 0) {
      // Ensure IBKR connection is initialized
      await ibkr();
      const mkdManager = MarketDataManager.Instance;

      // Get contract details
      console.log('Getting contract details for', symbol);
      const contractDetails = await mkdManager.getContract({
        symbol,
        secType,
      });

      if (!contractDetails) {
        throw new Error('Contract not found');
      }

      // Fetch data for each gap
      for (const gap of gaps) {
        const gapDuration = this.calculateDuration(gap.start, gap.end);
        const gapEndDateTime = this.formatUTCDate(gap.end);
        
        console.log(`Fetching gap: ${gap.start.toISOString()} to ${gap.end.toISOString()} (${gapDuration})`);

        const gapData = await mkdManager.getHistoricalData(
          contractDetails,
          gapEndDateTime,
          gapDuration,
          barSize as any,
          whatToShow as any,
          useRTH
        );

        if (gapData && gapData.length > 0) {
          // Store the gap data
          const normalizedRequest = {
            symbol,
            secType,
            endDateTime: gapEndDateTime,
            duration: gapDuration,
            barSize,
            whatToShow,
            useRTH
          };

          await this.questDBService.storeMarketData(symbol, normalizedRequest, gapData);
          newGapData = newGapData.concat(gapData);
          console.log(`Fetched and stored ${gapData.length} records for gap`);
        }
      }
    }

    // Combine existing data with new gap data
    const allData = [...existingData, ...newGapData];
    
    // Sort by timestamp to ensure proper chronological order
    allData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Remove duplicates by timestamp (in case of overlapping data)
    const uniqueData = allData.filter((item, index, array) => {
      return index === 0 || new Date(item.date).getTime() !== new Date(array[index - 1].date).getTime();
    });

    console.log(`Returning ${uniqueData.length} total records for ${symbol} (${existingData.length} existing + ${newGapData.length} new)`);
    return uniqueData;
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

    // Calculate start date (3 months ago) if not provided
    let formattedStartDate = startDate;
    let startTime: Date;
    if (!startDate) {
      const startDateObj = new Date();
      startDateObj.setMonth(startDateObj.getMonth() - 3);
      formattedStartDate = this.formatUTCDate(startDateObj);
      startTime = startDateObj;
    } else {
      startTime = this.parseDateTime(startDate);
    }

    const endTime = this.parseDateTime(endDate);

    console.log(`Checking for existing tick data: ${symbol} from ${startTime.toISOString()} to ${endTime.toISOString()}`);

    // Check existing tick data
    const existingTicks = await this.questDBService.getTickData(
      symbol,
      startTime,
      endTime,
      secType
    );

    console.log(`Found ${existingTicks.length} existing tick records for ${symbol}`);

    // If we have enough existing data, return it
    if (existingTicks.length >= numberOfTicks) {
      const sortedTicks = existingTicks.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
      return sortedTicks.slice(-numberOfTicks); // Return the most recent ticks
    }

    // If we need more data, fetch from IBKR
    const ticksNeeded = numberOfTicks - existingTicks.length;
    
    console.log(`Fetching ${ticksNeeded} additional ticks for ${symbol}`);

    let newTicksData: any[] = [];

    // Ensure IBKR connection is initialized
    await ibkr();
    const mkdManager = MarketDataManager.Instance;

    // Get contract details
    console.log('Getting contract details for tick data:', symbol);
    const contractDetails = await mkdManager.getContract({
      symbol,
      secType,
    });

    if (!contractDetails) {
      throw new Error('Contract not found');
    }

    const fetchedTicks = await mkdManager.getHistoricalTicksLast(
      contractDetails,
      formattedStartDate,
      endDate,
      ticksNeeded,
      useRTH
    );

    if (fetchedTicks && fetchedTicks.length > 0) {
      // Store new tick data
      const normalizedRequest = {
        symbol,
        secType,
        startDate: formattedStartDate,
        endDate,
        numberOfTicks: ticksNeeded,
        useRTH
      };

      await this.questDBService.storeTickData(symbol, normalizedRequest, fetchedTicks);
      newTicksData = fetchedTicks;
      console.log(`Fetched and stored ${fetchedTicks.length} new tick records`);
    }

    // Combine existing and new tick data
    const allTicks = [...existingTicks, ...newTicksData];
    
    // Sort by timestamp and remove duplicates
    const sortedTicks = allTicks.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    const uniqueTicks = sortedTicks.filter((item, index, array) => {
      return index === 0 || new Date(item.time).getTime() !== new Date(array[index - 1].time).getTime();
    });

    console.log(`Returning ${uniqueTicks.length} total tick records for ${symbol} (${existingTicks.length} existing + ${newTicksData.length} new)`);
    return uniqueTicks.slice(-numberOfTicks); // Return the most recent ticks up to the requested number
  }
}