// Server API Client for Dark City RPG
class ServerAPI {
    constructor() {
        // Use configuration based on environment
        this.baseURL = window.APP_CONFIG ? window.APP_CONFIG.apiURL : '/api';
        this.socket = null;
    }

    // Initialize WebSocket connection
    initSocket() {
        // Use configured socket URL
        const socketURL = window.APP_CONFIG ? window.APP_CONFIG.socketURL : window.location.origin;
        this.socket = io(socketURL);
        
        this.socket.on('connect', () => {
            // Connected to server
        });
        
        this.socket.on('disconnect', () => {
            // Disconnected from server
        });
        
        return this.socket;
    }

    // Join moderator room
    joinModerator() {
        if (this.socket) {
            this.socket.emit('joinModerator');
            // Joined moderator room
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
                    'Authorization': `Bearer ${window.APP_CONFIG?.API_KEY || 'dark-city-dev-key'}`
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
                    'Authorization': `Bearer ${window.APP_CONFIG?.API_KEY || 'dark-city-dev-key'}`
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
            const response = await fetch(`${this.baseURL}/characters/submissions`, {
                headers: {
                    'Authorization': `Bearer ${window.CONFIG?.API_KEY || process.env.API_KEY || 'dark-city-dev-key'}`
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const submissions = await response.json();
            // Loaded ${submissions.length} submissions from server
            return submissions;
        } catch (error) {
            // Error loading submissions: error
            return [];
        }
    }

    // Get pending submissions (moderator)
    async getPendingSubmissions() {
        try {
            const response = await fetch(`${this.baseURL}/characters/pending`, {
                headers: {
                    'Authorization': `Bearer ${window.APP_CONFIG?.API_KEY || 'dark-city-dev-key'}`
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const pending = await response.json();
            // Loaded ${pending.length} pending submissions from server
            return pending;
        } catch (error) {
            // Error loading pending submissions: error
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
                    'Authorization': `Bearer ${window.APP_CONFIG?.API_KEY || 'dark-city-dev-key'}`
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
