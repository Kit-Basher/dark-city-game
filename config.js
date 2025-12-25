// Unified Configuration for Dark City RPG
// This file handles both environment-specific endpoints and application settings

// Environment Configuration
const environments = {
    production: {
        apiURL: 'https://dark-city-3-0-reborn.onrender.com/api',
        socketURL: 'https://dark-city-3-0-reborn.onrender.com',
        NODE_ENV: 'production'
    },
    development: {
        apiURL: 'http://localhost:3000/api',
        socketURL: 'http://localhost:3000',
        NODE_ENV: 'development'
    }
};

// Auto-detect environment
const isProduction = window.location.hostname.includes('github.io') || window.location.hostname.includes('render.com');
const currentEnv = isProduction ? 'production' : 'development';

// Load environment variables
window.ENV = window.ENV || {};
const envConfig = environments[currentEnv];

// Application Configuration (single source of truth)
window.APP_CONFIG = {
    // Environment-specific URLs
    apiURL: window.ENV.API_URL || envConfig.apiURL,
    socketURL: window.ENV.SOCKET_URL || envConfig.socketURL,
    
    // Environment
    NODE_ENV: window.ENV.NODE_ENV || envConfig.NODE_ENV,
    
    // GitHub Configuration
    REPO_OWNER: window.ENV.REPO_OWNER || 'Kit-Basher',
    REPO_NAME: window.ENV.REPO_NAME || 'dark-city-game',
    
    // API Configuration
    API_BASE_URL: '/api',
    API_KEY: window.ENV.API_KEY || (isProduction ? '860de3877c2de19b8c88f34c34b71580' : null),
    MODERATOR_PASSWORD: window.ENV.MODERATOR_PASSWORD || 'test123',
    
    // Feature Flags
    ENABLE_GITHUB_INTEGRATION: window.ENV.ENABLE_GITHUB_INTEGRATION === 'true',
    ENABLE_DISCORD_NOTIFICATIONS: window.ENV.ENABLE_DISCORD_NOTIFICATIONS === 'true',
    
    // UI Configuration
    CALENDAR_MONTHS_TO_LOAD: parseInt(window.ENV.CALENDAR_MONTHS_TO_LOAD) || 3,
    MAX_CHARACTERS_PER_PAGE: parseInt(window.ENV.MAX_CHARACTERS_PER_PAGE) || 12,
    
    // CORS Configuration
    ALLOWED_ORIGINS: window.ENV.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'https://yourusername.github.io']
};

// Backward compatibility alias (deprecated - use APP_CONFIG)
window.CONFIG = window.APP_CONFIG;
