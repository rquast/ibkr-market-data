import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class HistoricalTicksRequestDto {
  @ApiProperty({
    description: 'Stock symbol (e.g., AAPL, MSFT)',
    example: 'AAPL',
  })
  @IsString()
  symbol: string;

  @ApiPropertyOptional({
    description: 'Security type',
    default: 'STK',
    example: 'STK',
  })
  @IsOptional()
  @IsString()
  secType?: string;

  @ApiPropertyOptional({
    description: "Start date and time in format 'yyyymmdd-hh:mm:ss', defaults to 3 months ago",
    example: '20230101-00:00:00',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: "End date and time in format 'yyyymmdd-hh:mm:ss'",
    example: '20230131-23:59:59',
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Maximum number of ticks to retrieve',
    default: 1000,
    example: 500,
  })
  @IsOptional()
  @IsNumber()
  numberOfTicks?: number;

  @ApiPropertyOptional({
    description: 'Use regular trading hours only',
    default: true,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  useRTH?: boolean;
}