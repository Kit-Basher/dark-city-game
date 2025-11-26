// Environment Configuration for Dark City RPG
// This file handles environment-specific API endpoints and server URLs
// DO NOT confuse with /js/config.js which contains application settings
const config = {
  // Railway production server
  production: {
    apiURL: 'https://dark-city-game-production.up.railway.app/api',
    socketURL: 'https://dark-city-game-production.up.railway.app'
  },
  
  // Local development server
  development: {
    apiURL: 'http://localhost:3000/api',
    socketURL: 'http://localhost:3000'
  }
};

// Auto-detect environment
const isProduction = window.location.hostname.includes('github.io');
const currentConfig = isProduction ? config.production : config.development;

// Export the current configuration
window.APP_CONFIG = currentConfig;
