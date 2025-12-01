/**
 * Structured Logging with Pino
 *
 * Provides structured, searchable logs with automatic PII redaction.
 * Replaces console.log throughout the application.
 */

import pino from 'pino';
import { redactPII } from './pii-redactor';
import fs from 'fs';
import path from 'path';

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',

  // Redact sensitive fields automatically
  redact: {
    paths: [
      'password',
      'passwordHash',
      'token',
      'accessToken',
      'refreshToken',
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
    ],
    censor: '[REDACTED]',
  },

  // Formatters
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },

  // Pretty print in development
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
        singleLine: false,
      },
    },
  }),

  // Production: JSON logs
  ...(isProduction && {
    timestamp: pino.stdTimeFunctions.isoTime,
  }),
});

/**
 * Safe logger wrapper that auto-redacts PII
 */
export const safeLogger = {
  info: (obj: any, msg?: string) => {
    if (typeof obj === 'object') {
      logger.info(redactPII(obj), msg);
    } else {
      logger.info(obj);
    }
  },

  error: (obj: any, msg?: string) => {
    if (typeof obj === 'object') {
      logger.error(redactPII(obj), msg);
    } else {
      logger.error(obj);
    }
  },

  warn: (obj: any, msg?: string) => {
    if (typeof obj === 'object') {
      logger.warn(redactPII(obj), msg);
    } else {
      logger.warn(obj);
    }
  },

  debug: (obj: any, msg?: string) => {
    if (typeof obj === 'object') {
      logger.debug(redactPII(obj), msg);
    } else {
      logger.debug(obj);
    }
  },

  fatal: (obj: any, msg?: string) => {
    if (typeof obj === 'object') {
      logger.fatal(redactPII(obj), msg);
    } else {
      logger.fatal(obj);
    }
  },
};

// Legacy callback logger (keep for compatibility)
export interface CallbackLog {
  timestamp: string;
  method: string;
  url: string;
  headers: Record<string, string | string[] | undefined>;
  body: any;
  query: Record<string, any>;
}

export function logCallback(data: CallbackLog) {
  const logFile = path.join(logsDir, 'callbacks.log');
  const logEntry = JSON.stringify(redactPII(data), null, 2) + '\n';
  fs.appendFileSync(logFile, logEntry);

  safeLogger.info({ callback: data }, 'Callback received');
}
