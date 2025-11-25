// Application Configuration for Dark City RPG
// This file contains application settings, feature flags, and UI configuration
// DO NOT confuse with /config.js which handles environment-specific endpoints
window.CONFIG = {
    // GitHub Configuration
    REPO_OWNER: 'Kit-Basher', // Replace with your GitHub username
    REPO_NAME: 'dark-city-game',
    
    // API Configuration
    API_BASE_URL: '/api',
    API_KEY: 'dark-city-dev-key', // Should be overridden in production
    
    // Environment
    NODE_ENV: 'development',
    
    // Feature Flags
    ENABLE_GITHUB_INTEGRATION: false,
    ENABLE_DISCORD_NOTIFICATIONS: false,
    
    // UI Configuration
    CALENDAR_MONTHS_TO_LOAD: 3,
    MAX_CHARACTERS_PER_PAGE: 12
};
