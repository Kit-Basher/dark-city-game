require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const axios = require('axios');

const connectDB = require('./config/database');
const characterRoutes = require('./routes/characters');
const { ApiKeyAuth } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');
const { specs, swaggerUi } = require('./config/swagger');
const { applyRateLimiting, rateLimitStats } = require('./middleware/rateLimiting');
const HealthChecker = require('./middleware/health');
const { logger, structuredLogger, requestLogger } = require('./config/logging');

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Allowed origins - configure these in environment
      const allowedOrigins = process.env.ALLOWED_ORIGINS 
        ? process.env.ALLOWED_ORIGINS.split(',')
        : [
            'http://localhost:3000',
            'http://localhost:8080',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:8080',
            'https://kit-basher.github.io', // Replace with your GitHub Pages URL
            process.env.FRONTEND_URL // Additional frontend URL from environment
          ].filter(Boolean);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  }
});

// Enhanced security middleware
app.use(helmet({
    // Content Security Policy
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.socket.io"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "wss:", "ws:"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            manifestSrc: ["'self'"]
        }
    },
    
    // HTTPS enforcement in production
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    },
    
    // Additional security headers
    crossOriginEmbedderPolicy: false, // Disable for compatibility
    crossOriginResourcePolicy: { policy: "cross-origin" },
    
    // Referrer Policy
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    
    // Permissions Policy
    permissionsPolicy: {
        features: {
            geolocation: [],
            camera: [],
            microphone: [],
            payment: [],
            usb: [],
            magnetometer: [],
            gyroscope: [],
            accelerometer: []
        }
    }
}));

// HTTPS redirection middleware (production only)
if (process.env.NODE_ENV === 'production' && process.env.FORCE_HTTPS === 'true') {
    app.use((req, res, next) => {
        if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
            return res.redirect(301, `https://${req.get('host')}${req.url}`);
        }
        next();
    });
}

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allowed origins - configure these in environment
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',')
      : [
          'http://localhost:3000',
          'http://localhost:8080',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:8080',
          'https://kit-basher.github.io', // Replace with your GitHub Pages URL
          process.env.FRONTEND_URL // Additional frontend URL from environment
        ].filter(Boolean);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting statistics
app.use(rateLimitStats);

// Apply endpoint-specific rate limiting
app.use('/api/characters/submit', applyRateLimiting('characterSubmission'));
app.use('/api/characters', applyRateLimiting('characterViewing'));
app.use('/api-docs', applyRateLimiting('apiDocs'));
app.use('/health', applyRateLimiting('publicEndpoints'));

// General API rate limiting (fallback)
app.use('/api', applyRateLimiting('general'));

// Initialize authentication
const apiAuth = new ApiKeyAuth();

// Apply authentication to API routes (with health check exceptions)
app.use('/api', (req, res, next) => {
    if (req.path === '/health' || req.path === '/ready' || req.path === '/live') return next();
    return apiAuth.authenticate()(req, res, next);
});

// Request logging middleware
app.use(requestLogger);

// Serve static files from parent directory
const path = require('path');
app.use(express.static(path.join(__dirname, '..')));

// Serve character profile pages
app.get('/characters/profiles/:filename', (req, res) => {
  const profilePath = path.join(__dirname, '../characters/profiles', req.params.filename);
  res.sendFile(profilePath, (err) => {
    if (err) {
      console.error('Profile not found:', profilePath);
      res.status(404).json({
        error: 'Profile not found',
        message: `Character profile ${req.params.filename} does not exist`
      });
    }
  });
});

// Specific route for character builder
// Character builder page removed - route deleted

// Specific route for test submission script
app.get('/test-submission.js', (req, res) => {
  res.sendFile(require('path').join(__dirname, '../test-submission.js'));
});

// Store io instance for use in routes
app.set('io', io);

// Initialize health checker
const healthChecker = new HealthChecker();

// Routes
app.use('/api/characters', characterRoutes);

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Dark City RPG API Documentation'
}));

// API Documentation JSON
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
});

// Root endpoint for Railway health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Dark City RPG Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Health check endpoint
app.get('/health', applyRateLimiting('publicEndpoints'), async (req, res) => {
    try {
        const health = await healthChecker.getHealthStatus();
        const statusCode = health.status === 'OK' ? 200 : 
                          health.status === 'DEGRADED' ? 200 : 503;
        res.status(statusCode).json(health);
    } catch (error) {
        res.status(503).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            message: 'Health check failed',
            error: error.message
        });
    }
});

// Readiness check (for Kubernetes)
app.get('/ready', applyRateLimiting('publicEndpoints'), async (req, res) => {
    try {
        const readiness = await healthChecker.getReadinessStatus();
        const statusCode = readiness.ready ? 200 : 503;
        res.status(statusCode).json(readiness);
    } catch (error) {
        res.status(503).json({
            ready: false,
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// Liveness check (for Kubernetes)
app.get('/live', applyRateLimiting('publicEndpoints'), async (req, res) => {
    try {
        const liveness = await healthChecker.getLivenessStatus();
        res.status(200).json(liveness);
    } catch (error) {
        res.status(503).json({
            alive: false,
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Socket.io connection handling
io.on('connection', (socket) => {
    logger.info('Client connected', {
        type: 'socket',
        socketId: socket.id,
        ip: socket.handshake.address
    });
    
  // Join moderator room
  socket.on('joinModerator', () => {
    socket.join('moderators');
    structuredLogger.logAuth('moderator_room_joined', socket.id, {
        socketId: socket.id
    });
    logger.info('Moderator joined', {
        type: 'socket',
        socketId: socket.id
    });
  });
  
  socket.on('disconnect', () => {
    logger.info('Client disconnected', {
        type: 'socket',
        socketId: socket.id
    });
  });
});

// Discord webhook notification
async function sendDiscordNotification(character, action) {
  try {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;
    
    let color, title;
    switch (action) {
      case 'submit':
        color = 0x00ff00; // Green
        title = '📝 New Character Submission';
        break;
      case 'approve':
        color = 0x0000ff; // Blue
        title = '✅ Character Approved';
        break;
      case 'reject':
        color = 0xff0000; // Red
        title = '❌ Character Rejected';
        break;
      default:
        color = 0x808080; // Gray
        title = '📋 Character Update';
    }
    
    const embed = {
      title,
      color,
      fields: [
        { name: 'Name', value: character.name, inline: true },
        { name: 'Classification', value: character.classification, inline: true },
        { name: 'Playbook', value: character.playbook, inline: true },
        { name: 'Status', value: character.status, inline: true },
        { name: 'Submitted By', value: character.submittedBy, inline: true },
        { name: 'Submitted At', value: new Date(character.submittedAt).toLocaleString(), inline: true },
      ],
      timestamp: new Date().toISOString(),
    };
    
    if (character.feedback) {
      embed.fields.push({ name: 'Feedback', value: character.feedback });
    }
    
    await axios.post(webhookUrl, {
      embeds: [embed]
    });
    
    console.log(`📨 Discord notification sent: ${title} - ${character.name}`);
  } catch (error) {
    console.error('❌ Discord notification failed:', error.message);
  }
}

// Listen for character events and send Discord notifications
io.on('newSubmission', (character) => {
  console.log(`📝 New submission: ${character.name}`);
  sendDiscordNotification(character, 'submit');
  
  // Notify moderators
  io.to('moderators').emit('newSubmission', character);
});

io.on('characterApproved', (character) => {
  console.log(`✅ Character approved: ${character.name}`);
  sendDiscordNotification(character, 'approve');
  
  // Notify everyone
  io.emit('characterApproved', character);
});

io.on('characterRejected', (character) => {
  console.log(`❌ Character rejected: ${character.name}`);
  sendDiscordNotification(character, 'reject');
  
  // Notify moderators
  io.to('moderators').emit('characterRejected', character);
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Dark City Server running on port ${PORT}`);
  console.log(`🌐 Local: http://localhost:${PORT}`);
  console.log(`🌐 Network: http://0.0.0.0:${PORT}`);
  console.log(`📊 Health check: http://0.0.0.0:${PORT}/health`);
});

// Global error handling for continuous operation
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  structuredLogger.logError('uncaught_exception', error, {
    stack: error.stack,
    message: error.message
  });
  
  // Log the error but don't exit immediately
  // Give the server a chance to finish current operations
  setTimeout(() => {
    console.log('🔄 Restarting server due to uncaught exception...');
    // process.exit(1); // Temporarily disabled to see the error
  }, 1000);
  
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  structuredLogger.logError('unhandled_rejection', new Error(reason), {
    promise: promise.toString(),
    reason: reason
  });
  
  // Log but don't crash the server
  // Continue operation for unhandled promise rejections
});

// Handle memory warnings
process.on('warning', (warning) => {
  console.warn('⚠️ Process Warning:', warning.name, warning.message);
  structuredLogger.logError('process_warning', new Error(warning.message), {
    name: warning.name,
    stack: warning.stack
  });
});

// Handle SIGUSR2 for graceful restart (used by nodemon)
process.on('SIGUSR2', () => {
  console.log('🔄 SIGUSR2 received, restarting gracefully...');
  
  server.close(() => {
    console.log('✅ Server closed for restart');
    process.exit(0);
  });
  
  // Force close after 10 seconds if graceful shutdown fails
  setTimeout(() => {
    console.log('⏰ Forcing server restart...');
    process.exit(1);
  }, 10000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.log('⏰ Forcing server shutdown...');
    process.exit(1);
  }, 10000);
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.log('⏰ Forcing server shutdown...');
    process.exit(1);
  }, 10000);
});

