// Environment Configuration for Dark City RPG
// This file handles environment-specific API endpoints and server URLs
// DO NOT confuse with /js/config.js which contains application settings
const config = {
  // Railway production server
  production: {
    apiURL: 'https://dark-city-server-production.up.railway.app/api',
    socketURL: 'https://dark-city-server-production.up.railway.app'
  },
  
  // Local development server
  development: {
    apiURL: 'http://localhost:3000/api',
    socketURL: 'http://localhost:3000'
  }
};

// Auto-detect environment
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const currentConfig = isProduction ? config.production : config.development;

// Export the current configuration
window.APP_CONFIG = currentConfig;
