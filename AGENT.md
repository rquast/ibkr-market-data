# Agent Guidelines for IBKR Market Data API (NestJS)

## Commands
- Build all: `npm run build` (builds frontend + backend)
- Build frontend only: `npm run build:frontend`
- Development backend: `npm run start:dev`
- Development frontend: `npm run dev:frontend`
- Debug: `npm run start:debug`
- Production: `npm run start:prod`
- Test: `npm run test`
- Test watch: `npm run test:watch`
- Test coverage: `npm run test:cov`
- TypeScript check: Built into NestJS build process

## Code Style
- **Framework**: NestJS with TypeScript decorators
- **Imports**: Use ES6 imports with `@nestjs/*` decorators
- **Naming**: camelCase for variables/functions, PascalCase for DTOs/classes
- **DTOs**: Use class-validator decorators (`@IsString`, `@IsOptional`)
- **API Documentation**: Use `@nestjs/swagger` decorators (`@ApiProperty`, `@ApiResponse`)
- **Error handling**: NestJS HttpException with proper status codes
- **Validation**: Global ValidationPipe with class-transformer
- **Comments**: OpenAPI descriptions in decorators, minimal inline comments
- **Structure**: Controllers, Services, DTOs in separate files
- **Formatting**: NestJS CLI formatting standards

## Architecture
- **Structure**: Modular NestJS with MarketDataModule
- **Controller**: `src/market-data/market-data.controller.ts` with OpenAPI decorators
- **Service**: `src/market-data/market-data.service.ts` for IBKR logic
- **DTOs**: `src/dto/` for request/response validation
- **Documentation**: Auto-generated at `/api` endpoint
- **IBKR Integration**: Uses @stoqey/ibkr library in service layer
- **Date formatting**: UTC format `yyyymmdd-hh:mm:ss` in service
- **Database**: QuestDB for time-series market data storage
- **Storage**: `src/market-data/questdb.service.ts` replaces file-based caching
- **Tables**: `market_data` (OHLCV bars) and `tick_data` (price ticks)
- **Partitioning**: By exchange, symbol, and bar_size
- **Frontend**: React+TypeScript+Vite in `frontend/` directory
- **Charts**: Highcharts for market data visualization
- **Static serving**: NestJS serves built frontend from `/` route

## QuestDB Setup
- **Connection**: TCP on localhost:9009 (ILP protocol)
- **Auto-initialization**: Tables created automatically on first run
- **Data storage**: Market data partitioned by timestamp, symbol, exchange, bar_size
- **Deduplication**: Store by timestamp and associated data, not response JSON