# Backend - TypeScript Fastify API

A TypeScript-based backend API built with Fastify framework.

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

## Installation

```bash
npm install
```

## Environment Variables

Copy the `.env.example` file to `.env` and update the values:

```bash
cp .env.example .env
```

Available environment variables:
- `PORT` - Server port (default: 5300)
- `HOST` - Server host (default: 0.0.0.0)
- `NODE_ENV` - Environment (development/production)

## Development

Run the development server with hot reload:

```bash
npm run dev
```

The server will start on `http://localhost:5300`

## Building

Build the TypeScript project:

```bash
npm run build
```

## Production

Run the production server:

```bash
npm run build
npm start
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run the production build
- `npm run clean` - Remove build artifacts
- `npm run rebuild` - Clean and rebuild the project

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check endpoint

## Project Structure

```
backend/
├── src/
│   └── index.ts        # Main application entry point
├── dist/               # Compiled JavaScript (generated)
├── tests/              # Test files
├── .env.example        # Environment variables template
├── .gitignore          # Git ignore rules
├── nodemon.json        # Nodemon configuration
├── package.json        # Project dependencies and scripts
├── tsconfig.json       # TypeScript configuration
└── README.md           # This file
```
