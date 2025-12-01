// CRITICAL: Load environment variables FIRST
require('dotenv').config();

// Import with `import * as Sentry from "@sentry/node"` if you are using ESM
const Sentry = require("@sentry/node");
const { nodeProfilingIntegration } = require("@sentry/profiling-node");

Sentry.init({
  dsn: process.env.SENTRY_DSN, // No fallback - must be set in .env
  integrations: [
    nodeProfilingIntegration(),
  ],
  environment: process.env.NODE_ENV || 'development',

  // Send structured logs to Sentry
  enableLogs: true,

  // Tracing
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev

  // Set sampling rate for profiling - this is evaluated only once per SDK.init call
  profileSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Trace lifecycle automatically enables profiling during active traces
  profileLifecycle: 'trace',

  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  // IMPORTANT: Set to false in production to comply with Kenya DPA
  sendDefaultPii: process.env.NODE_ENV !== 'production',

  // Before send hook to redact PII
  beforeSend(event, hint) {
    // Redact sensitive data
    if (event.request) {
      // Remove sensitive headers
      if (event.request.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }

      // Remove sensitive query params
      if (event.request.query_string) {
        const sensitiveParams = ['token', 'password', 'secret', 'api_key'];
        sensitiveParams.forEach(param => {
          if (event.request.query_string?.includes(param)) {
            event.request.query_string = '[REDACTED]';
          }
        });
      }
    }

    // Redact PII from extra data
    if (event.extra) {
      const piiFields = ['email', 'phoneNumber', 'password', 'nationalId', 'idNumber'];
      Object.keys(event.extra).forEach(key => {
        if (piiFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          event.extra[key] = '[REDACTED]';
        }
      });
    }

    return event;
  }
});

module.exports = Sentry;
