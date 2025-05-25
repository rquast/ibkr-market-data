import { Module } from '@nestjs/common';
import { MarketDataModule } from './market-data/market-data.module';

@Module({
  imports: [MarketDataModule],
})
export class AppModule {}