const express = require('express');
const router = express.Router();
const Character = require('../models/Character');
const CharacterService = require('../services/characterService');
const { validate, characterSchema } = require('../middleware/validation');
const { generateCharacterProfile } = require('../utils/profileGenerator');
const path = require('path');
const { ApiKeyAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @swagger
 * /characters/{id}:
 *   get:
 *     summary: Get character by ID for editing
 *     description: Retrieve a specific character's data for editing (requires edit password or authorization)
 *     tags: [Characters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Character ID
 *       - in: query
 *         name: editPassword
 *         schema:
 *           type: string
 *         description: Edit password for the character
 *     responses:
 *       200:
 *         description: Character data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Character'
 *       401:
 *         description: Unauthorized - invalid edit password
 *       404:
 *         description: Character not found
 *       500:
 *         description: Server error
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { editPassword } = req.query;

  try {
    const character = await Character.findById(id);
    
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Check authorization - either API key for moderators or edit password for owners
    const hasApiKey = req.headers.authorization && req.headers.authorization.startsWith('Bearer ');
    const hasValidPassword = editPassword && character.editPassword === editPassword;
    const hasNoPasswordProtection = !character.editPassword; // Character has no password protection
    
    if (!hasApiKey && !hasValidPassword && !hasNoPasswordProtection) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Valid edit password or authorization required'
      });
    }

    res.json(character);
  } catch (error) {
    console.error('Error fetching character for editing:', error);
    res.status(500).json({ error: 'Failed to fetch character' });
  }
}));

/**
 * @swagger
 * /characters/{id}:
 *   put:
 *     summary: Update character
 *     description: Update an existing character's data (requires edit password or authorization)
 *     tags: [Characters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Character ID
 *       - in: query
 *         name: editPassword
 *         schema:
 *           type: string
 *         description: Edit password for the character
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               bio:
 *                 type: string
 *               classification:
 *                 type: string
 *               playbook:
 *                 type: string
 *               # ... other character fields
 *     responses:
 *       200:
 *         description: Character updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Character'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - invalid edit password
 *       404:
 *         description: Character not found
 *       500:
 *         description: Server error
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { editPassword } = req.query;
  const updateData = req.body;

  try {
    const character = await Character.findById(id);
    
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
      // Regular users can't change status, reviewedBy, reviewedAt, feedback
      const restrictedFields = ['status', 'reviewedBy', 'reviewedAt', 'feedback', 'submittedBy', 'submittedAt'];
      restrictedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          delete updateData[field];
        }
      });
    }

    // Handle missing move sources - default to character's playbook
    if (updateData.moves && Array.isArray(updateData.moves)) {
      updateData.moves = updateData.moves.map(move => {
        if (!move.source && move.name) {
          // Default source to character's playbook if available, otherwise to "Custom"
          move.source = character.playbook || 'Custom';
        }
        return move;
      });
    }

    // Update the character
    const updatedCharacter = await Character.findByIdAndUpdate(
      id,
      { 
        $set: updateData,
        $inc: { __v: 1 } // Increment version for optimistic locking
      },
      { 
        new: true, 
        runValidators: true 
      }
    );

    // Regenerate profile to test new photo layout
    await generateCharacterProfile(updatedCharacter);

    // Emit real-time update if socket.io is available
    if (req.io) {
      req.io.emit('characterUpdated', {
        characterId: id,
        updatedBy: hasApiKey ? 'moderator' : 'owner',
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Character updated successfully',
      character: updatedCharacter
    });

  } catch (error) {
    console.error('Error updating character:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({ error: 'Failed to update character' });
  }
}));

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
 *         description: Character ID
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
 *                 description: Current edit password
 *               newPassword:
 *                 type: string
 *                 description: New edit password
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Invalid current password
 *       404:
 *         description: Character not found
 *       500:
 *         description: Server error
 */
router.post('/:id/edit-password', asyncHandler(async (req, res) => {
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

  try {
    const character = await Character.findById(id);
    
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    if (character.editPassword !== currentPassword) {
      return res.status(401).json({ error: 'Invalid current password' });
    }

    character.editPassword = newPassword;
    await character.save();

    res.json({
      success: true,
      message: 'Edit password changed successfully'
    });

  } catch (error) {
    console.error('Error changing edit password:', error);
    res.status(500).json({ error: 'Failed to change edit password' });
  }
}));

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
 *         description: Character ID to duplicate
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
 *                 description: Edit password for the original character
 *               newName:
 *                 type: string
 *                 description: Name for the duplicated character
 *     responses:
 *       201:
 *         description: Character duplicated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Invalid edit password
 *       404:
 *         description: Character not found
 *       500:
 *         description: Server error
 */
router.post('/:id/duplicate', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { editPassword, newName } = req.body;

  if (!editPassword || !newName) {
    return res.status(400).json({ 
      error: 'Edit password and new name are required' 
    });
  }

  try {
    const originalCharacter = await Character.findById(id);
    
    if (!originalCharacter) {
      return res.status(404).json({ error: 'Character not found' });
    }

    if (originalCharacter.editPassword !== editPassword) {
      return res.status(401).json({ error: 'Invalid edit password' });
    }

    // Create a copy of the character
    const characterData = originalCharacter.toObject();
    delete characterData._id;
    delete characterData.__v;
    delete characterData.createdAt;
    delete characterData.updatedAt;
    
    // Update fields for the duplicate
    characterData.name = newName;
    characterData.status = 'pending'; // Duplicates start as pending
    characterData.reviewedBy = null;
    characterData.reviewedAt = null;
    characterData.feedback = null;
    characterData.submittedAt = new Date();
    
    // Generate new edit password
    characterData.editPassword = Math.random().toString(36).substring(2, 10);

    const duplicatedCharacter = new Character(characterData);
    await duplicatedCharacter.save();

    res.status(201).json({
      success: true,
      message: 'Character duplicated successfully',
      character: duplicatedCharacter
    });

  } catch (error) {
    console.error('Error duplicating character:', error);
    res.status(500).json({ error: 'Failed to duplicate character' });
  }
}));

module.exports = router;
