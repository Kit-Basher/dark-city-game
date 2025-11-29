// Environment Loader for Dark City Game
// This script loads environment variables from server-side meta tag injection
(function() {
    // Load environment variables from server (if available)
    window.ENV = window.ENV || {};
    
    // Try to load from meta tags (server injection)
    const metaTags = document.querySelectorAll('meta[name^="env-"]');
    metaTags.forEach(tag => {
        const name = tag.getAttribute('name').replace('env-', '');
        window.ENV[name] = tag.getAttribute('content');
    });
    
    // Note: Configuration is now handled by config.js
    // This file only handles meta tag injection from server
})();
