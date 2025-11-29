// Character Editing API for Dark City RPG
class CharacterEditAPI {
    constructor() {
        this.baseURL = window.APP_CONFIG ? window.APP_CONFIG.apiURL : '/api';
    }

    // Get character data for editing
    async getCharacterForEdit(characterId, editPassword) {
        try {
            const url = new URL(`${this.baseURL}/characters/${characterId}`, window.location.origin);
            if (editPassword) {
                url.searchParams.set('editPassword', editPassword);
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': window.APP_CONFIG?.API_KEY ? `Bearer ${window.APP_CONFIG.API_KEY}` : ''
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching character for edit:', error);
            throw error;
        }
    }

    // Update character data
    async updateCharacter(characterId, updateData, editPassword) {
        try {
            // Validate and sanitize input data
            if (!updateData || typeof updateData !== 'object') {
                throw new Error('Invalid update data provided');
            }

            console.log('🔍 API Debug - updateCharacter called:', {
                characterId,
                characterIdType: typeof characterId,
                hasEditPassword: !!editPassword,
                updateDataKeys: Object.keys(updateData),
                hasMoves: !!updateData.moves,
                movesCount: updateData.moves ? updateData.moves.length : 0
            });

            const sanitizedData = window.InputSanitizer ? 
                window.InputSanitizer.validateCharacterData(updateData) : updateData;

            const url = new URL(`${this.baseURL}/characters/${characterId}`, window.location.origin);
            if (editPassword) {
                url.searchParams.set('editPassword', editPassword);
            }

            console.log('🔍 API Debug - Request URL:', url.toString());

            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': window.APP_CONFIG?.API_KEY ? `Bearer ${window.APP_CONFIG.API_KEY}` : ''
                },
                body: JSON.stringify(sanitizedData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating character:', error);
            throw error;
        }
    }

    // Change edit password
    async changeEditPassword(characterId, currentPassword, newPassword) {
        try {
            if (!currentPassword || !newPassword) {
                throw new Error('Current password and new password are required');
            }

            if (newPassword.length < 4) {
                throw new Error('New password must be at least 4 characters long');
            }

            const response = await fetch(`${this.baseURL}/characters/${characterId}/edit-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': window.APP_CONFIG?.API_KEY ? `Bearer ${window.APP_CONFIG.API_KEY}` : ''
                },
                body: JSON.stringify({
                    currentPassword: window.InputSanitizer ? 
                        window.InputSanitizer.sanitizeFeedback(currentPassword) : currentPassword,
                    newPassword: window.InputSanitizer ? 
                        window.InputSanitizer.sanitizeFeedback(newPassword) : newPassword
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error changing edit password:', error);
            throw error;
        }
    }

    // Duplicate character
    async duplicateCharacter(characterId, editPassword, newName) {
        try {
            if (!editPassword || !newName) {
                throw new Error('Edit password and new name are required');
            }

            const sanitizedName = window.InputSanitizer ? 
                window.InputSanitizer.sanitizeCharacterName(newName) : newName;

            const response = await fetch(`${this.baseURL}/characters/${characterId}/duplicate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': window.APP_CONFIG?.API_KEY ? `Bearer ${window.APP_CONFIG.API_KEY}` : ''
                },
                body: JSON.stringify({
                    editPassword: window.InputSanitizer ? 
                        window.InputSanitizer.sanitizeFeedback(editPassword) : editPassword,
                    newName: sanitizedName
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error duplicating character:', error);
            throw error;
        }
    }

    // Validate edit password
    async validateEditPassword(characterId, editPassword) {
        try {
            const character = await this.getCharacterForEdit(characterId, editPassword);
            return !!character;
        } catch (error) {
            return false;
        }
    }

    // Auto-save draft (debounced)
    createAutoSave(characterId, editPassword, onSaveComplete) {
        let saveTimeout;
        let isSaving = false;

        return async (updateData) => {
            // Clear previous timeout
            if (saveTimeout) {
                clearTimeout(saveTimeout);
            }

            // If already saving, queue the next save
            if (isSaving) {
                saveTimeout = setTimeout(() => this.createAutoSave(characterId, editPassword, onSaveComplete)(updateData), 1000);
                return;
            }

            // Set new timeout for auto-save
            saveTimeout = setTimeout(async () => {
                try {
                    isSaving = true;
                    await this.updateCharacter(characterId, updateData, editPassword);
                    if (onSaveComplete) onSaveComplete(true);
                } catch (error) {
                    console.error('Auto-save failed:', error);
                    if (onSaveComplete) onSaveComplete(false, error);
                } finally {
                    isSaving = false;
                }
            }, 2000); // Auto-save after 2 seconds of inactivity
        };
    }

    // Listen for real-time character updates
    onCharacterUpdated(callback) {
        if (window.serverAPI && window.serverAPI.socket) {
            window.serverAPI.socket.on('characterUpdated', callback);
        }
    }

    // Stop listening for character updates
    offCharacterUpdated(callback) {
        if (window.serverAPI && window.serverAPI.socket) {
            window.serverAPI.socket.off('characterUpdated', callback);
        }
    }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CharacterEditAPI;
}

// Global availability
window.CharacterEditAPI = CharacterEditAPI;

// Instantiate for global use
window.characterEditAPI = new CharacterEditAPI();
