import { ApiProperty } from '@nestjs/swagger';

export class ErrorDto {
  @ApiProperty({
    description: 'Error message',
    example: 'Symbol is required',
  })
  error: string;
}