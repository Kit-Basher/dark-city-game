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
    enum: ['Vampire', 'Werewolf', 'Human', 'Ghost', 'Wizard', 'Fairy', 'Other'],
  },
  playbook: {
    type: String,
    required: true,
    enum: ['Mortal', 'Ageless', 'Unsated', 'Wild', 'Mage'],
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
}, {
  timestamps: true,
});

// Index for faster queries
characterSchema.index({ status: 1, submittedAt: -1 });
characterSchema.index({ submittedBy: 1 });

module.exports = mongoose.model('Character', characterSchema);
