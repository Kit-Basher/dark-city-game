const express = require('express');
const router = express.Router();
const Character = require('../models/Character');

// GET all characters (public - approved only)
router.get('/', async (req, res) => {
  try {
    const characters = await Character.find({ status: 'approved' })
      .sort({ reviewedAt: -1 });
    res.json(characters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all submissions (moderator only)
router.get('/submissions', async (req, res) => {
  try {
    const submissions = await Character.find()
      .sort({ submittedAt: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET pending submissions
router.get('/pending', async (req, res) => {
  try {
    const pending = await Character.find({ status: 'pending' })
      .sort({ submittedAt: -1 });
    res.json(pending);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST new character submission
router.post('/submit', async (req, res) => {
  try {
    const character = new Character({
      ...req.body,
      submittedBy: req.body.submittedBy || 'anonymous',
    });
    
    const savedCharacter = await character.save();
    
    // Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      io.emit('newSubmission', savedCharacter);
    }
    
    res.status(201).json(savedCharacter);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT approve character
router.put('/:id/approve', async (req, res) => {
  try {
    const character = await Character.findByIdAndUpdate(
      req.params.id,
      {
        status: 'approved',
        reviewedBy: req.body.reviewedBy || 'moderator',
        reviewedAt: new Date(),
        feedback: req.body.feedback || '',
      },
      { new: true }
    );
    
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    // Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      io.emit('characterApproved', character);
    }
    
    res.json(character);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT reject character
router.put('/:id/reject', async (req, res) => {
  try {
    const character = await Character.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        reviewedBy: req.body.reviewedBy || 'moderator',
        reviewedAt: new Date(),
        feedback: req.body.feedback || '',
      },
      { new: true }
    );
    
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    // Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      io.emit('characterRejected', character);
    }
    
    res.json(character);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE character
router.delete('/:id', async (req, res) => {
  try {
    const character = await Character.findByIdAndDelete(req.params.id);
    
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    // Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      io.emit('characterDeleted', character);
    }
    
    res.json({ message: 'Character deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
