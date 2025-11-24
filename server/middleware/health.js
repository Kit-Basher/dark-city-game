const mongoose = require('mongoose');
const os = require('os');

class HealthChecker {
    constructor() {
        this.startTime = Date.now();
        this.lastCheck = null;
        this.checks = new Map();
    }

    // Main health check endpoint
    async getHealthStatus() {
        const timestamp = new Date().toISOString();
        const uptime = process.uptime();
        
        const health = {
            status: 'OK',
            timestamp,
            uptime: {
                seconds: uptime,
                human: this.formatUptime(uptime)
            },
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            checks: {}
        };

        // Run all health checks
        const checkResults = await Promise.allSettled([
            this.checkDatabase(),
            this.checkMemory(),
            this.checkDisk(),
            this.checkDependencies(),
            this.checkExternalServices()
        ]);

        // Process results
        const checks = ['database', 'memory', 'disk', 'dependencies', 'external'];
        checkResults.forEach((result, index) => {
            const checkName = checks[index];
            if (result.status === 'fulfilled') {
                health.checks[checkName] = result.value;
                if (result.value.status !== 'OK') {
                    health.status = 'DEGRADED';
                }
            } else {
                health.checks[checkName] = {
                    status: 'ERROR',
                    message: result.reason.message || 'Check failed',
                    timestamp
                };
                health.status = 'UNHEALTHY';
            }
        });

        this.lastCheck = timestamp;
        return health;
    }

    // Database health check
    async checkDatabase() {
        const timestamp = new Date().toISOString();
        
        try {
            const state = mongoose.connection.readyState;
            const states = {
                0: 'disconnected',
                1: 'connected',
                2: 'connecting',
                3: 'disconnecting'
            };

            if (state !== 1) {
                return {
                    status: 'ERROR',
                    message: `Database state: ${states[state]}`,
                    timestamp
                };
            }

            // Test database operation
            await mongoose.connection.db.admin().ping();

            // Get database stats
            const stats = await mongoose.connection.db.stats();
            
            return {
                status: 'OK',
                timestamp,
                details: {
                    state: states[state],
                    host: mongoose.connection.host,
                    name: mongoose.connection.name,
                    collections: stats.collections,
                    dataSize: this.formatBytes(stats.dataSize),
                    storageSize: this.formatBytes(stats.storageSize),
                    indexes: stats.indexes,
                    indexSize: this.formatBytes(stats.indexSize)
                }
            };
        } catch (error) {
            return {
                status: 'ERROR',
                message: error.message,
                timestamp
            };
        }
    }

    // Memory usage check
    async checkMemory() {
        const timestamp = new Date().toISOString();
        const memUsage = process.memoryUsage();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;

        const memoryUsagePercent = (usedMem / totalMem) * 100;
        const processMemoryPercent = (memUsage.rss / totalMem) * 100;

        let status = 'OK';
        if (memoryUsagePercent > 90 || processMemoryPercent > 80) {
            status = 'CRITICAL';
        } else if (memoryUsagePercent > 80 || processMemoryPercent > 60) {
            status = 'WARNING';
        }

        return {
            status,
            timestamp,
            details: {
                system: {
                    total: this.formatBytes(totalMem),
                    free: this.formatBytes(freeMem),
                    used: this.formatBytes(usedMem),
                    usagePercent: memoryUsagePercent.toFixed(2)
                },
                process: {
                    rss: this.formatBytes(memUsage.rss),
                    heapTotal: this.formatBytes(memUsage.heapTotal),
                    heapUsed: this.formatBytes(memUsage.heapUsed),
                    external: this.formatBytes(memUsage.external),
                    usagePercent: processMemoryPercent.toFixed(2)
                }
            }
        };
    }

    // Disk space check
    async checkDisk() {
        const timestamp = new Date().toISOString();
        
        try {
            const fs = require('fs').promises;
            const path = require('path');
            
            // Check current directory disk usage
            const stats = await fs.stat(process.cwd());
            
            // Simple disk check - in production you'd want more sophisticated monitoring
            return {
                status: 'OK',
                timestamp,
                details: {
                    path: process.cwd(),
                    note: 'Basic disk check - implement df/du integration for detailed monitoring'
                }
            };
        } catch (error) {
            return {
                status: 'WARNING',
                message: 'Could not check disk usage',
                timestamp,
                details: { error: error.message }
            };
        }
    }

    // Dependencies check
    async checkDependencies() {
        const timestamp = new Date().toISOString();
        const packageJson = require('../package.json');
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        const results = {};
        let overallStatus = 'OK';

        for (const [name, version] of Object.entries(dependencies)) {
            try {
                const modulePath = require.resolve(name);
                results[name] = {
                    status: 'OK',
                    version,
                    loaded: true
                };
            } catch (error) {
                results[name] = {
                    status: 'ERROR',
                    version,
                    loaded: false,
                    error: error.message
                };
                overallStatus = 'WARNING';
            }
        }

        return {
            status: overallStatus,
            timestamp,
            details: {
                total: Object.keys(dependencies).length,
                loaded: Object.values(results).filter(r => r.loaded).length,
                modules: results
            }
        };
    }

    // External services check
    async checkExternalServices() {
        const timestamp = new Date().toISOString();
        const services = [];

        // Check Discord webhook if configured
        if (process.env.DISCORD_WEBHOOK_URL) {
            try {
                const axios = require('axios');
                // Simple ping to Discord webhook
                await axios.post(process.env.DISCORD_WEBHOOK_URL, {
                    content: 'Health check ping',
                    username: 'Dark City RPG Health Monitor'
                }, { timeout: 5000 });
                
                services.push({
                    name: 'Discord Webhook',
                    status: 'OK',
                    timestamp
                });
            } catch (error) {
                services.push({
                    name: 'Discord Webhook',
                    status: 'ERROR',
                    message: error.message,
                    timestamp
                });
            }
        }

        // Check GitHub API
        try {
            const axios = require('axios');
            await axios.get('https://api.github.com/rate_limit', { timeout: 5000 });
            
            services.push({
                name: 'GitHub API',
                status: 'OK',
                timestamp
            });
        } catch (error) {
            services.push({
                name: 'GitHub API',
                status: 'WARNING',
                message: error.message,
                timestamp
            });
        }

        const overallStatus = services.some(s => s.status === 'ERROR') ? 'ERROR' :
                              services.some(s => s.status === 'WARNING') ? 'WARNING' : 'OK';

        return {
            status: overallStatus,
            timestamp,
            details: {
                services,
                total: services.length,
                healthy: services.filter(s => s.status === 'OK').length
            }
        };
    }

    // Readiness check (for Kubernetes/container orchestration)
    async getReadinessStatus() {
        const health = await this.getHealthStatus();
        
        // Consider ready if database is connected and basic services are working
        const isReady = health.checks.database?.status === 'OK' && 
                       health.status !== 'UNHEALTHY';

        return {
            ready: isReady,
            timestamp: health.timestamp,
            checks: {
                database: health.checks.database?.status || 'UNKNOWN'
            }
        };
    }

    // Liveness check (for Kubernetes/container orchestration)
    async getLivenessStatus() {
        return {
            alive: true,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            pid: process.pid
        };
    }

    // Utility functions
    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        return `${days}d ${hours}h ${minutes}m ${secs}s`;
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

module.exports = HealthChecker;
