#!/usr/bin/env node

/**
 * Render API Log Monitor for Dark City RPG
 * Monitors Render service logs via API access
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
    apiKey: 'rnd_1x5I0oaEmdVmTjucUGvRNfxn55Q1',
    serviceId: 'srv-d56muupr0fns73eb4hpg', // Dark City 3.0(Reborn) service
    ownerId: 'tea-d56mngn5r7bs73fmpdpg', // Owner ID from service data
    baseUrl: 'https://api.render.com/v1',
    logCheckInterval: 30000, // 30 seconds
    maxLogLines: 100,
    logFile: path.join(__dirname, 'render-logs.log')
};

// Log monitoring class
class RenderLogMonitor {
    constructor(config) {
        this.config = config;
        this.lastLogTime = new Date();
        this.isRunning = false;
    }

    // Make API request to Render
    async makeRequest(endpoint) {
        return new Promise((resolve, reject) => {
            const url = `${this.config.baseUrl}${endpoint}`;
            const options = {
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json'
                }
            };

            const req = https.get(url, options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        try {
                            resolve(JSON.parse(data));
                        } catch (e) {
                            reject(new Error('Invalid JSON response'));
                        }
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                    }
                });
            });

            req.on('error', reject);
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
        });
    }

    // Fetch service logs
    async fetchLogs() {
        try {
            // Try with 'resource' parameter (based on error message about "resource in filters")
            const logs = await this.makeRequest(`/logs?ownerId=${this.config.ownerId}&resource=${this.config.serviceId}&limit=${this.config.maxLogLines}`);
            return logs;
        } catch (error) {
            console.error('Failed to fetch logs:', error.message);
            return null;
        }
    }

    // Process and filter logs
    processLogs(logs) {
        if (!logs) return [];
        
        // Handle Render API response format
        let logEntries = [];
        if (Array.isArray(logs)) {
            logEntries = logs;
        } else if (logs.logs && Array.isArray(logs.logs)) {
            logEntries = logs.logs;
        } else {
            console.log('Unknown log format:', typeof logs, logs);
            return [];
        }
        
        return logEntries
            .filter(log => {
                const logTime = new Date(log.timestamp || log.createdAt || log.time);
                return logTime > this.lastLogTime;
            })
            .slice(-this.config.maxLogLines)
            .map(log => ({
                timestamp: log.timestamp || log.createdAt || log.time,
                level: log.level || 'info',
                message: log.message || log.content || log.text || 'No message',
                source: log.source || log.service || 'unknown'
            }));
    }

    // Write logs to file
    writeLogs(logs) {
        const logEntries = logs.map(log => 
            `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`
        ).join('\n');

        fs.appendFileSync(this.config.logFile, logEntries + '\n');
        console.log(`Wrote ${logs.length} log entries to ${this.config.logFile}`);
    }

    // Start monitoring
    async start() {
        if (this.isRunning) {
            console.log('Monitor is already running');
            return;
        }

        console.log('Starting Render log monitor...');
        this.isRunning = true;

        const monitor = async () => {
            if (!this.isRunning) return;

            const logs = await this.fetchLogs();
            if (logs) {
                const newLogs = this.processLogs(logs);
                if (newLogs.length > 0) {
                    this.writeLogs(newLogs);
                    this.lastLogTime = new Date();
                }
            }

            setTimeout(monitor, this.config.logCheckInterval);
        };

        monitor();
    }

    // Stop monitoring
    stop() {
        this.isRunning = false;
        console.log('Render log monitor stopped');
    }
}

// CLI interface
if (require.main === module) {
    const monitor = new RenderLogMonitor(config);
    
    process.on('SIGINT', () => {
        monitor.stop();
        process.exit(0);
    });

    monitor.start().catch(console.error);
}

module.exports = RenderLogMonitor;
