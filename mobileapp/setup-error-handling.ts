// src/setupErrorHandling.ts

const originalConsoleError = console.error;

// We need to patch the global console.error function
console.error = (...args: any[]) => {
  // 1. Call the original console.error so it still prints to the terminal
  originalConsoleError.apply(console, args);

  // 2. Attempt to write the log file to the local machine
  try {
    // We use a dynamic import/require and check to prevent bundler errors
    // when running on the device, as 'fs' only exists on Node.js/Metro server.
    const fs = require('fs');

    // Use a path in the project root relative to where the Metro server is running
    const logFilePath = "expo-error.log"; 
    
    // Map arguments to get the full stack trace if it exists
    const logContent = args
      .map(a => (a && a.stack ? a.stack : a))
      .join("\n") + "\n\n";

    fs.writeFileSync(logFilePath, logContent, { flag: "a" });
  } catch (e) {
    // If 'fs' doesn't exist (i.e., running on the device), this silently fails.
    // We can optionally log the failure, but it clutters the console.
  }
};

// You can optionally export an empty object/function here to satisfy TypeScript
export const setupLogging = true;