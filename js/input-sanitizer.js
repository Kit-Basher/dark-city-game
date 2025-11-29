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
      // Basic URL validation
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

  // Validate numeric fields
  static sanitizeNumber(value, min = 0, max = 100, defaultValue = 0) {
    const num = parseInt(value, 10);
    
    if (isNaN(num)) return defaultValue;
    if (num < min) return min;
    if (num > max) return max;
    
    return num;
  }

  // Validate classification/playbook values
  static sanitizeClassification(value) {
    if (!value || typeof value !== 'string') return 'Unknown';
    
    const validClassifications = [
      'Mortal', 'Gifted', 'Mage', 'Fae', 'Ancient', 'Wild', 'Unsated',
      'Legend', 'Incarnation', 'Patron', 'Champion', 'Darkling', 'Mad',
      'Aware', 'Covert', 'Aquatic', 'Giant', 'Ageless', 'Construct'
    ];
    
    const clean = value.trim();
    return validClassifications.includes(clean) ? clean : 'Unknown';
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
      name: this.sanitizeCharacterName(characterData.name),
      classification: this.sanitizeClassification(characterData.classification),
      playbook: this.sanitizeCharacterName(characterData.playbook),
      subtype: this.sanitizeCharacterName(characterData.subtype),
      bio: this.sanitizeBio(characterData.bio),
      fatePoints: this.sanitizeNumber(characterData.fatePoints, 0, 10, 1),
      physicalStress: this.sanitizeNumber(characterData.physicalStress, 0, 10, 2),
      mentalStress: this.sanitizeNumber(characterData.mentalStress, 0, 10, 2),
      apparentAge: this.sanitizeCharacterName(characterData.apparentAge),
      actualAge: this.sanitizeCharacterName(characterData.actualAge),
      photos: this.sanitizePhotos(characterData.photos),
      humanPhoto: this.sanitizeUrl(characterData.humanPhoto),
      monsterPhoto: this.sanitizeUrl(characterData.monsterPhoto),
      darkestSelf: this.sanitizeBio(characterData.darkestSelf),
      humanHeight: this.sanitizeCharacterName(characterData.humanHeight),
      humanWeight: this.sanitizeCharacterName(characterData.humanWeight),
      werewolfHeight: this.sanitizeCharacterName(characterData.werewolfHeight),
      werewolfWeight: this.sanitizeCharacterName(characterData.werewolfWeight)
    };

    // Validate moves array
    if (Array.isArray(characterData.moves)) {
      sanitized.moves = characterData.moves
        .filter(move => move && typeof move === 'object')
        .map(move => ({
          name: this.sanitizeCharacterName(move.name),
          description: this.sanitizeBio(move.description)
        }))
        .filter(move => move.name && move.description);
    } else {
      sanitized.moves = [];
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
