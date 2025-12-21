const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

// Custom log format
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        
        // Add metadata if present
        if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta)}`;
        }
        
        return log;
    })
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: {
        service: 'dark-city-rpg',
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0'
    },
    transports: [
        // Console transport for development
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
            level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
        }),
        
        // Daily rotating file for all logs
        new DailyRotateFile({
            filename: 'logs/application-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            level: 'info'
        }),
        
        // Daily rotating file for errors only
        new DailyRotateFile({
            filename: 'logs/error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '30d',
            level: 'error'
        }),
        
        // Daily rotating file for security events
        new DailyRotateFile({
            filename: 'logs/security-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '90d',
            level: 'warn',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
                winston.format((info) => {
                    // Only log security-related events
                    return info.type === 'security' ? info : false;
                })()
            )
        })
    ],
    
    // Handle uncaught exceptions and rejections
    exceptionHandlers: [
        new DailyRotateFile({
            filename: 'logs/exceptions-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '30d'
        })
    ],
    
    rejectionHandlers: [
        new DailyRotateFile({
            filename: 'logs/rejections-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '30d'
        })
    ]
});

// Structured logging methods
class StructuredLogger {
    constructor(logger) {
        this.logger = logger;
    }

    // Request logging
    logRequest(req, res, responseTime) {
        this.logger.info('HTTP Request', {
            type: 'http',
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`,
            userAgent: req.get('User-Agent'),
            ip: req.ip || req.connection.remoteAddress,
            userId: req.user?.id || 'anonymous',
            requestId: req.id
        });
    }

    // Security events
    logSecurity(event, details = {}) {
        this.logger.warn('Security Event', {
            type: 'security',
            event,
            timestamp: new Date().toISOString(),
            ...details
        });
    }

    // Database operations
    logDatabase(operation, collection, details = {}) {
        this.logger.debug('Database Operation', {
            type: 'database',
            operation,
            collection,
            ...details
        });
    }

    // Authentication events
    logAuth(event, userId, details = {}) {
        this.logger.info('Authentication Event', {
            type: 'auth',
            event,
            userId,
            timestamp: new Date().toISOString(),
            ...details
        });
    }

    // Business logic events
    logBusiness(event, details = {}) {
        this.logger.info('Business Event', {
            type: 'business',
            event,
            timestamp: new Date().toISOString(),
            ...details
        });
    }

    // Performance metrics
    logPerformance(metric, value, unit = 'ms', details = {}) {
        this.logger.info('Performance Metric', {
            type: 'performance',
            metric,
            value,
            unit,
            ...details
        });
    }

    // Error logging with context
    logError(error, context = {}) {
        this.logger.error('Application Error', {
            type: 'error',
            message: error.message,
            stack: error.stack,
            ...context
        });
    }

    // Character submission logging
    logCharacterSubmission(character, userId) {
        this.logBusiness('character_submitted', {
            characterId: character._id,
            characterName: character.name,
            classification: character.classification,
            playbook: character.playbook,
            submittedBy: userId,
            timestamp: new Date().toISOString()
        });
    }

    // Character approval logging
    logCharacterApproval(character, moderatorId) {
        this.logBusiness('character_approved', {
            characterId: character._id,
            characterName: character.name,
            approvedBy: moderatorId,
            timestamp: new Date().toISOString()
        });
    }

    // API rate limiting
    logRateLimit(req, limit, windowMs) {
        this.logSecurity('rate_limit_exceeded', {
            ip: req.ip || req.connection.remoteAddress,
            endpoint: req.originalUrl,
            limit,
            windowMs,
            userAgent: req.get('User-Agent')
        });
    }

    // System events
    logSystem(event, details = {}) {
        this.logger.info('System Event', {
            type: 'system',
            event,
            timestamp: new Date().toISOString(),
            ...details
        });
    }
}

// Create structured logger instance
const structuredLogger = new StructuredLogger(logger);

// Express middleware for request logging
const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    
    // Generate unique request ID
    req.id = Math.random().toString(36).substr(2, 9);
    
    // Log incoming request
    logger.debug('Incoming Request', {
        type: 'http',
        method: req.method,
        url: req.originalUrl,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        requestId: req.id
    });
    
    // Capture response
    res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        structuredLogger.logRequest(req, res, responseTime);
    });
    
    next();
};

// Export both loggers
module.exports = {
    logger,
    structuredLogger,
    requestLogger
};
