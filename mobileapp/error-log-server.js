// error-log-server.js
// Runs as a Docker container to receive error logs from the Expo mobile app

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const LOG_FILE = path.join(__dirname, 'expo-error.log');

const server = http.createServer((req, res) => {
  // Handle CORS for Expo
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/log-error') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const { timestamp, error } = JSON.parse(body);
        const logEntry = `\n[${timestamp}]\n${error}\n${'='.repeat(80)}\n`;
        
        fs.appendFileSync(LOG_FILE, logEntry);
        console.log(`📝 Error logged at ${timestamp}`);
        
        res.writeHead(200);
        res.end('OK');
      } catch (e) {
        console.error('Failed to log error:', e);
        res.writeHead(500);
        res.end('Failed');
      }
    });
  } else if (req.method === 'GET' && req.url === '/health') {
    // Health check endpoint for Docker
    res.writeHead(200);
    res.end('OK');
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Error logging server running on http://localhost:${PORT}`);
  console.log(`📄 Logs will be saved to: ${LOG_FILE}`);
});
