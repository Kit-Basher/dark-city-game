// Configuration for Dark City RPG
// This file should be customized for your deployment
window.CONFIG = {
    // GitHub Configuration
    REPO_OWNER: process.env.REPO_OWNER || 'Kit-Basher', // Replace with your GitHub username
    REPO_NAME: process.env.REPO_NAME || 'dark-city-game',
    
    // API Configuration
    API_BASE_URL: process.env.API_BASE_URL || '/api',
    API_KEY: process.env.API_KEY || 'dark-city-dev-key', // Should be overridden in production
    
    // Environment
    NODE_ENV: process.env.NODE_ENV || 'development',
    
    // Feature Flags
    ENABLE_GITHUB_INTEGRATION: process.env.ENABLE_GITHUB_INTEGRATION === 'true',
    ENABLE_DISCORD_NOTIFICATIONS: process.env.ENABLE_DISCORD_NOTIFICATIONS === 'true',
    
    // UI Configuration
    CALENDAR_MONTHS_TO_LOAD: parseInt(process.env.CALENDAR_MONTHS_TO_LOAD) || 3,
    MAX_CHARACTERS_PER_PAGE: parseInt(process.env.MAX_CHARACTERS_PER_PAGE) || 12
};
