# Dark City RPG Server

Real-time character submission server for Dark City RPG with WebSocket support and Discord notifications.

## Features

- ✅ Real-time character submissions
- ✅ WebSocket notifications for moderators
- ✅ Discord webhook integration
- ✅ MongoDB database storage
- ✅ RESTful API endpoints
- ✅ Rate limiting and security
- ✅ Process management with PM2

## Quick Start

### Prerequisites

```bash
# Install Node.js (v18+)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Install PM2 (process manager)
sudo npm install -g pm2
```

### Installation

```bash
# Clone and install dependencies
cd /home/c/CascadeProjects/dark-city-game/server
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your settings (Discord webhook, etc.)

# Start the server
npm start

# Or use PM2 for production
pm2 start server.js --name dark-city-server
pm2 save
pm2 startup
```

## API Endpoints

### Characters
- `GET /api/characters` - Get all approved characters (public)
- `GET /api/characters/submissions` - Get all submissions (moderator)
- `GET /api/characters/pending` - Get pending submissions (moderator)
- `POST /api/characters/submit` - Submit new character
- `PUT /api/characters/:id/approve` - Approve character
- `PUT /api/characters/:id/reject` - Reject character
- `DELETE /api/characters/:id` - Delete character

### Health
- `GET /health` - Server health check

## WebSocket Events

### Client → Server
- `joinModerator` - Join moderator room
- `leaveModerator` - Leave moderator room

### Server → Client
- `newSubmission` - New character submitted
- `characterApproved` - Character approved
- `characterRejected` - Character rejected
- `characterDeleted` - Character deleted

## Environment Variables

```bash
PORT=3000
MONGODB_URI=mongodb://localhost:27017/darkcity
DISCORD_WEBHOOK_URL=your_discord_webhook_url
JWT_SECRET=your_jwt_secret
```

## PM2 Commands

```bash
# Start server
pm2 start server.js --name dark-city-server

# List processes
pm2 list

# View logs
pm2 logs dark-city-server

# Restart
pm2 restart dark-city-server

# Stop
pm2 stop dark-city-server

# Save startup script
pm2 save
pm2 startup
```

## Development

```bash
# Start with auto-reload
npm run dev

# View logs
tail -f /var/log/mongodb/mongod.log
```

## Security Features

- Rate limiting (100 requests per 15 minutes)
- Helmet.js for security headers
- CORS configuration
- Request size limiting
- Input validation

## Monitoring

- Health check endpoint: `/health`
- PM2 monitoring: `pm2 monit`
- MongoDB logs: `/var/log/mongodb/`

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check MongoDB status
sudo systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod

# Check logs
sudo tail -f /var/log/mongodb/mongod.log
```

### Port Issues
```bash
# Check what's using port 3000
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>
```

### PM2 Issues
```bash
# Reset PM2
pm2 kill
pm2 resurrect
```
