import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { MarketDataService } from './market-data.service';
import { MarketDataRequestDto } from '../dto/market-data-request.dto';
import { HistoricalTicksRequestDto } from '../dto/historical-ticks-request.dto';
import { BarDataDto } from '../dto/bar-data.dto';
import { TickDataDto } from '../dto/tick-data.dto';
import { ErrorDto } from '../dto/error.dto';

@ApiTags('Market Data')
@Controller()
export class MarketDataController {
  constructor(private readonly marketDataService: MarketDataService) {}

  @Post('marketdata')
  @ApiOperation({
    summary: 'Get historical bar data for a symbol',
    description: 'Returns historical bar data (OHLC) for a given stock symbol with customizable parameters',
  })
  @ApiBody({
    type: MarketDataRequestDto,
    examples: {
      simple: {
        value: {
          symbol: 'AAPL',
          duration: '2 D',
          barSize: '5 mins',
        },
      },
      full: {
        value: {
          symbol: 'MSFT',
          secType: 'STK',
          endDateTime: '20230630-16:00:00',
          duration: '3 D',
          barSize: '15 mins',
          whatToShow: 'TRADES',
          useRTH: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Historical bar data retrieved successfully',
    type: [BarDataDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - missing required parameters',
    type: ErrorDto,
    example: { error: 'Symbol is required' },
  })
  @ApiResponse({
    status: 404,
    description: 'Contract not found',
    type: ErrorDto,
    example: { error: 'Contract not found' },
  })
  @ApiResponse({
    status: 500,
    description: 'Server error',
    type: ErrorDto,
    example: { error: 'Failed to connect to IBKR' },
  })
  async getMarketData(@Body() request: MarketDataRequestDto) {
    if (!request.symbol) {
      throw new HttpException('Symbol is required', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.marketDataService.getHistoricalData(request);
    } catch (error) {
      if (error.message === 'Contract not found') {
        throw new HttpException('Contract not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        (error as Error).message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('historicalticks')
  @ApiOperation({
    summary: 'Get historical tick data for a symbol',
    description: 'Returns historical tick-by-tick data for a given stock symbol with customizable parameters',
  })
  @ApiBody({
    type: HistoricalTicksRequestDto,
    examples: {
      simple: {
        value: {
          symbol: 'AAPL',
        },
      },
      full: {
        value: {
          symbol: 'AAPL',
          secType: 'STK',
          startDate: '20230101-00:00:00',
          endDate: '20230131-23:59:59',
          numberOfTicks: 500,
          useRTH: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Historical tick data retrieved successfully',
    type: [TickDataDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - missing required parameters',
    type: ErrorDto,
    example: { error: 'Symbol is required' },
  })
  @ApiResponse({
    status: 404,
    description: 'Contract not found',
    type: ErrorDto,
    example: { error: 'Contract not found' },
  })
  @ApiResponse({
    status: 500,
    description: 'Server error',
    type: ErrorDto,
    example: { error: 'Failed to connect to IBKR' },
  })
  async getHistoricalTicks(@Body() request: HistoricalTicksRequestDto) {
    if (!request.symbol) {
      throw new HttpException('Symbol is required', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.marketDataService.getHistoricalTicks(request);
    } catch (error) {
      if (error.message === 'Contract not found') {
        throw new HttpException('Contract not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        (error as Error).message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}