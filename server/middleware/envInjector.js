// Environment variable injection middleware
const injectEnvVars = (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
        // Only inject into HTML pages
        if (typeof data === 'string' && data.includes('<html')) {
            // Environment variables to inject
            const envVars = {
                'NODE_ENV': process.env.NODE_ENV || 'development',
                'REPO_OWNER': process.env.REPO_OWNER || 'Kit-Basher',
                'REPO_NAME': process.env.REPO_NAME || 'dark-city-game',
                'ENABLE_GITHUB_INTEGRATION': process.env.ENABLE_GITHUB_INTEGRATION || 'false',
                'ENABLE_DISCORD_NOTIFICATIONS': process.env.ENABLE_DISCORD_NOTIFICATIONS || 'false',
                'CALENDAR_MONTHS_TO_LOAD': process.env.CALENDAR_MONTHS_TO_LOAD || '3',
                'MAX_CHARACTERS_PER_PAGE': process.env.MAX_CHARACTERS_PER_PAGE || '12',
                'ALLOWED_ORIGINS': process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:8080,https://kit-basher.github.io'
            };
            
            // Debug logging (remove in production)
            if (process.env.NODE_ENV === 'development') {
                console.log('Injecting environment variables:', envVars);
            }
            
            // Generate meta tags
            const metaTags = Object.entries(envVars)
                .map(([key, value]) => `<meta name="env-${key}" content="${value}">`)
                .join('\n    ');
            
            // Inject meta tags after <head> tag
            data = data.replace('<head>', `<head>\n    ${metaTags}`);
        }
        
        originalSend.call(this, data);
    };
    
    next();
};

module.exports = injectEnvVars;
