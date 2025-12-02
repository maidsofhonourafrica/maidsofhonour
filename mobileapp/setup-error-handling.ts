// setup-error-handling.ts
// Logs errors to the development machine where you're running the app

const originalConsoleError = console.error;
// Use host.docker.internal when running in Docker, or your local IP when developing
const DEV_MACHINE_URL = 'http://host.docker.internal:3001/log-error'; // Works from Docker containers

console.error = (...args: any[]) => {
  // 1. Call the original console.error so it still prints to Metro terminal
  originalConsoleError.apply(console, args);

  // 2. Send error to development machine via HTTP
  try {
    const logContent = args
      .map(a => {
        if (a && a.stack) return a.stack;
        if (typeof a === 'object') return JSON.stringify(a, null, 2);
        return String(a);
      })
      .join('\n');

    // Send to dev machine (non-blocking)
    fetch(DEV_MACHINE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        error: logContent,
      }),
    }).catch(() => {
      // Silently fail if dev server isn't running
    });
  } catch (e) {
    // Silently fail
  }
};

export const setupLogging = true;
