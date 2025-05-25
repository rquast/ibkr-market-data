import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class MarketDataRequestDto {
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
    description: "End date and time in format 'yyyymmdd-hh:mm:ss'",
    example: '20230630-16:00:00',
  })
  @IsOptional()
  @IsString()
  endDateTime?: string;

  @ApiPropertyOptional({
    description: "Duration string (e.g., '1 D', '5 D', '1 M')",
    default: '1 D',
    example: '2 D',
  })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional({
    description: "Bar size setting (e.g., '1 min', '5 mins', '1 hour')",
    default: '1 min',
    example: '5 mins',
  })
  @IsOptional()
  @IsString()
  barSize?: string;

  @ApiPropertyOptional({
    description: "Type of data to retrieve (e.g., 'TRADES', 'MIDPOINT')",
    default: 'TRADES',
    example: 'TRADES',
  })
  @IsOptional()
  @IsString()
  whatToShow?: string;

  @ApiPropertyOptional({
    description: 'Use regular trading hours only',
    default: true,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  useRTH?: boolean;
}