# IBKR Market Data API with React Dashboard

A NestJS API server with an integrated React frontend for Interactive Brokers market data visualization using Highcharts.

## Features

### API Endpoints
- **POST /marketdata** - Get historical bar data (OHLC) for stocks
- **POST /historicalticks** - Get historical tick-by-tick data

### Frontend Dashboard
- Interactive forms for all API endpoints
- Real-time stock charts using Highcharts
- Candlestick charts with volume for market data
- Price and size charts for tick data
- Responsive design with modern UI

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Interactive Brokers TWS or IB Gateway running
- Valid IBKR account with market data permissions

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Build the complete application:**
   ```bash
   npm run build
   ```

3. **Start the server:**
   ```bash
   npm run start:prod
   ```

4. **Access the dashboard:**
   Open http://localhost:3000 in your browser

## Development

### Run in development mode:
```bash
# Start NestJS API server with hot reload
npm run start:dev

# In another terminal, start React frontend with hot reload
npm run dev:frontend
```

The frontend will proxy API requests to the NestJS server running on port 3000.

### Available Scripts

- `npm run build` - Build both frontend and backend
- `npm run build:frontend` - Build only the React frontend
- `npm run start:dev` - Start NestJS server in development mode
- `npm run dev:frontend` - Start React frontend in development mode
- `npm run start:prod` - Start production server
- `npm test` - Run tests

## API Usage Examples

### Get Market Data
```bash
curl -X POST http://localhost:3000/marketdata \\
  -H "Content-Type: application/json" \\
  -d '{
    "symbol": "AAPL",
    "duration": "2 D",
    "barSize": "5 mins"
  }'
```

### Get Historical Ticks
```bash
curl -X POST http://localhost:3000/historicalticks \\
  -H "Content-Type: application/json" \\
  -d '{
    "symbol": "AAPL",
    "numberOfTicks": 1000
  }'
```

## Frontend Features

### Market Data Tab
- **Interactive Form**: Input fields for symbol, security type, duration, bar size, etc.
- **Candlestick Chart**: OHLC data with volume using Highcharts Stock
- **Real-time Updates**: Form submission triggers chart updates

### Historical Ticks Tab
- **Tick Parameters**: Configure symbol, date range, number of ticks
- **Dual Charts**: 
  - Price chart showing tick-by-tick price movements
  - Volume chart showing trade sizes over time

### UI Components
- Modern, responsive design
- Form validation
- Loading states
- Error handling
- Professional styling

## Configuration

### Environment Variables
Create a `.env` file in the root directory:
```env
# IBKR Connection Settings
IBKR_HOST=127.0.0.1
IBKR_PORT=7497
IBKR_CLIENT_ID=1

# Server Settings
PORT=3000
```

### Chart Customization
Charts can be customized by modifying the Highcharts options in:
- `frontend/src/components/MarketDataChart.tsx`
- `frontend/src/components/HistoricalTicksChart.tsx`

## Architecture

```
├── src/                          # NestJS backend
│   ├── market-data/             # Market data module
│   ├── dto/                     # Data transfer objects
│   └── main.ts                  # Application entry point
├── frontend/                     # React frontend
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── App.tsx             # Main application
│   │   └── main.tsx            # Frontend entry point
│   └── dist/                   # Built frontend files
└── package.json                # Root package configuration
```

## API Documentation

Interactive API documentation available at:
- **Swagger UI**: http://localhost:3000/api (when server is running)

## Troubleshooting

### Common Issues

1. **Connection to IBKR fails**
   - Ensure TWS/IB Gateway is running
   - Check connection settings in `.env`
   - Verify API permissions are enabled in TWS

2. **Charts not displaying**
   - Check browser console for errors
   - Ensure data is being returned from API
   - Verify Highcharts is loading properly

3. **Build failures**
   - Run `npm install` in both root and frontend directories
   - Check TypeScript compilation errors
   - Ensure all dependencies are installed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## License

ISC License