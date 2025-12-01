// Input Sanitization and Validation Utilities for Dark City Game

class InputSanitizer {
  // Sanitize HTML to prevent XSS
  static sanitizeHtml(str) {
    if (typeof str !== 'string') return '';
    
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Sanitize and validate character name
  static sanitizeCharacterName(name) {
    if (!name || typeof name !== 'string') return 'Unnamed Character';
    
    // Remove HTML tags and excessive whitespace
    const clean = name.replace(/<[^>]*>/g, '').trim().replace(/\s+/g, ' ');
    
    // Length validation
    if (clean.length > 50) return clean.substring(0, 47) + '...';
    if (clean.length < 1) return 'Unnamed Character';
    
    return clean;
  }

  // Sanitize bio/description text
  static sanitizeBio(bio) {
    if (!bio || typeof bio !== 'string') return 'No biography available.';
    
    // Remove HTML tags but preserve line breaks
    const clean = bio.replace(/<[^>]*>/g, '').replace(/\n/g, ' ').trim();
    
    // Length validation
    if (clean.length > 1000) return clean.substring(0, 997) + '...';
    if (clean.length < 1) return 'No biography available.';
    
    return clean;
  }

  // Sanitize URL (for photos, etc.)
  static sanitizeUrl(url) {
    if (!url || typeof url !== 'string') return null;
    
    try {
      // Allow data URLs for uploaded photos and http/https for external URLs
      if (url.startsWith('data:')) {
        // Basic validation for data URLs
        if (url.includes('image/') && url.includes('base64,')) {
          return url;
        }
        return null;
      }
      
      // Basic URL validation for http/https
      const parsed = new URL(url);
      
      // Only allow http/https protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) return null;
      
      // Prevent data: URLs and other potentially dangerous schemes
      return parsed.href;
    } catch (e) {
      return null;
    }
  }

  // Validate and sanitize photo array
  static sanitizePhotos(photos) {
    if (!Array.isArray(photos)) return [];
    
    return photos
      .filter(photo => photo && typeof photo === 'object')
      .map(photo => ({
        url: this.sanitizeUrl(photo.url),
        caption: this.sanitizeHtml(photo.caption || '')
      }))
      .filter(photo => photo.url); // Only keep photos with valid URLs
  }

  // Validate numeric fields as strings (for server validation compatibility)
  static sanitizeNumberString(value, min = 0, max = 100, defaultValue = '0') {
    const str = String(value || '').trim();
    const num = parseInt(str, 10);
    
    if (isNaN(num)) return defaultValue;
    if (num < min) return String(min);
    if (num > max) return String(max);
    
    return str; // Return as string, not number
  }

  // Validate classification values (now free text)
  static sanitizeClassification(value) {
    if (!value || typeof value !== 'string') return 'Unknown';
    
    const clean = value.trim();
    return clean.length > 0 ? clean : 'Unknown';
  }

  // Validate email format
  static sanitizeEmail(email) {
    if (!email || typeof email !== 'string') return null;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const clean = email.trim().toLowerCase();
    
    return emailRegex.test(clean) ? clean : null;
  }

  // Sanitize and validate feedback text
  static sanitizeFeedback(feedback) {
    if (!feedback || typeof feedback !== 'string') return '';
    
    const clean = feedback.replace(/<[^>]*>/g, '').trim();
    
    // Length validation
    if (clean.length > 500) return clean.substring(0, 497) + '...';
    
    return clean;
  }

  // Comprehensive character data validation
  static validateCharacterData(characterData) {
    const sanitized = {
      // Basic character info
      name: this.sanitizeCharacterName(characterData.name),
      classification: this.sanitizeClassification(characterData.classification),
      playbook: this.sanitizeCharacterName(characterData.playbook),
      subtype: this.sanitizeCharacterName(characterData.subtype),
      bio: this.sanitizeBio(characterData.bio),
      
      // Numeric fields as strings (for server validation)
      fatePoints: this.sanitizeNumberString(characterData.fatePoints, 0, 10, '1'),
      physicalStress: this.sanitizeNumberString(characterData.physicalStress, 0, 10, '2'),
      mentalStress: this.sanitizeNumberString(characterData.mentalStress, 0, 10, '2'),
      physicalConsequences: this.sanitizeNumberString(characterData.physicalConsequences, 0, 5, '0'),
      mentalConsequences: this.sanitizeNumberString(characterData.mentalConsequences, 0, 5, '0'),
      
      // Character details
      apparentAge: this.sanitizeCharacterName(characterData.apparentAge),
      actualAge: this.sanitizeCharacterName(characterData.actualAge),
      humanHeight: this.sanitizeCharacterName(characterData.humanHeight),
      humanWeight: this.sanitizeCharacterName(characterData.humanWeight),
      monsterHeight: this.sanitizeCharacterName(characterData.monsterHeight),
      monsterWeight: this.sanitizeCharacterName(characterData.monsterWeight),
      
      // Photos (sanitize URLs)
      humanPhoto: this.sanitizeUrl(characterData.humanPhoto),
      monsterPhoto: this.sanitizeUrl(characterData.monsterPhoto),
      
      // Character aspects and powers
      aspect1: this.sanitizeHtml(characterData.aspect1 || ''),
      aspect2: this.sanitizeHtml(characterData.aspect2 || ''),
      aspect3: this.sanitizeHtml(characterData.aspect3 || ''),
      darkestSelf: this.sanitizeBio(characterData.darkestSelf),
      darkestSelfDesc: this.sanitizeBio(characterData.darkestSelfDesc),
      specialResources: this.sanitizeHtml(characterData.specialResources || ''),
      connections: this.sanitizeHtml(characterData.connections || ''),
      
      // Temporary aspects and consequences
      tempAspect1: this.sanitizeHtml(characterData.tempAspect1 || ''),
      tempAspect2: this.sanitizeHtml(characterData.tempAspect2 || ''),
      consequence1: this.sanitizeHtml(characterData.consequence1 || ''),
      consequence2: this.sanitizeHtml(characterData.consequence2 || ''),
      
      // Dates
      tempDate1: this.sanitizeCharacterName(characterData.tempDate1),
      tempDate2: this.sanitizeCharacterName(characterData.tempDate2),
      consequenceDate1: this.sanitizeCharacterName(characterData.consequenceDate1),
      consequenceDate2: this.sanitizeCharacterName(characterData.consequenceDate2)
    };

    // Validate moves array - preserve source field
    if (Array.isArray(characterData.moves)) {
      sanitized.moves = characterData.moves
        .filter(move => move && typeof move === 'object')
        .map(move => ({
          name: this.sanitizeCharacterName(move.name),
          description: this.sanitizeBio(move.description),
          source: this.sanitizeCharacterName(move.source) // Preserve source field
        }))
        .filter(move => move.name && move.description && move.source);
    } else {
      sanitized.moves = [];
    }

    // Validate skills array
    if (Array.isArray(characterData.skills)) {
      sanitized.skills = characterData.skills
        .filter(skill => skill && typeof skill === 'object')
        .map(skill => ({
          name: this.sanitizeCharacterName(skill.name),
          value: this.sanitizeNumberString(skill.value, 1, 4, '1')
        }))
        .filter(skill => skill.name && skill.value);
    } else {
      sanitized.skills = [];
    }

    // Validate items
    for (let i = 1; i <= 10; i++) {
      const itemKey = `item${i}`;
      const descKey = `itemDesc${i}`;
      if (characterData[itemKey]) {
        sanitized[itemKey] = this.sanitizeHtml(characterData[itemKey]);
        sanitized[descKey] = this.sanitizeHtml(characterData[descKey] || '');
      }
    }

    // Validate scenes
    for (let i = 1; i <= 10; i++) {
      const sceneKey = `scene${i}`;
      const charsKey = `sceneChars${i}`;
      if (characterData[sceneKey]) {
        sanitized[sceneKey] = this.sanitizeHtml(characterData[sceneKey]);
        sanitized[charsKey] = this.sanitizeHtml(characterData[charsKey] || '');
      }
    }

    // Edit password (if present)
    if (characterData.editPassword) {
      sanitized.editPassword = this.sanitizeCharacterName(characterData.editPassword);
    }

    return sanitized;
  }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InputSanitizer;
}

// Global availability
window.InputSanitizer = InputSanitizer;
