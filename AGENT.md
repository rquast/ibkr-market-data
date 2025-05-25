# Agent Guidelines for IBKR Market Data API

## Commands
- Build: `npm run build`
- Development: `npm run dev` 
- Production: `npm start`
- TypeScript check: `npx tsc --noEmit`
- No test framework configured yet

## Code Style
- **Language**: TypeScript with strict mode enabled
- **Imports**: Use ES6 imports (`import express from 'express'`)
- **Naming**: camelCase for variables/functions, PascalCase for types/classes
- **Types**: Explicit typing preferred, use `any` sparingly with comment
- **Error handling**: Try/catch blocks with typed error casting `(error as Error).message`
- **Async/await**: Preferred over promises
- **Comments**: Minimal inline comments, prefer self-documenting code
- **Destructuring**: Use object destructuring for request bodies with defaults
- **API responses**: JSON format with consistent error structure `{ error: string }`
- **Express middleware**: Custom CORS middleware, JSON body parsing
- **Formatting**: 2-space indentation, semicolons required

## Architecture
- Single file Express server in `src/server.ts`
- Uses @stoqey/ibkr for IBKR connectivity
- POST endpoints for market data operations
- UTC date formatting: `yyyymmdd-hh:mm:ss`