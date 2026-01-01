# Crypto MAME Bridge Dashboard

## Overview

A real-time cryptocurrency trading signal dashboard that connects to Binance and Coinbase WebSocket feeds to monitor trade volumes. When buy or sell quantities exceed configurable thresholds, the system can trigger keyboard inputs for MAME arcade controls. The web dashboard provides live visualization of trading activity and configuration management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Charts**: Recharts for volume visualization
- **Animations**: Framer Motion for UI transitions
- **Build Tool**: Vite with HMR support

The frontend connects to two WebSocket feeds:
1. Binance: `wss://stream.binance.com:9443/ws/<symbol>@aggTrade`
2. Coinbase: `wss://ws-feed.exchange.coinbase.com`

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **API Style**: REST endpoints with Zod validation
- **Development**: tsx for TypeScript execution, Vite dev server middleware

### Data Storage
- **Database**: PostgreSQL (required via DATABASE_URL environment variable)
- **Schema**: Single `configurations` table storing trading parameters for both exchanges
- **Session**: connect-pg-simple for PostgreSQL session storage (available but not currently used)

### API Structure
Two endpoints defined in `shared/routes.ts`:
- `GET /api/configurations` - Retrieve current configuration
- `POST /api/configurations` - Update configuration

Configuration includes:
- Binance: symbol, buy/sell thresholds, keyboard keys
- Coinbase: symbol, buy/sell thresholds, keyboard keys
- Global active toggle

### Key Design Patterns
- **Shared Types**: Schema and route definitions in `shared/` directory used by both client and server
- **Type-safe API**: Zod schemas validate both request bodies and response structures
- **Component Library**: shadcn/ui components in `client/src/components/ui/`
- **Custom Hooks**: WebSocket connections and configuration management abstracted into hooks

## External Dependencies

### Cryptocurrency Data Sources
- **Binance WebSocket**: Real-time aggregated trade stream for volume monitoring
- **Coinbase WebSocket**: Real-time match/trade stream for volume monitoring

### Database
- **PostgreSQL**: Required for configuration persistence. Set `DATABASE_URL` environment variable.

### Python Bridge (Optional)
A separate Python script (`bridge.py`) can run locally to:
- Connect to the dashboard API
- Monitor the same WebSocket feeds
- Simulate keyboard presses via pynput for MAME arcade controls
- Requires: `pynput`, `websocket-client`, `requests`

### UI Component Libraries
- Radix UI primitives for accessible components
- Recharts for data visualization
- Framer Motion for animations