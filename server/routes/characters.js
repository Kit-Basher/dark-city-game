const express = require('express');
const router = express.Router();
const { structuredLogger } = require('../config/logging');
const { getModeratorPassword, setModeratorPassword, DEFAULT_PASSWORD } = require('../config/moderatorPassword');
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
    gitCommit: process.env.GIT_COMMIT_SHA || 'unknown',
    nodeEnv: process.env.NODE_ENV,
    version: require('../../package.json').version
  });
});

// Public status ping
router.get('/status-ping', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    gitCommit: process.env.GIT_COMMIT_SHA || 'unknown',
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
    const { moderatorPassword, feedback = '', reviewedBy = 'moderator' } = req.body;
    const expectedPassword = await getModeratorPassword();
    
    // Verify moderator password
    if (!moderatorPassword || moderatorPassword !== expectedPassword) {
      return res.status(401).json({ error: 'Invalid moderator password' });
    }
    
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
    const { moderatorPassword, feedback, reviewedBy = 'moderator' } = req.body;
    const expectedPassword = await getModeratorPassword();
    
    // Verify moderator password
    if (!moderatorPassword || moderatorPassword !== expectedPassword) {
      return res.status(401).json({ error: 'Invalid moderator password' });
    }
    
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
 * /characters/{id}/edit:
 *   get:
 *     summary: Get character for editing
 *     description: Retrieve character data for editing (requires edit password or API key)
 *     tags: [Characters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: editPassword
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Character data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Character not found
 */
router.get('/:id/edit', async (req, res) => {
  try {
    const { id } = req.params;
    const { editPassword } = req.query;

    const character = await CharacterService.getCharacterById(id);
    
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Check authorization - either API key for moderators or edit password for owners
    const hasApiKey = req.headers.authorization && req.headers.authorization.startsWith('Bearer ');
    const hasValidPassword = editPassword && character.editPassword === editPassword;
    const masterPassword = await getModeratorPassword();
    const hasMasterPassword = editPassword && editPassword === masterPassword;
    const hasNoPasswordProtection = !character.editPassword;
    
    if (!hasApiKey && !hasValidPassword && !hasMasterPassword && !hasNoPasswordProtection) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Valid edit password or authorization required'
      });
    }

    res.json({
      ...character,
      isModeratorAccess: hasApiKey
    });
  } catch (error) {
    console.error('Error fetching character for editing:', error);
    res.status(500).json({ error: 'Failed to fetch character' });
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

/**
 * @swagger
 * /characters/{id}/edit:
 *   put:
 *     summary: Edit a character
 *     description: Update character details with edit password or moderator password
 *     tags: [Characters]
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
 *               editPassword:
 *                 type: string
 *                 description: Character edit password
 *               moderatorPassword:
 *                 type: string
 *                 description: Moderator override password
 *               characterData:
 *                 type: object
 *                 description: Character data to update
 *     responses:
 *       200:
 *         description: Character updated successfully
 *       401:
 *         description: Invalid password
 *       404:
 *         description: Character not found
 */
router.put('/:id/edit', async (req, res) => {
  try {
    const { editPassword: bodyEditPassword, moderatorPassword: bodyModeratorPassword, newEditPassword, ...characterData } = req.body;

    // Backward compat: existing clients pass editPassword via query string
    const editPassword = bodyEditPassword || req.query.editPassword;
    const moderatorPassword = bodyModeratorPassword;

    const masterPassword = await getModeratorPassword();

    if (typeof newEditPassword !== 'undefined') {
      characterData.editPassword = newEditPassword;
    }
    
    // Allow moderator override
    // Accept either explicit moderatorPassword OR using the master password as editPassword
    if (moderatorPassword === masterPassword || editPassword === masterPassword) {
      // Moderator can edit without character password
      const character = await CharacterService.updateCharacter(req.params.id, characterData, null);
      return res.json({
        message: 'Character updated successfully by moderator',
        character
      });
    }
    
    // Regular user must provide edit password
    if (!editPassword) {
      return res.status(401).json({ error: 'Edit password required' });
    }
    
    const character = await CharacterService.updateCharacter(req.params.id, characterData, editPassword);
    
    res.json({
      message: 'Character updated successfully',
      character
    });
  } catch (error) {
    console.error('Error editing character:', error);
    
    if (error.message === 'Invalid edit password') {
      return res.status(401).json({ error: 'Invalid edit password' });
    }
    
    if (error.message === 'Character not found') {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    res.status(500).json({ error: 'Failed to update character' });
  }
});

/**
 * @swagger
 * /characters/moderator/password:
 *   post:
 *     summary: Update moderator password
 *     description: Change the moderator password (requires current password)
 *     tags: [Characters]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       401:
 *         description: Invalid current password
 */
router.post('/moderator/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Verify current password
    if (currentPassword !== (process.env.MODERATOR_PASSWORD || 'test123')) {
      return res.status(401).json({ error: 'Invalid current password' });
    }
    
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: 'New password must be at least 4 characters' });
    }
    
    const expectedPassword = await getModeratorPassword();
    
    if (currentPassword !== expectedPassword) {
      return res.status(401).json({ error: 'Invalid current password' });
    }

    await setModeratorPassword(newPassword);
    
    res.json({
      message: 'Moderator password updated successfully',
      note: 'Password change will take effect on next server restart'
    });
  } catch (error) {
    console.error('Error updating moderator password:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

/**
 * @swagger
 * /characters/moderator/auth:
 *   post:
 *     summary: Authenticate as moderator
 *     description: Verify moderator credentials for access to moderation features
 *     tags: [Characters]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 description: Moderator password
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Invalid password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/moderator/auth', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }
    
    const expectedPassword = await getModeratorPassword();
    
    if (password !== expectedPassword) {
      return res.status(401).json({ error: 'Invalid moderator password' });
    }
    
    res.json({
      success: true,
      message: 'Moderator authentication successful'
    });
  } catch (error) {
    console.error('Error authenticating moderator:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

/**
 * @swagger
 * /characters/{id}/edit:
 *   put:
 *     summary: Update character
 *     description: Update an existing character's data (requires edit password or API key)
 *     tags: [Characters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: editPassword
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Character updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Character not found
 */
router.put('/:id/edit', async (req, res) => {
  try {
    const { id } = req.params;
    const { editPassword } = req.query;
    const updateData = req.body;

    const character = await CharacterService.getCharacterById(id);
    
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Check authorization
    const hasApiKey = req.headers.authorization && req.headers.authorization.startsWith('Bearer ');
    const hasValidPassword = editPassword && character.editPassword === editPassword;
    
    if (!hasApiKey && !hasValidPassword) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Valid edit password or authorization required'
      });
    }

    // Prevent changing certain fields if not authorized (moderator only)
    if (!hasApiKey) {
      const restrictedFields = ['status', 'reviewedBy', 'reviewedAt', 'feedback', 'submittedBy', 'submittedAt', 'editPassword'];
      restrictedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          delete updateData[field];
        }
      });
    }

    // Handle missing move sources
    if (updateData.moves && Array.isArray(updateData.moves)) {
      updateData.moves = updateData.moves.map(move => {
        if (!move.source && move.name) {
          move.source = character.playbook || 'Custom';
        }
        return move;
      });
    }

    // Update the character
    const updatedCharacter = await CharacterService.updateCharacter(id, updateData, editPassword);

    // Regenerate profile
    try {
      await generateCharacterProfile(updatedCharacter);
    } catch (profileError) {
      console.warn('Profile generation failed:', profileError.message);
    }

    // Emit real-time update
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('characterUpdated', {
          characterId: id,
          updatedBy: hasApiKey ? 'moderator' : 'owner',
          timestamp: new Date()
        });
      }
    } catch (wsError) {
      console.warn('WebSocket emission failed:', wsError.message);
    }

    res.json({
      success: true,
      message: 'Character updated successfully',
      character: updatedCharacter
    });

  } catch (error) {
    console.error('Error updating character:', error);
    
    if (error.message === 'Invalid edit password') {
      return res.status(401).json({ error: 'Invalid edit password' });
    }
    
    if (error.message === 'Character not found') {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    res.status(500).json({ error: 'Failed to update character' });
  }
});

/**
 * @swagger
 * /characters/{id}/edit-password:
 *   post:
 *     summary: Change character edit password
 *     description: Change the edit password for a character (requires current password)
 *     tags: [Characters]
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
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Invalid current password
 *       404:
 *         description: Character not found
 */
router.post('/:id/edit-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Current password and new password are required' 
      });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ 
        error: 'New password must be at least 4 characters long' 
      });
    }

    const character = await CharacterService.getCharacterById(id);
    
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    if (character.editPassword !== currentPassword) {
      return res.status(401).json({ error: 'Invalid current password' });
    }

    // Update password
    await CharacterService.updateCharacter(id, { editPassword: newPassword }, currentPassword);

    res.json({
      success: true,
      message: 'Edit password changed successfully'
    });

  } catch (error) {
    console.error('Error changing edit password:', error);
    res.status(500).json({ error: 'Failed to change edit password' });
  }
});

/**
 * @swagger
 * /characters/{id}/duplicate:
 *   post:
 *     summary: Duplicate character
 *     description: Create a copy of an existing character (requires edit password)
 *     tags: [Characters]
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
 *             required:
 *               - editPassword
 *               - newName
 *             properties:
 *               editPassword:
 *                 type: string
 *               newName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Character duplicated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Invalid edit password
 *       404:
 *         description: Character not found
 */
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;
    const { editPassword, newName } = req.body;

    if (!editPassword || !newName) {
      return res.status(400).json({ 
        error: 'Edit password and new name are required' 
      });
    }

    const originalCharacter = await CharacterService.getCharacterById(id);
    
    if (!originalCharacter) {
      return res.status(404).json({ error: 'Character not found' });
    }

    if (originalCharacter.editPassword !== editPassword) {
      return res.status(401).json({ error: 'Invalid edit password' });
    }

    // Create a copy of the character
    const characterData = { ...originalCharacter };
    delete characterData._id;
    delete characterData.__v;
    delete characterData.createdAt;
    delete characterData.updatedAt;
    
    // Update fields for the duplicate
    characterData.name = newName;
    characterData.status = 'pending';
    characterData.reviewedBy = null;
    characterData.reviewedAt = null;
    characterData.feedback = null;
    characterData.submittedAt = new Date();
    
    // Generate new edit password
    characterData.editPassword = Math.random().toString(36).substring(2, 10);

    const duplicatedCharacter = await CharacterService.createCharacter(characterData);

    res.status(201).json({
      success: true,
      message: 'Character duplicated successfully',
      character: duplicatedCharacter
    });

  } catch (error) {
    console.error('Error duplicating character:', error);
    res.status(500).json({ error: 'Failed to duplicate character' });
  }
});

module.exports = router;
