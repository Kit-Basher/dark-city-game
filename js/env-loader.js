// Environment Loader for Dark City Game
// This script loads environment variables from server-side injection
(function() {
    // Load environment variables from server (if available)
    window.ENV = window.ENV || {};
    
    // Try to load from meta tags (server injection)
    const metaTags = document.querySelectorAll('meta[name^="env-"]');
    metaTags.forEach(tag => {
        const name = tag.getAttribute('name').replace('env-', '');
        window.ENV[name] = tag.getAttribute('content');
    });
    
    // Fallback to development values
    const defaultEnv = {
        API_KEY: 'dark-city-dev-key',
        DISCORD_WEBHOOK_URL: '',
        NODE_ENV: 'development',
        REPO_OWNER: 'Kit-Basher',
        REPO_NAME: 'dark-city-game'
    };
    
    // Merge with defaults
    Object.keys(defaultEnv).forEach(key => {
        if (!window.ENV[key]) {
            window.ENV[key] = defaultEnv[key];
        }
    });
    
    // Update CONFIG with environment values
    if (window.CONFIG) {
        window.CONFIG.API_KEY = window.ENV.API_KEY;
        window.CONFIG.REPO_OWNER = window.ENV.REPO_OWNER;
        window.CONFIG.REPO_NAME = window.ENV.REPO_NAME;
        window.CONFIG.NODE_ENV = window.ENV.NODE_ENV;
    }
})();
