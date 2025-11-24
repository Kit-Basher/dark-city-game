# Server Deployment & Process Management Guide

## Overview

The Dark City Server is configured for continuous operation with automatic restart capabilities and comprehensive error handling.

## Available Deployment Options

### 1. Development Mode
```bash
npm run dev                    # Development with nodemon
npm run dev:watch             # Development with test watching
```

### 2. Production Mode - Simple Process Manager
```bash
npm run start:prod            # Custom process manager with auto-restart
```

### 3. Production Mode - PM2 (Recommended)
```bash
npm run start:pm2             # Start with PM2 cluster mode
npm run restart:pm2           # Restart PM2 processes
npm run stop:pm2              # Stop PM2 processes
npm run delete:pm2            # Delete PM2 processes
npm run logs:pm2              # View PM2 logs
npm run monit:pm2             # Monitor PM2 processes
```

## Continuous Operation Features

### ✅ Automatic Restart on Crashes
- **Uncaught Exceptions**: Server logs error and restarts after 1 second
- **Process Manager**: Custom manager restarts up to 10 times with 5-second delays
- **PM2**: Advanced process manager with cluster mode and health monitoring

### ✅ Memory Management
- **Memory Threshold**: Auto-restart when memory exceeds 500MB
- **Memory Monitoring**: Checks every 30 seconds
- **PM2 Memory**: Configured with `max_memory_restart: "500M"`

### ✅ Graceful Shutdown
- **SIGTERM/SIGINT**: Properly closes connections before shutdown
- **Force Timeout**: 10-second force close if graceful shutdown fails
- **SIGUSR2**: Supports nodemon graceful restarts

### ✅ Error Handling
- **Uncaught Exceptions**: Logged with structured logging
- **Unhandled Rejections**: Logged but don't crash server
- **Process Warnings**: Memory and performance warnings
- **Health Checks**: Built-in health monitoring

### ✅ Logging
- **Structured Logging**: Winston-based logging system
- **Log Rotation**: Daily log files with rotation
- **PM2 Logs**: Centralized log management
- **Error Tracking**: Comprehensive error logging

## PM2 Configuration Features

```json
{
  "instances": "max",           // Cluster mode - uses all CPU cores
  "exec_mode": "cluster",      // Load balancing across instances
  "max_memory_restart": "500M", // Auto-restart on memory threshold
  "min_uptime": "10s",         // Minimum uptime before restart
  "max_restarts": 10,          // Maximum restart attempts
  "restart_delay": 5000,       // Delay between restarts
  "autorestart": true,         // Auto-restart on crash
  "cron_restart": "0 2 * * *", // Daily restart at 2 AM
  "health_check_grace_period": 3000, // Health check timing
  "kill_timeout": 10000        // Graceful shutdown timeout
}
```

## Monitoring Commands

### Check Server Status
```bash
curl http://localhost:3000/health    # Health check
curl http://localhost:3000/ready     # Readiness check
curl http://localhost:3000/live      # Liveness check
```

### Monitor with PM2
```bash
pm2 list                           # Show all processes
pm2 show dark-city-server          # Detailed process info
pm2 monit                          # Real-time monitoring dashboard
pm2 logs dark-city-server --lines 100  # Recent logs
```

### Memory Usage
```bash
pm2 monit                          # Real-time memory monitoring
ps aux | grep node                # Check node processes
top -p $(pgrep node)              # Monitor specific process
```

## Environment Setup

### Development
```bash
export NODE_ENV=development
export PORT=3000
npm run dev
```

### Production
```bash
export NODE_ENV=production
export PORT=3000
export MONGODB_URI=mongodb://localhost:27017/darkcity
export REDIS_URL=redis://localhost:6379
npm run start:pm2
```

## Troubleshooting

### Server Won't Start
1. Check logs: `npm run logs:pm2` or `tail -f logs/error.log`
2. Verify environment variables
3. Check port availability: `lsof -i :3000`
4. Test database connection

### Frequent Restarts
1. Check memory usage: `pm2 monit`
2. Review error logs for patterns
3. Monitor database connection stability
4. Check for memory leaks

### High Memory Usage
1. Monitor with: `pm2 monit`
2. Check for memory leaks in application code
3. Verify proper cleanup of resources
4. Consider increasing `max_memory_restart` threshold

## Production Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure production database
- [ ] Set up Redis for caching
- [ ] Configure environment variables
- [ ] Install PM2 globally: `npm install -g pm2`
- [ ] Start with PM2: `npm run start:pm2`
- [ ] Verify health endpoint: `curl http://localhost:3000/health`
- [ ] Set up monitoring alerts
- [ ] Configure log rotation
- [ ] Set up backup strategy

## Security Considerations

- Process manager runs with same privileges as user
- Logs may contain sensitive information - secure log files
- PM2 monitoring requires network access
- Environment variables should be secured
- Regular security updates recommended
