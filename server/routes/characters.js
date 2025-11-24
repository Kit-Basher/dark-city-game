const express = require('express');
const router = express.Router();
const CharacterService = require('../services/characterService');
const { validate, characterSchema } = require('../middleware/validation');

/**
 * @swagger
 * /characters:
 *   get:
 *     summary: Get all approved characters
 *     description: Retrieve a list of all characters that have been approved by moderators
 *     tags: [Characters]
 *     responses:
 *       200:
 *         description: List of approved characters
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Character'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 12,
      classification: req.query.classification,
      playbook: req.query.playbook,
      search: req.query.search,
      sortBy: req.query.sortBy || 'submittedAt',
      sortOrder: req.query.sortOrder === 'asc' ? 1 : -1
    };

    const result = await CharacterService.getCharacters(options);
    res.json(result);
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

/**
 * @swagger
 * /characters/submit:
 *   post:
 *     summary: Submit a new character for approval
 *     description: Submit a new character that will be reviewed by moderators before being made public
 *     tags: [Characters]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Character'
 *     responses:
 *       201:
 *         description: Character submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Character'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/submit', validate(characterSchema), async (req, res) => {
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
