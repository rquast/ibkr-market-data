# IBKR Market Data API

A web service that connects to Interactive Brokers (IBKR) and provides historical market data through a REST API.

## Prerequisites

- Node.js (v14 or higher)
- Interactive Brokers Trader Workstation (TWS) or IB Gateway running
- TWS/Gateway configured to accept API connections

## Setting Up Interactive Brokers Gateway

### Installation

1. Download IB Gateway from the [Interactive Brokers website](https://www.interactivebrokers.com/en/trading/ibgateway-stable.php)
2. Follow the installation instructions for your operating system
3. You will need an Interactive Brokers account to use the gateway

### Configuration

1. Launch IB Gateway after installation
2. Log in with your Interactive Brokers credentials
3. Configure API settings:
  - Go to Settings/Configuration
  - Select "API" or "Settings" tab
  - Enable "Enable ActiveX and Socket Clients"
  - Set "Socket port" to 4001
  - Check "Allow connections from localhost only" for security
  - Uncheck "Read-Only API" to allow trading (if needed)

### Starting IB Gateway

1. Launch IB Gateway application
2. Select "IB API" mode (not "IB TWS")
3. Enter your username and password
4. Select the appropriate server (Live or Paper Trading)
5. Click "Login"

The gateway must be running before starting this application. The API connection will time out after a period of inactivity, so you may need to periodically interact with the gateway or adjust timeout settings.

## Installation

1. Clone this repository
2. Install dependencies:
 ```
 npm install
 ```
3. Build the project:
 ```
 npm run build
 ```

## Running the Server

Development mode:
```
npm run dev
```

Production mode:
```
npm start
```

## API Endpoints

### Market Data
- `POST /marketdata` - Get historical bar data for a symbol
- `POST /historicalticks` - Get historical tick data for a symbol

## Request Body Parameters

### /marketdata
- `symbol` (required): Stock symbol (e.g., AAPL, MSFT)
- `secType` (optional): Security type, defaults to 'STK'
- `endDateTime` (optional): End date and time in format 'yyyymmdd-hh:mm:ss', defaults to current time
- `duration` (optional): Duration string (e.g., "1 D", "5 D", "1 M"), defaults to "1 D"
- `barSize` (optional): Bar size setting (e.g., "1 min", "5 mins", "1 hour"), defaults to "1 min"
- `whatToShow` (optional): Type of data to retrieve (e.g., "TRADES", "MIDPOINT"), defaults to "TRADES"
- `useRTH` (optional): Use regular trading hours only, defaults to true

### /historicalticks
- `symbol` (required): Stock symbol (e.g., AAPL, MSFT)
- `secType` (optional): Security type, defaults to 'STK'
- `startDate` (optional): Start date and time in format 'yyyymmdd-hh:mm:ss', defaults to 1 month ago
- `endDate` (optional): End date and time in format 'yyyymmdd-hh:mm:ss', defaults to current time
- `numberOfTicks` (optional): Maximum number of ticks to retrieve, defaults to 1000
- `useRTH` (optional): Use regular trading hours only, defaults to true

## Example Usage

```bash
# Get historical bar data for Apple
curl -X POST http://localhost:3000/marketdata \
  -H "Content-Type: application/json" \
  -d '{"symbol": "AAPL", "duration": "2 D", "barSize": "5 mins"}'

# Get historical tick data for Apple with custom parameters
curl -X POST http://localhost:3000/historicalticks \
  -H "Content-Type: application/json" \
  -d '{"symbol": "AAPL", "startDate": "20230101-00:00:00", "endDate": "20230131-23:59:59", "numberOfTicks": 500}'

# Get historical bar data for Microsoft with all parameters specified
curl -X POST http://localhost:3000/marketdata \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "MSFT",
    "secType": "STK",
    "endDateTime": "20230630-16:00:00",
    "duration": "3 D",
    "barSize": "15 mins",
    "whatToShow": "TRADES",
    "useRTH": true
  }'
```

## Server Implementation (src/server.ts)

The `src/server.ts` file implements an Express server that:

1. Creates an Express application listening on port 3000
2. Provides two main endpoints:
  - `POST /marketdata`: Returns historical bar data (OHLC) for a given stock symbol with customizable parameters
  - `POST /historicalticks`: Returns historical tick-by-tick data for a given stock symbol with customizable parameters
3. Connects to Interactive Brokers using the @stoqey/ibkr library
4. Formats dates in the required UTC format for IBKR API calls
5. Handles errors and returns appropriate HTTP status codes

The server automatically establishes a connection to IBKR when API endpoints are accessed and retrieves the necessary contract details before fetching market data.
