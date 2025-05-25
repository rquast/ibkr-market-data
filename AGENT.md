# Agent Guidelines for IBKR Market Data API (NestJS)

## Commands
- Build: `npm run build`
- Development: `npm run start:dev`
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