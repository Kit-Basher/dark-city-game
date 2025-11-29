const fs = require('fs').promises;
const path = require('path');

async function generateCharacterProfile(character) {
  try {
    console.log('🔧 Profile Generation: Starting for character:', character.name);
    
    // Read the template
    const templatePath = path.join(__dirname, '../../characters/profile-template.html');
    console.log('🔧 Profile Generation: Template path:', templatePath);
    const template = await fs.readFile(templatePath, 'utf8');
    console.log('🔧 Profile Generation: Template read successfully, length:', template.length);
    
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
    
    // Ensure profiles directory exists
    const profilesDir = path.join(__dirname, '../../characters/profiles');
    console.log('🔧 Profile Generation: Profiles directory:', profilesDir);
    await fs.mkdir(profilesDir, { recursive: true });
    
    // Write profile page
    const profilePath = path.join(profilesDir, `${safeName}-${character._id}.html`);
    console.log('🔧 Profile Generation: Writing profile to:', profilePath);
    await fs.writeFile(profilePath, profileHTML, 'utf8');
    
    console.log(`✅ Generated profile page: ${safeName}-${character._id}.html`);
    console.log('🔧 Profile Generation: File written successfully');
    
  } catch (error) {
    console.error('Error generating character profile:', error);
    // Don't throw error - profile generation failure shouldn't break approval
  }
}

module.exports = { generateCharacterProfile };
