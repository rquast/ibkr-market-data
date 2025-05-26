import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Sender } from '@questdb/nodejs-client';

export interface MarketDataRecord {
  timestamp: Date;
  symbol: string;
  exchange?: string;
  bar_size: string;
  sec_type: string;
  what_to_show: string;
  duration: string;
  use_rth: boolean;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
  count?: number;
  wap?: number;
  has_gaps?: boolean;
}

export interface TickDataRecord {
  timestamp: Date;
  symbol: string;
  exchange?: string;
  sec_type: string;
  tick_timestamp: Date;
  price: number;
  size: number;
  exchange_code?: string;
  special_conditions?: string;
}

@Injectable()
export class QuestDBService implements OnModuleInit, OnModuleDestroy {
  private sender: Sender;
  private isConnected = false;

  async onModuleInit() {
    await this.connect();
    await this.initializeTables();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    try {
      // Use the configuration string approach for QuestDB connection
      this.sender = Sender.fromConfig('tcp::addr=localhost:9009;');
      await this.sender.connect();
      this.isConnected = true;
      console.log('Connected to QuestDB');
    } catch (error) {
      console.error('Failed to connect to QuestDB:', error);
      throw new Error('QuestDB connection failed');
    }
  }

  private async disconnect(): Promise<void> {
    if (this.sender && this.isConnected) {
      await this.sender.close();
      this.isConnected = false;
      console.log('Disconnected from QuestDB');
    }
  }

  private async initializeTables(): Promise<void> {
    try {
      // Create sample market_data record to initialize table structure
      // All symbols must be added first, then all other columns
      await this.sender
        .table('market_data')
        .symbol('symbol', 'INIT')
        .symbol('exchange', 'SMART') 
        .symbol('bar_size', '1 min')
        .symbol('sec_type', 'STK')
        .symbol('what_to_show', 'TRADES')
        .symbol('duration', '1 D')
        .booleanColumn('use_rth', true)
        .floatColumn('open', 0.0)
        .floatColumn('high', 0.0)
        .floatColumn('low', 0.0)
        .floatColumn('close', 0.0)
        .intColumn('volume', 0)
        .intColumn('count', 0)
        .floatColumn('wap', 0.0)
        .booleanColumn('has_gaps', false)
        .timestampColumn('timestamp', Date.now())
        .atNow();

      // Create sample tick_data record to initialize table structure
      // All symbols must be added first, then all other columns
      await this.sender
        .table('tick_data')
        .symbol('symbol', 'INIT')
        .symbol('exchange', 'SMART')
        .symbol('sec_type', 'STK')
        .symbol('exchange_code', '')
        .timestampColumn('tick_timestamp', Date.now())
        .floatColumn('price', 0.0)
        .intColumn('size', 0)
        .stringColumn('special_conditions', '')
        .timestampColumn('timestamp', Date.now())
        .atNow();

      await this.sender.flush();
      console.log('QuestDB tables initialized');
    } catch (error) {
      console.error('Error initializing QuestDB tables:', error);
    }
  }

  async storeMarketData(
    symbol: string,
    request: any,
    marketData: any[]
  ): Promise<void> {
    if (!this.isConnected) {
      throw new Error('QuestDB not connected');
    }

    try {
      for (const bar of marketData) {
        const record: MarketDataRecord = {
          timestamp: new Date(bar.date),
          symbol: symbol.toUpperCase(),
          exchange: request.exchange || 'SMART',
          bar_size: request.barSize || '1 min',
          sec_type: request.secType || 'STK',
          what_to_show: request.whatToShow || 'TRADES',
          duration: request.duration || '1 D',
          use_rth: request.useRTH ?? true,
          open: bar.open ?? 0,
          high: bar.high ?? 0,
          low: bar.low ?? 0,
          close: bar.close ?? 0,
          volume: bar.volume ?? 0,
          count: bar.count ?? 0,
          wap: bar.wap ?? 0,
          has_gaps: bar.hasGaps ?? false
        };

        await this.sender
          .table('market_data')
          .symbol('symbol', record.symbol)
          .symbol('exchange', record.exchange)
          .symbol('bar_size', record.bar_size)
          .symbol('sec_type', record.sec_type)
          .symbol('what_to_show', record.what_to_show)
          .symbol('duration', record.duration)
          .booleanColumn('use_rth', record.use_rth)
          .floatColumn('open', record.open)
          .floatColumn('high', record.high)
          .floatColumn('low', record.low)
          .floatColumn('close', record.close)
          .intColumn('volume', record.volume)
          .intColumn('count', record.count)
          .floatColumn('wap', record.wap)
          .booleanColumn('has_gaps', record.has_gaps)
          .timestampColumn('timestamp', record.timestamp.getTime())
          .atNow();
      }

      await this.sender.flush();
      console.log(`Stored ${marketData.length} market data records for ${symbol}`);
      
      // Wait a moment for data to be available for querying
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Error storing market data:', error);
      throw error;
    }
  }

  async storeTickData(
    symbol: string,
    request: any,
    tickData: any[]
  ): Promise<void> {
    if (!this.isConnected) {
      throw new Error('QuestDB not connected');
    }

    try {
      for (const tick of tickData) {
        const record: TickDataRecord = {
          timestamp: new Date(),
          symbol: symbol.toUpperCase(),
          exchange: request.exchange || 'SMART',
          sec_type: request.secType || 'STK',
          tick_timestamp: new Date(tick.time),
          price: tick.price ?? 0,
          size: tick.size ?? 0,
          exchange_code: tick.exchange || '',
          special_conditions: tick.specialConditions || ''
        };

        await this.sender
          .table('tick_data')
          .symbol('symbol', record.symbol)
          .symbol('exchange', record.exchange)
          .symbol('sec_type', record.sec_type)
          .timestampColumn('tick_timestamp', record.tick_timestamp.getTime())
          .floatColumn('price', record.price)
          .intColumn('size', record.size)
          .symbol('exchange_code', record.exchange_code || '')
          .stringColumn('special_conditions', record.special_conditions || '')
          .timestampColumn('timestamp', record.timestamp.getTime())
          .atNow();
      }

      await this.sender.flush();
      console.log(`Stored ${tickData.length} tick data records for ${symbol}`);
    } catch (error) {
      console.error('Error storing tick data:', error);
      throw error;
    }
  }

  async getMarketData(
    symbol: string,
    barSize: string,
    startTime?: Date,
    endTime?: Date,
    secType = 'STK',
    whatToShow = 'TRADES',
    useRTH = true
  ): Promise<any[]> {
    if (!this.isConnected) {
      throw new Error('QuestDB not connected');
    }

    try {
      // Build the query with proper escaping and formatting
      let query = `
        SELECT timestamp, open, high, low, close, volume, count, wap, has_gaps
        FROM market_data 
        WHERE symbol = '${symbol.toUpperCase()}'
          AND bar_size = '${barSize}'
          AND sec_type = '${secType}'
          AND what_to_show = '${whatToShow}'
          AND use_rth = ${useRTH}
      `;

      if (startTime) {
        query += ` AND timestamp >= '${startTime.toISOString().replace('T', ' ').replace('Z', '')}'`;
      }
      if (endTime) {
        query += ` AND timestamp <= '${endTime.toISOString().replace('T', ' ').replace('Z', '')}'`;
      }
      
      query += ' ORDER BY timestamp ASC';

      console.log('QuestDB Query:', query.trim());

      const queryParams = new URLSearchParams({ query: query.trim() });
      const response = await fetch(`http://localhost:9000/exec?${queryParams}`);
      
      if (!response.ok) {
        console.error('QuestDB HTTP error:', response.status, response.statusText);
        return [];
      }

      const result = await response.json();
      console.log('QuestDB Response:', JSON.stringify(result, null, 2));
      
      if (result.dataset && Array.isArray(result.dataset)) {
        const mappedData = result.dataset.map((row: any) => ({
          date: row[0],
          open: row[1],
          high: row[2],
          low: row[3],
          close: row[4],
          volume: row[5],
          count: row[6],
          wap: row[7],
          hasGaps: row[8]
        }));
        console.log(`Found ${mappedData.length} records in QuestDB for ${symbol}`);
        return mappedData;
      }
      
      console.log('No dataset found in QuestDB response');
      return [];
    } catch (error) {
      console.error('Error querying QuestDB:', error);
      return [];
    }
  }

  async getTickData(
    symbol: string,
    startTime?: Date,
    endTime?: Date,
    secType = 'STK'
  ): Promise<any[]> {
    if (!this.isConnected) {
      throw new Error('QuestDB not connected');
    }

    try {
      const queryParams = new URLSearchParams({
        query: `
          SELECT tick_timestamp, price, size, exchange_code, special_conditions
          FROM tick_data 
          WHERE symbol = '${symbol.toUpperCase()}'
            AND sec_type = '${secType}'
            ${startTime ? `AND tick_timestamp >= '${startTime.toISOString()}'` : ''}
            ${endTime ? `AND tick_timestamp <= '${endTime.toISOString()}'` : ''}
          ORDER BY tick_timestamp ASC
        `.trim()
      });

      const response = await fetch(`http://localhost:9000/exec?${queryParams}`);
      const result = await response.json();
      
      if (result.dataset) {
        return result.dataset.map((row: any) => ({
          time: row[0],
          price: row[1],
          size: row[2],
          exchange: row[3],
          specialConditions: row[4]
        }));
      }
      
      return [];
    } catch (error) {
      console.warn('Error querying QuestDB, returning empty data:', error);
      return [];
    }
  }

  async findDataGaps(
    symbol: string,
    barSize: string,
    startTime: Date,
    endTime: Date,
    secType = 'STK',
    whatToShow = 'TRADES',
    useRTH = true
  ): Promise<{ start: Date; end: Date }[]> {
    const existingData = await this.getMarketData(
      symbol,
      barSize,
      startTime,
      endTime,
      secType,
      whatToShow,
      useRTH
    );

    if (existingData.length === 0) {
      return [{ start: startTime, end: endTime }];
    }

    const gaps: { start: Date; end: Date }[] = [];
    const barSizeMs = this.parseBarSizeToMs(barSize);
    
    // Check for gap at the beginning
    const firstDataTime = new Date(existingData[0].date);
    if (firstDataTime.getTime() > startTime.getTime()) {
      gaps.push({ start: startTime, end: new Date(firstDataTime.getTime() - barSizeMs) });
    }

    // Check for gaps between data points
    for (let i = 1; i < existingData.length; i++) {
      const prevTime = new Date(existingData[i - 1].date);
      const currTime = new Date(existingData[i].date);
      const expectedNextTime = new Date(prevTime.getTime() + barSizeMs);
      
      if (currTime.getTime() > expectedNextTime.getTime()) {
        gaps.push({ start: expectedNextTime, end: new Date(currTime.getTime() - barSizeMs) });
      }
    }

    // Check for gap at the end
    const lastDataTime = new Date(existingData[existingData.length - 1].date);
    if (lastDataTime.getTime() < endTime.getTime()) {
      gaps.push({ start: new Date(lastDataTime.getTime() + barSizeMs), end: endTime });
    }

    return gaps;
  }

  private parseBarSizeToMs(barSize: string): number {
    const [value, unit] = barSize.split(' ');
    const num = parseInt(value);
    
    switch (unit) {
      case 'sec':
      case 'secs':
        return num * 1000;
      case 'min':
      case 'mins':
        return num * 60 * 1000;
      case 'hour':
      case 'hours':
        return num * 60 * 60 * 1000;
      case 'day':
      case 'days':
        return num * 24 * 60 * 60 * 1000;
      default:
        return 60 * 1000; // Default to 1 minute
    }
  }

  async debugDataCount(symbol: string): Promise<number> {
    try {
      const query = `SELECT count(*) FROM market_data WHERE symbol = '${symbol.toUpperCase()}'`;
      console.log('Debug count query:', query);
      
      const queryParams = new URLSearchParams({ query });
      const response = await fetch(`http://localhost:9000/exec?${queryParams}`);
      const result = await response.json();
      
      console.log('Debug count response:', JSON.stringify(result, null, 2));
      
      if (result.dataset && result.dataset[0]) {
        return result.dataset[0][0];
      }
      return 0;
    } catch (error) {
      console.error('Error in debug count:', error);
      return 0;
    }
  }
}