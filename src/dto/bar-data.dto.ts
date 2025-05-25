import { ApiProperty } from '@nestjs/swagger';

export class BarDataDto {
  @ApiProperty({
    description: 'Date and time of the bar',
    example: '2023-06-30T16:00:00.000Z',
  })
  date: string;

  @ApiProperty({
    description: 'Opening price',
    example: 185.34,
  })
  open: number;

  @ApiProperty({
    description: 'Highest price during the bar',
    example: 186.12,
  })
  high: number;

  @ApiProperty({
    description: 'Lowest price during the bar',
    example: 185.21,
  })
  low: number;

  @ApiProperty({
    description: 'Closing price',
    example: 185.92,
  })
  close: number;

  @ApiProperty({
    description: 'Trading volume',
    example: 12500,
  })
  volume: number;
}