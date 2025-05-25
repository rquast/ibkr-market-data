import { ApiProperty } from '@nestjs/swagger';

export class TickDataDto {
  @ApiProperty({
    description: 'Time of the tick',
    example: '2023-01-15T14:30:45.000Z',
  })
  time: string;

  @ApiProperty({
    description: 'Price of the tick',
    example: 185.75,
  })
  price: number;

  @ApiProperty({
    description: 'Size of the tick',
    example: 100,
  })
  size: number;
}