const express = require('express');
const router = express.Router();
const Character = require('../models/Character');
const CharacterService = require('../services/characterService');
const { validate, characterSchema } = require('../middleware/validation');
const fs = require('fs').promises;
const path = require('path');

/**
 * Generate a profile page for an approved character
 */
async function generateCharacterProfile(character) {
  try {
    // Read the template
    const templatePath = path.join(__dirname, '../../characters/profile-template.html');
    const template = await fs.readFile(templatePath, 'utf8');
    
    // Prepare template replacements
    const replacements = {
      '{{CHARACTER_NAME}}': character.name || 'Unnamed Character',
      '{{CLASSIFICATION}}': character.classification || 'Unknown',
      '{{PLAYBOOK}}': character.playbook || 'Unknown',
      '{{SUBTYPE}}': character.subtype || 'None',
      '{{BIO}}': character.bio || 'No biography available.',
      '{{FATE_POINTS}}': character.fatePoints || '1',
      '{{PHYSICAL_STRESS}}': character.physicalStress || '2',
      '{{MENTAL_STRESS}}': character.mentalStress || '2',
      '{{APPARENT_AGE}}': character.apparentAge || 'Unknown',
      '{{ACTUAL_AGE}}': character.actualAge || 'Unknown',
      '{{JOIN_DATE}}': new Date(character.submittedAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    };
    
    // Handle Darkest Self section
    let darkestSelfSection = '';
    if (character.darkestSelf) {
      darkestSelfSection = `
        <div class="bio-section">
          <h2 class="section-title">Darkest Self</h2>
          <p class="bio-text">${character.darkestSelf}</p>
        </div>
      `;
    }
    replacements['{{DARKEST_SELF_SECTION}}'] = darkestSelfSection;
    
    // Handle Moves section
    let movesSection = '';
    if (character.moves && character.moves.length > 0) {
      const movesHTML = character.moves.map(move => `
        <div class="move-item">
          <div class="move-name">${move.name}</div>
          <div class="move-description">${move.description || 'No description available'}</div>
        </div>
      `).join('');
      
      movesSection = `
        <div class="moves-section">
          <h2 class="section-title">Moves & Abilities</h2>
          ${movesHTML}
        </div>
      `;
    }
    replacements['{{MOVES_SECTION}}'] = movesSection;
    
    // Handle Skills section
    let skillsSection = '';
    if (character.skills && character.skills.length > 0) {
      const skillsHTML = character.skills.map(skill => `
        <div class="skill-item">
          <div class="skill-name">${skill.name}</div>
          <div class="skill-description">Level ${skill.level}</div>
        </div>
      `).join('');
      
      skillsSection = `
        <div class="skills-section">
          <h2 class="section-title">Skills</h2>
          ${skillsHTML}
        </div>
      `;
    }
    replacements['{{SKILLS_SECTION}}'] = skillsSection;
    
    // Handle photos
    let photosSection = '';
    if (character.humanPhoto || character.monsterPhoto) {
      const photosHTML = [];
      
      if (character.humanPhoto) {
        photosHTML.push(`
          <div class="profile-photo">
            <img src="${character.humanPhoto}" alt="${character.name} - Human Form">
            <div class="profile-photo-label">👤 Human Form</div>
          </div>
        `);
      }
      
      if (character.monsterPhoto) {
        photosHTML.push(`
          <div class="profile-photo">
            <img src="${character.monsterPhoto}" alt="${character.name} - Monster Form">
            <div class="profile-photo-label">👹 Monster Form</div>
          </div>
        `);
      }
      
      photosSection = `
        <div class="profile-photos">
          ${photosHTML.join('')}
        </div>
      `;
    } else {
      photosSection = `
        <div class="profile-photos">
          <div class="profile-photo">
            <div style="width: 150px; height: 150px; border: 3px dashed #666; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: #2a2a2a;">
              <div style="color: #666; text-align: center; padding: 1rem;">No photos uploaded</div>
            </div>
            <div class="profile-photo-label">📷 No Images</div>
          </div>
        </div>
      `;
    }
    replacements['{{PHOTOS_SECTION}}'] = photosSection;
    
    // Handle physical stats
    let humanPhysicalStats = '';
    if (character.humanHeight || character.humanWeight) {
      humanPhysicalStats = `
        <p><strong>Human Height:</strong> ${character.humanHeight || 'Unknown'}</p>
        <p><strong>Human Weight:</strong> ${character.humanWeight || 'Unknown'}</p>
      `;
    }
    replacements['{{HUMAN_PHYSICAL_STATS}}'] = humanPhysicalStats;
    
    let monsterPhysicalStats = '';
    if (character.monsterHeight || character.monsterWeight) {
      monsterPhysicalStats = `
        <p><strong>Monster Height:</strong> ${character.monsterHeight || 'Unknown'}</p>
        <p><strong>Monster Weight:</strong> ${character.monsterWeight || 'Unknown'}</p>
      `;
    }
    replacements['{{MONSTER_PHYSICAL_STATS}}'] = monsterPhysicalStats;
    
    // Add edit password data
    replacements['{{EDIT_PASSWORD}}'] = character.editPassword || '';
    replacements['{{CHARACTER_ID}}'] = character._id;
    
    // Replace all placeholders
    let profileHTML = template;
    for (const [placeholder, value] of Object.entries(replacements)) {
      profileHTML = profileHTML.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
    }
    
    // Create safe filename
    const safeName = character.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Ensure profiles directory exists
    const profilesDir = path.join(__dirname, '../../characters/profiles');
    await fs.mkdir(profilesDir, { recursive: true });
    
    // Write profile page
    const profilePath = path.join(profilesDir, `${safeName}-${character._id}.html`);
    await fs.writeFile(profilePath, profileHTML, 'utf8');
    
    console.log(`✅ Generated profile page: ${safeName}-${character._id}.html`);
    
  } catch (error) {
    console.error('Error generating character profile:', error);
    // Don't throw error - profile generation failure shouldn't break approval
  }
}

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
    console.log('🔍 Received character submission with keys:', Object.keys(req.body));
    console.log('🔍 Has humanPhoto:', !!req.body.humanPhoto);
    console.log('🔍 Has monsterPhoto:', !!req.body.monsterPhoto);
    console.log('🔍 Human photo length:', req.body.humanPhoto ? req.body.humanPhoto.length : 0);
    console.log('🔍 Monster photo length:', req.body.monsterPhoto ? req.body.monsterPhoto.length : 0);
    
    const character = new Character({
      ...req.body,
      submittedBy: req.body.submittedBy || 'anonymous',
    });
    
    const savedCharacter = await character.save();
    
    console.log('✅ Character saved with photo fields:', {
      hasHumanPhoto: !!savedCharacter.humanPhoto,
      hasMonsterPhoto: !!savedCharacter.monsterPhoto,
      humanPhotoLength: savedCharacter.humanPhoto ? savedCharacter.humanPhoto.length : 0,
      monsterPhotoLength: savedCharacter.monsterPhoto ? savedCharacter.monsterPhoto.length : 0
    });
    
    // Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      io.emit('newSubmission', savedCharacter);
    }
    
    res.status(201).json(savedCharacter);
  } catch (error) {
    console.error('❌ Error submitting character:', error);
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
    
    // Generate profile page for approved character
    await generateCharacterProfile(character);
    
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

/**
 * @swagger
 * /characters/{id}:
 *   get:
 *     summary: Get a specific character by ID
 *     description: Retrieve a single character by their unique ID
 *     tags: [Characters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Character ID
 *     responses:
 *       200:
 *         description: Character details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Character'
 *       404:
 *         description: Character not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', async (req, res) => {
  try {
    const character = await Character.findById(req.params.id);
    
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    console.log('🔍 Retrieved character with photos:', {
      id: character._id,
      name: character.name,
      hasHumanPhoto: !!character.humanPhoto,
      hasMonsterPhoto: !!character.monsterPhoto,
      humanPhotoLength: character.humanPhoto ? character.humanPhoto.length : 0,
      monsterPhotoLength: character.monsterPhoto ? character.monsterPhoto.length : 0
    });
    
    res.json(character);
  } catch (error) {
    console.error('❌ Error retrieving character:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
