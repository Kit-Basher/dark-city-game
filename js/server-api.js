// Server API Client for Dark City RPG
class ServerAPI {
    constructor() {
        // Use Railway API for production
        this.baseURL = 'https://dark-city-game-production.up.railway.app/api';
        this.socketURL = 'https://dark-city-game-production.up.railway.app';
        this.socket = null;
    }

    // Initialize WebSocket connection
    initSocket() {
        // Use Railway socket URL
        this.socket = io(this.socketURL);
        
        this.socket.on('connect', () => {
            console.log('Connected to server');
        });
        
        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
        });
        
        return this.socket;
    }

    // Join moderator room
    joinModerator() {
        if (this.socket) {
            this.socket.emit('joinModerator');
            console.log('Joined moderator room');
        }
    }

    // Leave moderator room
    leaveModerator() {
        if (this.socket) {
            this.socket.emit('leaveModerator');
            // Left moderator room
        }
    }

    // Submit new character
    async submitCharacter(characterData) {
        try {
            const response = await fetch(`${this.baseURL}/characters/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer dark-city-production-key`
                },
                body: JSON.stringify(characterData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server response error:', response.status, errorText);
                throw new Error(`Server responded with ${response.status}: ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Submit character error:', error);
            throw error;
        }
    }

    // Get all approved characters (for main page)
    async getApprovedCharacters() {
        try {
            const response = await fetch(`${this.baseURL}/characters`, {
                headers: {
                    'Authorization': `Bearer dark-city-production-key`
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            const characters = data.characters || data; // Handle both formats
            // Loaded ${characters.length} approved characters from server
            return characters;
        } catch (error) {
            // Error loading approved characters: error
            return [];
        }
    }

    // Get all submissions (moderator only)
    async getAllSubmissions() {
        try {
            // Get all characters (both pending and approved)
            const response = await fetch(`${this.baseURL}/characters`, {
                headers: {
                    'Authorization': `Bearer dark-city-production-key`
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const characters = await response.json();
            console.log(`Loaded ${characters.length} characters from server`);
            return characters;
        } catch (error) {
            console.error('Error loading submissions:', error);
            throw error;
        }
    }

    // Get pending submissions (moderator)
    async getPendingSubmissions() {
        try {
            const response = await fetch(`${this.baseURL}/characters?status=pending`, {
                headers: {
                    'Authorization': `Bearer dark-city-production-key`
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const pending = await response.json();
            console.log(`Loaded ${pending.length} pending submissions from server`);
            return pending;
        } catch (error) {
            console.error('Error loading pending submissions:', error);
            return [];
        }
    }

    // Approve character (moderator)
    async approveCharacter(characterId, feedback = '', reviewedBy = 'moderator') {
        try {
            const response = await fetch(`${this.baseURL}/characters/${characterId}/approve`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer dark-city-production-key`
                },
                body: JSON.stringify({ feedback, reviewedBy })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            // Character approved: result.name
            return result;
        } catch (error) {
            // Error approving character: error
            throw error;
        }
    }

    // Reject character (moderator)
    async rejectCharacter(characterId, feedback = '', reviewedBy = 'moderator') {
        try {
            const response = await fetch(`${this.baseURL}/characters/${characterId}/reject`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ feedback, reviewedBy })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            // Character rejected: result.name
            return result;
        } catch (error) {
            // Error rejecting character: error
            throw error;
        }
    }

    // Delete character (moderator)
    async deleteCharacter(characterId) {
        try {
            const response = await fetch(`${this.baseURL}/characters/${characterId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            // Character deleted: result.message
            return result;
        } catch (error) {
            // Error deleting character: error
            throw error;
        }
    }

    // Get client identifier
    getClientId() {
        let clientId = localStorage.getItem('clientId');
        if (!clientId) {
            clientId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('clientId', clientId);
        }
        return clientId;
    }

    // Listen for real-time events
    onNewSubmission(callback) {
        if (this.socket) {
            this.socket.on('newSubmission', callback);
        }
    }

    onCharacterApproved(callback) {
        if (this.socket) {
            this.socket.on('characterApproved', callback);
        }
    }

    onCharacterRejected(callback) {
        if (this.socket) {
            this.socket.on('characterRejected', callback);
        }
    }

    onCharacterDeleted(callback) {
        if (this.socket) {
            this.socket.on('characterDeleted', callback);
        }
    }
}

// Instantiate the server API for global use
window.serverAPI = new ServerAPI();
