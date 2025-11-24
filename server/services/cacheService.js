const redis = require('redis');
const { logger, structuredLogger } = require('../config/logging');

class CacheService {
    constructor() {
        this.client = null;
        this.connected = false;
        this.defaultTTL = 3600; // 1 hour
        this.init();
    }

    async init() {
        try {
            const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
            
            // Check if Redis is disabled
            if (redisUrl === 'disabled') {
                logger.info('Redis is disabled - using in-memory cache');
                this.connected = false;
                return;
            }
            
            // Only create Redis client if not disabled
            this.client = redis.createClient({
                url: redisUrl,
                retry_strategy: (options) => {
                    if (options.error && options.error.code === 'ECONNREFUSED') {
                        logger.error('Redis connection refused');
                        return new Error('Redis connection refused');
                    }
                    if (options.total_retry_time > 1000 * 60 * 60) {
                        logger.error('Redis retry time exhausted');
                        return new Error('Retry time exhausted');
                    }
                    if (options.attempt > 10) {
                        logger.error('Redis max retry attempts reached');
                        return undefined;
                    }
                    // Retry after 3 seconds
                    return Math.min(options.attempt * 100, 3000);
                }
            });

            this.client.on('connect', () => {
                logger.info('Redis client connecting');
            });

            this.client.on('ready', () => {
                logger.info('Redis client connected and ready');
                this.connected = true;
                structuredLogger.logSystem('redis_connected', { url: redisUrl });
            });

            this.client.on('error', (err) => {
                logger.error('Redis client error:', err);
                this.connected = false;
            });

            this.client.on('end', () => {
                logger.warn('Redis client connection ended');
                this.connected = false;
            });

            await this.client.connect();
        } catch (error) {
            logger.error('Failed to initialize Redis:', error);
            this.connected = false;
            structuredLogger.logError(error, { component: 'cache_service' });
        }
    }

    // Generic cache methods
    async get(key) {
        if (!this.connected) return null;
        
        try {
            const value = await this.client.get(key);
            if (value) {
                structuredLogger.logDatabase('cache_get', 'redis', { key, hit: true });
                return JSON.parse(value);
            }
            structuredLogger.logDatabase('cache_get', 'redis', { key, hit: false });
            return null;
        } catch (error) {
            structuredLogger.logError(error, { operation: 'cache_get', key });
            return null;
        }
    }

    async set(key, value, ttl = this.defaultTTL) {
        if (!this.connected) return false;
        
        try {
            const serializedValue = JSON.stringify(value);
            await this.client.setEx(key, ttl, serializedValue);
            structuredLogger.logDatabase('cache_set', 'redis', { key, ttl });
            return true;
        } catch (error) {
            structuredLogger.logError(error, { operation: 'cache_set', key, ttl });
            return false;
        }
    }

    async del(key) {
        if (!this.connected) return false;
        
        try {
            await this.client.del(key);
            structuredLogger.logDatabase('cache_del', 'redis', { key });
            return true;
        } catch (error) {
            structuredLogger.logError(error, { operation: 'cache_del', key });
            return false;
        }
    }

    async exists(key) {
        if (!this.connected) return false;
        
        try {
            const result = await this.client.exists(key);
            return result === 1;
        } catch (error) {
            structuredLogger.logError(error, { operation: 'cache_exists', key });
            return false;
        }
    }

    async clear(pattern = '*') {
        if (!this.connected) return false;
        
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(keys);
                structuredLogger.logDatabase('cache_clear', 'redis', { pattern, count: keys.length });
            }
            return true;
        } catch (error) {
            structuredLogger.logError(error, { operation: 'cache_clear', pattern });
            return false;
        }
    }

    // Character-specific cache methods
    async getCharacters(queryHash) {
        const key = `characters:${queryHash}`;
        return await this.get(key);
    }

    async setCharacters(queryHash, characters, ttl = 1800) { // 30 minutes
        const key = `characters:${queryHash}`;
        return await this.set(key, characters, ttl);
    }

    async getCharacterById(characterId) {
        const key = `character:${characterId}`;
        return await this.get(key);
    }

    async setCharacterById(characterId, character, ttl = 3600) {
        const key = `character:${characterId}`;
        return await this.set(key, character, ttl);
    }

    async invalidateCharacter(characterId) {
        const key = `character:${characterId}`;
        await this.del(key);
        
        // Invalidate character list caches
        await this.clear('characters:*');
        
        structuredLogger.logBusiness('character_cache_invalidated', { characterId });
    }

    // Statistics cache
    async getStatistics() {
        const key = 'statistics:characters';
        return await this.get(key);
    }

    async setStatistics(stats, ttl = 300) { // 5 minutes
        const key = 'statistics:characters';
        return await this.set(key, stats, ttl);
    }

    async invalidateStatistics() {
        const key = 'statistics:characters';
        await this.del(key);
        structuredLogger.logBusiness('statistics_cache_invalidated');
    }

    // Search results cache
    async getSearchResults(searchHash) {
        const key = `search:${searchHash}`;
        return await this.get(key);
    }

    async setSearchResults(searchHash, results, ttl = 900) { // 15 minutes
        const key = `search:${searchHash}`;
        return await this.set(key, results, ttl);
    }

    // Rate limiting cache
    async checkRateLimit(identifier, limit, windowMs) {
        if (!this.connected) return { allowed: true, remaining: limit };
        
        const key = `rate_limit:${identifier}`;
        const ttl = Math.ceil(windowMs / 1000);
        
        try {
            const current = await this.client.incr(key);
            
            if (current === 1) {
                await this.client.expire(key, ttl);
            }
            
            const remaining = Math.max(0, limit - current);
            const allowed = current <= limit;
            
            structuredLogger.logSecurity('rate_limit_check', {
                identifier,
                current,
                limit,
                remaining,
                allowed,
                windowMs
            });
            
            return { allowed, remaining, current };
        } catch (error) {
            structuredLogger.logError(error, { operation: 'rate_limit_check', identifier });
            return { allowed: true, remaining: limit };
        }
    }

    // Session cache
    async getSession(sessionId) {
        const key = `session:${sessionId}`;
        return await this.get(key);
    }

    async setSession(sessionId, sessionData, ttl = 86400) { // 24 hours
        const key = `session:${sessionId}`;
        return await this.set(key, sessionData, ttl);
    }

    async deleteSession(sessionId) {
        const key = `session:${sessionId}`;
        return await this.del(key);
    }

    // Cache warming
    async warmCache() {
        if (!this.connected) return;
        
        try {
            // Pre-load common data
            // This would be called during application startup
            structuredLogger.logSystem('cache_warming_started');
            
            // Example: Warm statistics cache
            // const stats = await CharacterService.getStatistics();
            // await this.setStatistics(stats);
            
            structuredLogger.logSystem('cache_warming_completed');
        } catch (error) {
            structuredLogger.logError(error, { operation: 'cache_warming' });
        }
    }

    // Cache health check
    async healthCheck() {
        if (!this.connected) {
            return {
                status: 'ERROR',
                message: 'Redis not connected'
            };
        }
        
        try {
            const testKey = 'health_check_test';
            const testValue = { timestamp: Date.now() };
            
            await this.set(testKey, testValue, 10);
            const retrieved = await this.get(testKey);
            await this.del(testKey);
            
            if (retrieved && retrieved.timestamp === testValue.timestamp) {
                return {
                    status: 'OK',
                    message: 'Cache is working properly'
                };
            } else {
                return {
                    status: 'ERROR',
                    message: 'Cache read/write test failed'
                };
            }
        } catch (error) {
            return {
                status: 'ERROR',
                message: error.message
            };
        }
    }

    // Generate cache keys
    static generateQueryHash(params) {
        const sortedParams = Object.keys(params)
            .sort()
            .reduce((result, key) => {
                result[key] = params[key];
                return result;
            }, {});
        
        return Buffer.from(JSON.stringify(sortedParams)).toString('base64');
    }

    static generateSearchHash(query, filters) {
        const searchData = { query, ...filters };
        return CacheService.generateQueryHash(searchData);
    }

    // Graceful shutdown
    async disconnect() {
        if (this.client && this.connected) {
            try {
                await this.client.quit();
                logger.info('Redis client disconnected gracefully');
                structuredLogger.logSystem('redis_disconnected');
            } catch (error) {
                logger.error('Error disconnecting Redis:', error);
            }
        }
    }
}

// Create singleton instance
const cacheService = new CacheService();

// Handle process termination
process.on('SIGTERM', () => cacheService.disconnect());
process.on('SIGINT', () => cacheService.disconnect());

module.exports = cacheService;
