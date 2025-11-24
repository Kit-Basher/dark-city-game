require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const axios = require('axios');

const connectDB = require('./config/database');
const characterRoutes = require('./routes/characters');

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Store io instance for use in routes
app.set('io', io);

// Routes
app.use('/api/characters', characterRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`🔗 Client connected: ${socket.id}`);
  
  // Join moderator room
  socket.on('joinModerator', () => {
    socket.join('moderators');
    console.log(`👨‍💼 Moderator joined: ${socket.id}`);
  });
  
  // Leave moderator room
  socket.on('leaveModerator', () => {
    socket.leave('moderators');
    console.log(`👋 Moderator left: ${socket.id}`);
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Discord webhook notification
async function sendDiscordNotification(character, action) {
  try {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;
    
    let color, title;
    switch (action) {
      case 'submit':
        color = 0x00ff00; // Green
        title = '📝 New Character Submission';
        break;
      case 'approve':
        color = 0x0000ff; // Blue
        title = '✅ Character Approved';
        break;
      case 'reject':
        color = 0xff0000; // Red
        title = '❌ Character Rejected';
        break;
      default:
        color = 0x808080; // Gray
        title = '📋 Character Update';
    }
    
    const embed = {
      title,
      color,
      fields: [
        { name: 'Name', value: character.name, inline: true },
        { name: 'Classification', value: character.classification, inline: true },
        { name: 'Playbook', value: character.playbook, inline: true },
        { name: 'Status', value: character.status, inline: true },
        { name: 'Submitted By', value: character.submittedBy, inline: true },
        { name: 'Submitted At', value: new Date(character.submittedAt).toLocaleString(), inline: true },
      ],
      timestamp: new Date().toISOString(),
    };
    
    if (character.feedback) {
      embed.fields.push({ name: 'Feedback', value: character.feedback });
    }
    
    await axios.post(webhookUrl, {
      embeds: [embed]
    });
    
    console.log(`📨 Discord notification sent: ${title} - ${character.name}`);
  } catch (error) {
    console.error('❌ Discord notification failed:', error.message);
  }
}

// Listen for character events and send Discord notifications
io.on('newSubmission', (character) => {
  console.log(`📝 New submission: ${character.name}`);
  sendDiscordNotification(character, 'submit');
  
  // Notify moderators
  io.to('moderators').emit('newSubmission', character);
});

io.on('characterApproved', (character) => {
  console.log(`✅ Character approved: ${character.name}`);
  sendDiscordNotification(character, 'approve');
  
  // Notify everyone
  io.emit('characterApproved', character);
});

io.on('characterRejected', (character) => {
  console.log(`❌ Character rejected: ${character.name}`);
  sendDiscordNotification(character, 'reject');
  
  // Notify moderators
  io.to('moderators').emit('characterRejected', character);
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Dark City Server running on port ${PORT}`);
  console.log(`🌐 Local: http://localhost:${PORT}`);
  console.log(`🌐 Network: http://0.0.0.0:${PORT}`);
  console.log(`📊 Health check: http://0.0.0.0:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
