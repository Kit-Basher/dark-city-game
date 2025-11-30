const mongoose = require('mongoose');

const characterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  apparentAge: {
    type: String,
    required: true,
  },
  actualAge: {
    type: String,
    required: true,
  },
  classification: {
    type: String,
    required: true,
  },
  playbook: {
    type: String,
    required: true,
    enum: ['Ageless', 'Ancient', 'Aquatic', 'Aware', 'Champion', 'Covert', 'Construct', 'Darkling', 'Fae', 'Gifted', 'Giant', 'Incarnation', 'Legend', 'Mad', 'Mage', 'Mortal', 'Patron', 'Unsated', 'Wild'],
  },
  subtype: {
    type: String,
    required: true,
  },
  bio: {
    type: String,
    required: true,
  },
  humanHeight: String,
  humanWeight: String,
  monsterHeight: String,
  monsterWeight: String,
  humanPhoto: String,
  monsterPhoto: String,
  darkestSelf: {
    type: String,
    required: true,
  },
  fatePoints: {
    type: String,
    default: '1',
  },
  physicalStress: {
    type: String,
    default: '2',
  },
  mentalStress: {
    type: String,
    default: '2',
  },
  skills: [{
    name: {
      type: String,
      required: true,
    },
    level: {
      type: Number,
      required: true,
      min: 1,
      max: 4,
    },
  }],
  moves: [{
    name: {
      type: String,
      required: true,
    },
    source: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
  }],
  submittedBy: {
    type: String,
    required: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  reviewedBy: String,
  reviewedAt: Date,
  feedback: String,
  discordNotified: {
    type: Boolean,
    default: false,
  },
  photos: [{
    url: String,
    caption: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  humanPhoto: String,
  monsterPhoto: String,
  editPassword: {
    type: String,
    required: false,
    default: function() {
      // Generate random 8-character password only if no password provided
      return null; // Allow empty passwords
    }
  },
}, {
  timestamps: true,
});

// Character schema indexes for performance
characterSchema.index({ status: 1, submittedAt: -1 }); // For fetching pending/approved characters
characterSchema.index({ submittedBy: 1, submittedAt: -1 }); // For user's submission history
characterSchema.index({ name: 'text', bio: 'text' }); // For text search
characterSchema.index({ classification: 1, playbook: 1 }); // For filtering by type
characterSchema.index({ reviewedAt: -1 }); // For recent approvals
characterSchema.index({ status: 1, reviewedAt: -1 }); // For moderation queue
characterSchema.index({ submittedAt: -1 }); // For timeline views

// Compound indexes for common queries
characterSchema.index({ status: 1, classification: 1, submittedAt: -1 });
characterSchema.index({ status: 1, playbook: 1, submittedAt: -1 });

module.exports = mongoose.model('Character', characterSchema);
