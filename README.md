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
- `GET /marketdata/:symbol` - Get historical bar data for a symbol (e.g., `/marketdata/AAPL`)
- `GET /historicalticks/:symbol` - Get historical tick data for a symbol for the past month (e.g., `/historicalticks/AAPL`)

## Query Parameters

- `symbol` (required): Stock symbol (e.g., AAPL, MSFT)
- `duration` (optional): Duration string (e.g., "1 D", "5 D", "1 M")
- `barSize` (optional): Bar size setting (e.g., "1 min", "5 mins", "1 hour")

## Example Usage

```bash
# Get historical bar data for Apple
curl http://localhost:3000/marketdata/AAPL

# Get historical tick data for Apple (past month)
curl http://localhost:3000/historicalticks/AAPL
```

## Server Implementation (src/server.ts)

The `src/server.ts` file implements an Express server that:

1. Creates an Express application listening on port 3000
2. Provides two main endpoints:
  - `/marketdata/:symbol`: Returns historical bar data (OHLC) for a given stock symbol with 1-day duration and 1-minute bars
  - `/historicalticks/:symbol`: Returns historical tick-by-tick data for a given stock symbol for the past month (up to 1000 ticks)
3. Connects to Interactive Brokers using the @stoqey/ibkr library
4. Formats dates in the required UTC format for IBKR API calls
5. Handles errors and returns appropriate HTTP status codes

The server automatically establishes a connection to IBKR when API endpoints are accessed and retrieves the necessary contract details before fetching market data.
