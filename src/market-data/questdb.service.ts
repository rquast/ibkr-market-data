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
    endTime?: Date
  ): Promise<any[]> {
    // For now, return empty array since we're primarily storing
    // In a full implementation, you'd use QuestDB's REST API or Postgres wire protocol
    return [];
  }

  async getTickData(
    symbol: string,
    startTime?: Date,
    endTime?: Date
  ): Promise<any[]> {
    // For now, return empty array since we're primarily storing
    // In a full implementation, you'd use QuestDB's REST API or Postgres wire protocol
    return [];
  }

  async checkIfDataExists(
    symbol: string,
    barSize: string,
    timestamp: Date
  ): Promise<boolean> {
    // For now, return false to always store new data
    // In a full implementation, you'd query QuestDB to check existence
    return false;
  }
}