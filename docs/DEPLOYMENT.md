# Deployment Guide

This guide covers deployment options for Dark City RPG.

## Deployment Options

### 1. GitHub Pages (Recommended for Static Sites)

#### Prerequisites
- GitHub account
- Git installed
- Node.js 18+ (for local development)

#### Setup Steps

1. **Create GitHub Repository**
   ```bash
   # Create new repository on GitHub
   # Clone repository
   git clone https://github.com/yourusername/dark-city-game.git
   cd dark-city-game
   ```

2. **Configure Repository**
   ```bash
   # Add files
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

3. **Enable GitHub Pages**
   - Go to repository settings
   - Scroll to "Pages" section
   - Select "Deploy from a branch"
   - Choose "main" branch and "/ (root)" folder
   - Click "Save"

4. **Configure Custom Domain (Optional)**
   ```bash
   # Create CNAME file
   echo "yourdomain.com" > CNAME
   git add CNAME
   git commit -m "Add custom domain"
   git push origin main
   ```

5. **Update DNS Records**
   - Add CNAME record pointing to `yourusername.github.io`
   - Wait for DNS propagation (24-48 hours)

#### Environment Variables
GitHub Pages doesn't support server-side environment variables. Use client-side configuration:

```javascript
// config.js
window.APP_CONFIG = {
    apiURL: 'https://your-server.com/api',
    // ... other config
};
```

### 2. Railway (Full Stack)

#### Prerequisites
- Railway account
- Node.js 18+
- MongoDB database (Railway provides)

#### Setup Steps

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Initialize Project**
   ```bash
   cd dark-city-game
   railway init
   ```

3. **Configure Environment Variables**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set PORT=3000
   railway variables set MONGODB_URI=mongodb://mongo:27017/darkcity
   railway variables set API_KEY=your-secure-api-key
   railway variables set DISCORD_WEBHOOK_URL=your-webhook-url
   railway variables set JWT_SECRET=your-jwt-secret
   ```

4. **Deploy**
   ```bash
   railway up
   ```

5. **Configure Custom Domain**
   ```bash
   railway domains add yourdomain.com
   ```

#### Railway Configuration Files

**railway.toml**
```toml
[build]
builder = "NIXPACKS"

[deploy]
healthcheckPath = "/api/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[[services]]
name = "web"
source = "."
healthcheckPath = "/api/health"
healthcheckTimeout = 300
```

**package.json scripts**
```json
{
  "scripts": {
    "start": "node server/server.js",
    "build": "npm install",
    "dev": "nodemon server/server.js"
  }
}
```

### 3. Vercel (Frontend + Serverless)

#### Prerequisites
- Vercel account
- Vercel CLI

#### Setup Steps

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Configure Project**
   ```bash
   cd dark-city-game
   vercel
   ```

3. **Environment Variables**
   ```bash
   vercel env add API_KEY
   vercel env add DISCORD_WEBHOOK_URL
   vercel env add MONGODB_URI
   ```

4. **Deploy**
   ```bash
   vercel --prod
   ```

#### Vercel Configuration

**vercel.json**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/server.js",
      "use": "@vercel/node"
    },
    {
      "src": "public/**/*",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/public/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 4. Docker Deployment

#### Prerequisites
- Docker installed
- Docker Compose (optional)

#### Setup Steps

1. **Create Dockerfile**
   ```dockerfile
   # Multi-stage build
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production

   FROM node:18-alpine AS runtime
   WORKDIR /app
   COPY --from=builder /app/node_modules ./node_modules
   COPY . .
   EXPOSE 3000
   CMD ["node", "server/server.js"]
   ```

2. **Create docker-compose.yml**
   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
         - MONGODB_URI=mongodb://mongo:27017/darkcity
         - API_KEY=${API_KEY}
         - DISCORD_WEBHOOK_URL=${DISCORD_WEBHOOK_URL}
       depends_on:
         - mongo
       restart: unless-stopped

     mongo:
       image: mongo:5.0
       volumes:
         - mongo_data:/data/db
       restart: unless-stopped

     nginx:
       image: nginx:alpine
       ports:
         - "80:80"
         - "443:443"
       volumes:
         - ./nginx.conf:/etc/nginx/nginx.conf
         - ./ssl:/etc/nginx/ssl
       depends_on:
         - app
       restart: unless-stopped

   volumes:
     mongo_data:
   ```

3. **Deploy**
   ```bash
   # Build and start
   docker-compose up -d

   # View logs
   docker-compose logs -f

   # Stop services
   docker-compose down
   ```

## Environment Configuration

### Production Environment Variables

Create `.env` file for production:

```bash
# Server Configuration
NODE_ENV=production
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/darkcity

# Security
API_KEY=your-secure-api-key
JWT_SECRET=your-jwt-secret
BCRYPT_ROUNDS=12

# External Services
DISCORD_WEBHOOK_URL=your-discord-webhook-url

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Feature Flags
ENABLE_GITHUB_INTEGRATION=false
ENABLE_DISCORD_NOTIFICATIONS=true

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=logs
```

### Development Environment

Create `.env.development`:

```bash
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/darkcity_dev
API_KEY=dev-key
ENABLE_GITHUB_INTEGRATION=false
ENABLE_DISCORD_NOTIFICATIONS=false
LOG_LEVEL=debug
```

## SSL/TLS Configuration

### Let's Encrypt with Certbot

1. **Install Certbot**
   ```bash
   sudo apt-get update
   sudo apt-get install certbot python3-certbot-nginx
   ```

2. **Generate Certificate**
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

3. **Auto-renewal**
   ```bash
   sudo crontab -e
   # Add: 0 12 * * * /usr/bin/certbot renew --quiet
   ```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    location / {
        root /var/www/dark-city-game;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Monitoring and Logging

### Application Monitoring

1. **Health Check Endpoint**
   ```javascript
   // server/health.js
   app.get('/api/health', (req, res) => {
     res.json({
       status: 'ok',
       timestamp: new Date().toISOString(),
       uptime: process.uptime(),
       memory: process.memoryUsage(),
       version: process.env.npm_package_version
     });
   });
   ```

2. **Performance Monitoring**
   ```javascript
   // Use Winston for logging
   const winston = require('winston');
   
   const logger = winston.createLogger({
     level: 'info',
     format: winston.format.json(),
     transports: [
       new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
       new winston.transports.File({ filename: 'logs/combined.log' })
     ]
   });
   ```

### System Monitoring

1. **PM2 Process Manager**
   ```bash
   # Install PM2
   npm install -g pm2
   
   # Start application
   pm2 start server/server.js --name "dark-city-game"
   
   # Monitor
   pm2 monit
   
   # Save process list
   pm2 save
   pm2 startup
   ```

2. **System Monitoring Script**
   ```bash
   #!/bin/bash
   # monitor.sh
   
   # Check if application is running
   if ! pm2 list | grep -q "dark-city-game.*online"; then
     echo "Application is down, restarting..."
     pm2 restart dark-city-game
   fi
   
   # Check disk space
   DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
   if [ $DISK_USAGE -gt 80 ]; then
     echo "Disk usage is high: ${DISK_USAGE}%"
   fi
   
   # Check memory usage
   MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
   if [ $MEMORY_USAGE -gt 80 ]; then
     echo "Memory usage is high: ${MEMORY_USAGE}%"
   fi
   ```

## Backup and Recovery

### Database Backup

1. **MongoDB Backup Script**
   ```bash
   #!/bin/bash
   # backup-mongodb.sh
   
   DATE=$(date +%Y%m%d_%H%M%S)
   BACKUP_DIR="/backups/mongodb"
   DB_NAME="darkcity"
   
   mkdir -p $BACKUP_DIR
   
   mongodump --db $DB_NAME --out $BACKUP_DIR/$DATE
   
   # Keep only last 7 days
   find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;
   ```

2. **Automated Backup**
   ```bash
   # Add to crontab
   0 2 * * * /path/to/backup-mongodb.sh
   ```

### File Backup

```bash
#!/bin/bash
# backup-files.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/files"
SOURCE_DIR="/var/www/dark-city-game"

mkdir -p $BACKUP_DIR

tar -czf $BACKUP_DIR/files_$DATE.tar.gz $SOURCE_DIR

# Keep last 30 days
find $BACKUP_DIR -name "files_*.tar.gz" -mtime +30 -delete
```

## Troubleshooting

### Common Issues

1. **Application Won't Start**
   ```bash
   # Check logs
   pm2 logs dark-city-game
   
   # Check configuration
   node -c server/server.js
   
   # Check dependencies
   npm install
   ```

2. **Database Connection Issues**
   ```bash
   # Test MongoDB connection
   mongo mongodb://localhost:27017/darkcity
   
   # Check MongoDB status
   sudo systemctl status mongod
   ```

3. **SSL Certificate Issues**
   ```bash
   # Check certificate status
   sudo certbot certificates
   
   # Renew certificate
   sudo certbot renew --dry-run
   ```

### Performance Issues

1. **High Memory Usage**
   ```bash
   # Check memory usage
   free -h
   
   # Check process memory
   ps aux --sort=-%mem | head
   ```

2. **High CPU Usage**
   ```bash
   # Check CPU usage
   top
   
   # Check process CPU
   ps aux --sort=-%cpu | head
   ```

## Security Considerations

### Production Security Checklist

- [ ] Environment variables configured
- [ ] SSL/TLS certificates installed
- [ ] Firewall configured
- [ ] Database access restricted
- [ ] Regular security updates
- [ ] Backup system in place
- [ ] Monitoring configured
- [ ] Log rotation configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured

### Security Headers

```nginx
# Add to Nginx configuration
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

---

**Last Updated**: November 27, 2024  
**Version**: 1.0.0

For additional support, please refer to the [Security Policy](./SECURITY.md) or create an issue on GitHub.
