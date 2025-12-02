// setup-error-handling.ts
// Logs errors to the development machine where you're running the app

const originalConsoleError = console.error;
// Update this with your machine's local IP address (find with: ifconfig | grep "inet ")
const DEV_MACHINE_URL = 'http://192.168.0.101:7283/log-error'; // CHANGE THIS TO YOUR IP

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
