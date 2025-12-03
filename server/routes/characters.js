const express = require('express');
const router = express.Router();
const Character = require('../models/Character');
const CharacterService = require('../services/characterService');
const { validate, characterSchema } = require('../middleware/validation');
const { generateCharacterProfile } = require('../utils/profileGenerator');
const path = require('path');

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
      limit: parseInt(req.query.limit) || 10,
      sort: { submittedAt: -1 }
    };

    const characters = await CharacterService.getApprovedCharacters(options);
    res.json(characters);
  } catch (error) {
    console.error('Error fetching approved characters:', error);
    res.status(500).json({ error: 'Failed to fetch characters' });
  }
});

// Debug endpoint to verify deployed version
router.get('/debug', (req, res) => {
  res.json({
    message: 'Debug info',
    timestamp: new Date().toISOString(),
    gitCommit: process.env.RAILWAY_GIT_COMMIT_SHA || 'unknown',
    nodeEnv: process.env.NODE_ENV,
    version: require('../../package.json').version
  });
});

// Public status ping
router.get('/status-ping', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    gitCommit: process.env.RAILWAY_GIT_COMMIT_SHA || 'unknown',
    nodeEnv: process.env.NODE_ENV,
    version: require('../../package.json').version
  });
});

/**
 * @swagger
 * /characters/submissions:
 *   get:
 *     summary: Get all character submissions (moderator only)
 *     description: Retrieve all character submissions for moderation
 *     tags: [Characters]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of character submissions
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/submissions', async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      sort: { submittedAt: -1 }
    };

    const characters = await CharacterService.getAllSubmissions(options);
    res.json(characters);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

/**
 * @swagger
 * /characters/pending:
 *   get:
 *     summary: Get pending character submissions (moderator only)
 *     description: Retrieve characters pending approval
 *     tags: [Characters]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending characters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/pending', async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      sort: { submittedAt: -1 }
    };

    const characters = await CharacterService.getPendingSubmissions(options);
    res.json(characters);
  } catch (error) {
    console.error('Error fetching pending characters:', error);
    res.status(500).json({ error: 'Failed to fetch pending characters' });
  }
});

/**
 * @swagger
 * /characters/submit:
 *   post:
 *     summary: Submit a new character
 *     description: Submit a new character for moderation
 *     tags: [Characters]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CharacterInput'
 *     responses:
 *       201:
 *         description: Character submitted successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
// Debug middleware to log incoming request data before validation
router.post('/submit', (req, res, next) => {
  console.log('🔍 Server received character data:', {
    name: req.body.name,
    fatePoints: req.body.fatePoints,
    fatePointsType: typeof req.body.fatePoints,
    physicalStress: req.body.physicalStress,
    physicalStressType: typeof req.body.physicalStress,
    mentalStress: req.body.mentalStress,
    mentalStressType: typeof req.body.mentalStress,
    moves: req.body.moves,
    movesCount: req.body.moves?.length,
    moveSources: req.body.moves?.map(m => m.source)
  });
  next();
});

router.post('/submit', validate(characterSchema), async (req, res) => {
  try {
    const characterData = {
      ...req.body,
      status: 'pending',
      submittedAt: new Date()
    };

    const character = await CharacterService.createCharacter(characterData);
    
    // Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      io.emit('newSubmission', character);
    }

    res.status(201).json({
      message: 'Character submitted successfully',
      character
    });
  } catch (error) {
    console.error('Error submitting character:', error);
    res.status(500).json({ error: 'Failed to submit character' });
  }
});

/**
 * @swagger
 * /characters/{id}/approve:
 *   put:
 *     summary: Approve a character (moderator only)
 *     description: Approve a character submission and make it public
 *     tags: [Characters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               feedback:
 *                 type: string
 *               reviewedBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Character approved successfully
 *       404:
 *         description: Character not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put('/:id/approve', async (req, res) => {
  try {
    const { feedback = '', reviewedBy = 'moderator' } = req.body;
    
    const character = await CharacterService.approveCharacter(req.params.id, {
      feedback,
      reviewedBy,
      reviewedAt: new Date()
    });

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Generate profile page (with error handling)
    try {
      console.log('🔧 Approval: Starting profile generation for:', character.name);
      await generateCharacterProfile(character);
      console.log('🔧 Approval: Profile generation completed');
    } catch (profileError) {
      console.warn('🔧 Approval: Profile generation failed:', profileError.message);
      // Don't fail the approval if profile generation fails
      // Character is still approved, just no profile page
    }
    
    // Emit real-time notification (with error handling)
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('characterApproved', character);
        console.log('🔧 Approval: WebSocket notification sent');
      } else {
        console.log('🔧 Approval: WebSocket not available');
      }
    } catch (wsError) {
      console.warn('🔧 Approval: WebSocket emission failed:', wsError.message);
      // Don't fail the approval if WebSocket fails
    }

    res.json({
      message: 'Character approved successfully',
      character
    });
  } catch (error) {
    console.error('Error approving character:', error);
    res.status(500).json({ error: 'Failed to approve character' });
  }
});

/**
 * @swagger
 * /characters/{id}/reject:
 *   put:
 *     summary: Reject a character (moderator only)
 *     description: Reject a character submission
 *     tags: [Characters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               feedback:
 *                 type: string
 *                 required: true
 *               reviewedBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Character rejected successfully
 *       404:
 *         description: Character not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put('/:id/reject', async (req, res) => {
  try {
    const { feedback, reviewedBy = 'moderator' } = req.body;
    
    if (!feedback) {
      return res.status(400).json({ error: 'Feedback is required for rejection' });
    }
    
    const character = await CharacterService.rejectCharacter(req.params.id, {
      feedback,
      reviewedBy,
      reviewedAt: new Date()
    });

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      io.emit('characterRejected', character);
    }

    res.json({
      message: 'Character rejected successfully',
      character
    });
  } catch (error) {
    console.error('Error rejecting character:', error);
    res.status(500).json({ error: 'Failed to reject character' });
  }
});

/**
 * @swagger
 * /characters/{id}:
 *   delete:
 *     summary: Delete a character (moderator only)
 *     description: Delete a character submission
 *     tags: [Characters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Character deleted successfully
 *       404:
 *         description: Character not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete('/:id', async (req, res) => {
  try {
    console.log('🗑️ Route: Delete request for character ID:', req.params.id);
    const character = await CharacterService.deleteCharacter(req.params.id);
    console.log('🗑️ Route: Delete result:', character ? 'Success' : 'Character not found');

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Emit real-time notification (with error handling)
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('characterDeleted', character);
        console.log('🗑️ Route: WebSocket notification sent');
      } else {
        console.log('🗑️ Route: WebSocket not available');
      }
    } catch (wsError) {
      console.warn('🗑️ Route: WebSocket emission failed:', wsError.message);
      // Don't fail the deletion if WebSocket fails
    }

    res.json({
      message: 'Character deleted successfully',
      character
    });
  } catch (error) {
    console.error('Error deleting character:', error);
    res.status(500).json({ error: 'Failed to delete character' });
  }
});

/**
 * @swagger
 * /characters/{id}:
 *   get:
 *     summary: Get a specific character
 *     description: Retrieve details of a specific character
 *     tags: [Characters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Character details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Character'
 *       404:
 *         description: Character not found
 */
router.get('/:id', async (req, res) => {
  try {
    const character = await CharacterService.getCharacterById(req.params.id);

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    res.json(character);
  } catch (error) {
    console.error('Error fetching character:', error);
    res.status(500).json({ error: 'Failed to fetch character' });
  }
});

router.get('/profiles/regenerate', async (req, res) => {
  try {
    const Character = require('../models/Character');
    const { initializeProfiles } = require('../utils/profileGenerator');
    
    // Get all approved characters
    const approvedCharacters = await Character.find({ status: 'approved' });
    
    // Regenerate profiles for all approved characters
    await initializeProfiles();
    
    res.json({
      success: true,
      message: `Regenerated ${approvedCharacters.length} character profiles`,
      count: approvedCharacters.length
    });
  } catch (error) {
    console.error('Error regenerating profiles:', error);
    res.status(500).json({ 
      error: 'Failed to regenerate profiles',
      message: error.message 
    });
  }
});

module.exports = router;
