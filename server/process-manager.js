#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Configuration
const MAX_RESTARTS = 10;
const RESTART_DELAY = 5000; // 5 seconds
const MEMORY_THRESHOLD = 500 * 1024 * 1024; // 500MB

let restartCount = 0;
let serverProcess = null;

console.log('🚀 Starting Dark City Server with process manager...');

function startServer() {
  console.log(`📍 Starting server (restart #${restartCount + 1})`);
  
  serverProcess = spawn('node', ['server.js'], {
    stdio: 'inherit',
    env: process.env,
    cwd: __dirname
  });

  serverProcess.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });

  serverProcess.on('exit', (code, signal) => {
    if (signal === 'SIGTERM' || signal === 'SIGINT') {
      console.log('📴 Server stopped by signal:', signal);
      process.exit(0);
    }

    if (code !== 0) {
      console.error(`💀 Server exited with code: ${code}`);
      
      if (restartCount < MAX_RESTARTS) {
        restartCount++;
        console.log(`🔄 Restarting server in ${RESTART_DELAY / 1000} seconds...`);
        
        setTimeout(() => {
          startServer();
        }, RESTART_DELAY);
      } else {
        console.error(`🚫 Maximum restarts (${MAX_RESTARTS}) reached. Giving up.`);
        process.exit(1);
      }
    } else {
      console.log('✅ Server exited normally');
      process.exit(0);
    }
  });

  // Monitor memory usage
  const memoryMonitor = setInterval(() => {
    if (serverProcess && serverProcess.pid) {
      try {
        const usage = process.memoryUsage();
        if (usage.heapUsed > MEMORY_THRESHOLD) {
          console.warn(`⚠️ High memory usage detected: ${Math.round(usage.heapUsed / 1024 / 1024)}MB`);
          
          // Graceful restart on high memory
          if (serverProcess) {
            console.log('🔄 Restarting due to high memory usage...');
            serverProcess.kill('SIGTERM');
          }
        }
      } catch (error) {
        // Ignore monitoring errors
      }
    }
  }, 30000); // Check every 30 seconds

  serverProcess.on('close', () => {
    clearInterval(memoryMonitor);
  });
}

// Handle process manager signals
process.on('SIGTERM', () => {
  console.log('📴 Process manager received SIGTERM, shutting down...');
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
});

process.on('SIGINT', () => {
  console.log('📴 Process manager received SIGINT, shutting down...');
  if (serverProcess) {
    serverProcess.kill('SIGINT');
  }
});

// Start the server
startServer();
