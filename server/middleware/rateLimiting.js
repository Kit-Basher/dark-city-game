const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

// Redis client for distributed rate limiting (optional)
let redisClient;
try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    if (redisUrl !== 'disabled') {
        redisClient = new Redis(redisUrl);
    } else {
        console.warn('Redis disabled, using memory store for rate limiting');
    }
} catch (error) {
    console.warn('Redis not available, falling back to memory store for rate limiting');
}

// Create rate limiter factory
const createRateLimiter = (options) => {
    const config = {
        windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes default
        max: options.max || 100,
        message: options.message || 'Too many requests, please try again later.',
        standardHeaders: true, // Return rate limit info in headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
        keyGenerator: options.keyGenerator || ((req) => {
            return req.ip || req.connection.remoteAddress;
        }),
        skip: options.skip || ((req) => {
            // Skip rate limiting for health checks and API docs
            return req.path === '/health' || req.path === '/api-docs' || req.path === '/api-docs.json';
        }),
        ...options
    };

    // Use Redis store if available, otherwise use memory store
    if (redisClient && !options.useMemoryStore) {
        config.store = new RedisStore({
            sendCommand: (...args) => redisClient.call(...args),
        });
    }

    return rateLimit(config);
};

// Different rate limiters for different endpoints
const rateLimiters = {
    // General API rate limiting
    general: createRateLimiter({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // 100 requests per 15 minutes
        message: {
            error: 'Too many requests',
            message: 'You have exceeded the general API rate limit. Please try again later.',
            retryAfter: '15 minutes'
        }
    }),

    // Character submission - more restrictive
    characterSubmission: createRateLimiter({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 5, // 5 character submissions per hour
        message: {
            error: 'Too many character submissions',
            message: 'You can submit up to 5 characters per hour. Please wait before submitting again.',
            retryAfter: '1 hour'
        },
        keyGenerator: (req) => {
            // Use IP + user agent for more specific limiting
            const userAgent = req.get('User-Agent') || 'unknown';
            const identifier = `${req.ip || req.connection.remoteAddress}:${userAgent}`;
            return identifier;
        }
    }),

    // Moderator actions - less restrictive but tracked
    moderatorActions: createRateLimiter({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 200, // 200 moderator actions per 15 minutes
        message: {
            error: 'Too many moderator actions',
            message: 'You have exceeded the moderator action rate limit. Please slow down.',
            retryAfter: '15 minutes'
        },
        keyGenerator: (req) => {
            // Use API key for moderator actions
            const apiKey = req.headers.authorization?.replace('Bearer ', '') || 'unknown';
            return `moderator:${apiKey}`;
        }
    }),

    // Health checks and API docs - very permissive
    publicEndpoints: createRateLimiter({
        windowMs: 1 * 60 * 1000, // 1 minute
        max: 1000, // 1000 requests per minute
        message: {
            error: 'Too many requests',
            message: 'Rate limit exceeded for public endpoints.',
            retryAfter: '1 minute'
        }
    }),

    // Character viewing - moderate rate limiting
    characterViewing: createRateLimiter({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 500, // 500 character views per 15 minutes
        message: {
            error: 'Too many character view requests',
            message: 'You have exceeded the character viewing rate limit. Please try again later.',
            retryAfter: '15 minutes'
        }
    }),

    // API documentation - very permissive
    apiDocs: createRateLimiter({
        windowMs: 1 * 60 * 1000, // 1 minute
        max: 100, // 100 API doc requests per minute
        message: {
            error: 'Too many API documentation requests',
            message: 'Rate limit exceeded for API documentation.',
            retryAfter: '1 minute'
        }
    })
};

// Middleware to apply rate limiting based on route
const applyRateLimiting = (limiterName) => {
    const limiter = rateLimiters[limiterName] || rateLimiters.general;
    return limiter;
};

// Custom middleware for dynamic rate limiting
const dynamicRateLimit = (options) => {
    return (req, res, next) => {
        // Check if user is authenticated
        const isAuthenticated = req.headers.authorization;
        
        // Different limits for authenticated vs unauthenticated users
        if (isAuthenticated) {
            // Authenticated users get higher limits
            const authLimiter = createRateLimiter({
                ...options,
                max: (options.max || 100) * 2, // Double the limit
                keyGenerator: (req) => {
                    const apiKey = req.headers.authorization?.replace('Bearer ', '') || 'unknown';
                    return `auth:${apiKey}`;
                }
            });
            return authLimiter(req, res, next);
        } else {
            // Unauthenticated users get standard limits
            const publicLimiter = createRateLimiter(options);
            return publicLimiter(req, res, next);
        }
    };
};

// Rate limiting statistics middleware
const rateLimitStats = (req, res, next) => {
    const rateLimitInfo = {
        limit: res.get('X-RateLimit-Limit'),
        remaining: res.get('X-RateLimit-Remaining'),
        reset: res.get('X-RateLimit-Reset'),
        retryAfter: res.get('Retry-After')
    };

    if (rateLimitInfo.limit) {
        res.set('X-RateLimit-Info', JSON.stringify(rateLimitInfo));
    }

    next();
};

// Cleanup function for Redis
const cleanup = async () => {
    if (redisClient) {
        await redisClient.quit();
    }
};

// Handle process termination
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

module.exports = {
    rateLimiters,
    applyRateLimiting,
    dynamicRateLimit,
    rateLimitStats,
    createRateLimiter,
    cleanup
};
