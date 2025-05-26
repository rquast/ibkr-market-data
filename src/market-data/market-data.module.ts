import { Module } from '@nestjs/common';
import { MarketDataController } from './market-data.controller';
import { MarketDataService } from './market-data.service';
import { QuestDBService } from './questdb.service';

@Module({
  controllers: [MarketDataController],
  providers: [MarketDataService, QuestDBService],
})
export class MarketDataModule {}