// Direct environment variable injection for HTML files
const fs = require('fs').promises;
const path = require('path');

// Inject environment variables into HTML files during build/startup
const injectEnvIntoHTML = async () => {
    const publicDir = path.join(process.cwd(), '..'); // Go up from /app/server to /app
    const htmlFiles = ['index.html', 'gallery.html', 'moderate.html', 'character-creator.html'];
    
    // Environment variables to inject
    const envVars = {
        'API_KEY': process.env.API_KEY || '860de3877c2de19b8c88f34c34b71580',
        'JWT_SECRET': process.env.JWT_SECRET || 'vEahCndVJYE4s/hkNuJ9EMW3xjfgWh+kq+XmYumxAsQ=',
        'NODE_ENV': process.env.NODE_ENV || 'production',
        'REPO_OWNER': process.env.REPO_OWNER || 'Kit-Basher',
        'REPO_NAME': process.env.REPO_NAME || 'dark-city-game',
        'ENABLE_GITHUB_INTEGRATION': process.env.ENABLE_GITHUB_INTEGRATION || 'false',
        'ENABLE_DISCORD_NOTIFICATIONS': process.env.ENABLE_DISCORD_NOTIFICATIONS || 'false',
        'CALENDAR_MONTHS_TO_LOAD': process.env.CALENDAR_MONTHS_TO_LOAD || '3',
        'MAX_CHARACTERS_PER_PAGE': process.env.MAX_CHARACTERS_PER_PAGE || '12',
        'ALLOWED_ORIGINS': process.env.ALLOWED_ORIGINS || 'https://kit-basher.github.io,https://dark-city-game-production.up.railway.app'
    };
    
    // Generate script tag with environment variables
    const envScript = `<script>
window.ENV = window.ENV || {};
${Object.entries(envVars).map(([key, value]) => `window.ENV.${key} = '${value}';`).join('\n')}
</script>`;
    
    for (const htmlFile of htmlFiles) {
        try {
            const filePath = path.join(publicDir, htmlFile);
            let content = await fs.readFile(filePath, 'utf8');
            
            // Inject environment script after <head> tag
            if (content.includes('<head>')) {
                content = content.replace('<head>', `<head>\n    ${envScript}`);
                await fs.writeFile(filePath, content);
                console.log(`✅ Injected environment variables into ${htmlFile}`);
            }
        } catch (error) {
            console.error(`❌ Failed to inject into ${htmlFile}:`, error.message);
        }
    }
};

module.exports = { injectEnvIntoHTML };
