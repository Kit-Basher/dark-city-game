const fs = require('fs').promises;
const path = require('path');
const Character = require('../models/Character');

// Ensure profiles directory exists and regenerate profiles for approved characters
async function initializeProfiles() {
  try {
    const profilesDir = path.join(process.cwd(), 'characters', 'profiles');
    await fs.mkdir(profilesDir, { recursive: true });
    
    // Find all approved characters and generate profiles
    const approvedCharacters = await Character.find({ status: 'approved' });
    
    for (const character of approvedCharacters) {
      try {
        await generateCharacterProfile(character);
      } catch (error) {
        console.error(`Failed to generate profile for ${character.name}:`, error.message);
      }
    }
    
    console.log(`✅ Generated ${approvedCharacters.length} character profiles`);
  } catch (error) {
    console.error('❌ Failed to initialize profiles:', error.message);
  }
}

async function generateCharacterProfile(character) {
  try {
    // Read the template (use absolute path for Railway)
    const templatePath = path.join(process.cwd(), 'characters', 'profile-template.html');
    const template = await fs.readFile(templatePath, 'utf8');
    
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
      }),
      '{{PHOTOS_SECTION}}': (() => {
        let photosHTML = '';
        
        // Handle individual photo fields (humanPhoto, monsterPhoto)
        if (character.humanPhoto || character.monsterPhoto) {
          photosHTML += '<div class="character-forms">';
          
          if (character.humanPhoto) {
            photosHTML += `
              <div class="human-form">
                <h4>Human Form</h4>
                <img src="${character.humanPhoto}" alt="Human form photo" />
              </div>
            `;
          }
          
          if (character.monsterPhoto) {
            photosHTML += `
              <div class="monster-form">
                <h4>Monster Form</h4>
                <img src="${character.monsterPhoto}" alt="Monster form photo" />
              </div>
            `;
          }
          
          photosHTML += '</div>';
        }
        
        // Handle photos array
        if (character.photos && character.photos.length > 0) {
          photosHTML += character.photos.map(photo => 
            `<img src="${photo.url}" alt="${photo.caption || 'Character photo'}" />`
          ).join('');
        }
        
        if (photosHTML) {
          const result = `<div class="profile-photos">
          <h3>Photos</h3>
          ${photosHTML}
        </div>`;
          return result;
        } else {
          return '<div class="profile-photos"><p>No photos uploaded</p></div>';
        }
      })(),
      '{{DARKEST_SELF_SECTION}}': character.darkestSelf ? 
        `<div class="darkest-self">
          <h3>Darkest Self</h3>
          <p>${character.darkestSelf}</p>
        </div>` : '',
      '{{MOVES_SECTION}}': character.moves && character.moves.length > 0 ? 
        `<div class="moves">
          <h3>Moves</h3>
          ${character.moves.map(move => 
            `<div class="move">
              <h4>${move.name}</h4>
              <p>${move.description}</p>
            </div>`
          ).join('')}
        </div>` : '',
      '{{SKILLS_SECTION}}': '', // Not implemented yet
      '{{HUMAN_PHYSICAL_STATS}}': character.humanHeight || character.humanWeight ? 
        `<div class="human-stats">
          <h3>Human Form</h3>
          ${character.humanHeight ? `<p>Height: ${character.humanHeight}</p>` : ''}
          ${character.humanWeight ? `<p>Weight: ${character.humanWeight}</p>` : ''}
        </div>` : '',
      '{{MONSTER_PHYSICAL_STATS}}': character.werewolfHeight || character.werewolfWeight ? 
        `<div class="monster-stats">
          <h3>Werewolf Form</h3>
          ${character.werewolfHeight ? `<p>Height: ${character.werewolfHeight}</p>` : ''}
          ${character.werewolfWeight ? `<p>Weight: ${character.werewolfWeight}</p>` : ''}
        </div>` : '',
      '{{CHARACTER_ID}}': character._id || '',
      '{{EDIT_PASSWORD}}': character.editPassword || ''
    };
    
    // Replace placeholders in template
    let profileHTML = template;
    for (const [placeholder, value] of Object.entries(replacements)) {
      const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
      profileHTML = profileHTML.replace(regex, value);
    }
    
    // Create safe filename
    const safeName = character.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Ensure profiles directory exists (use absolute path for Railway)
    const profilesDir = path.join(process.cwd(), 'characters', 'profiles');
    await fs.mkdir(profilesDir, { recursive: true });
    
    // Write profile page
    const profilePath = path.join(profilesDir, `${safeName}-${character._id}.html`);
    await fs.writeFile(profilePath, profileHTML, 'utf8');
    
    // Log successful generation
    const logger = require('../config/logging').logger;
    if (logger) {
      logger.info('Character profile generated:', { profilePath, characterId: character._id });
    }
    
  } catch (error) {
    // Use proper logging instead of console.error
    const logger = require('../config/logging').logger;
    if (logger) {
      logger.error('Error generating character profile:', { error: error.message, characterId: character._id });
    } else {
      // Fallback to console.error only if logger unavailable
      console.error('Error generating character profile:', error);
    }
    // Don't throw error - profile generation failure shouldn't break approval
  }
}

module.exports = { generateCharacterProfile, initializeProfiles };
