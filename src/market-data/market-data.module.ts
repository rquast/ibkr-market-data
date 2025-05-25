import { Module } from '@nestjs/common';
import { MarketDataController } from './market-data.controller';
import { MarketDataService } from './market-data.service';
import { CacheService } from './cache.service';

@Module({
  controllers: [MarketDataController],
  providers: [MarketDataService, CacheService],
})
export class MarketDataModule {}