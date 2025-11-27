// Moderator Panel - Server-based system for real-time character submissions
class ModeratorPanel {
    constructor() {
        this.serverAPI = window.serverAPI;
        this.currentFilter = 'pending';
        this.allSubmissions = [];
        this.init();
    }

    init() {
        // Initialize WebSocket connection
        this.serverAPI.initSocket();
        
        // Join moderator room for real-time notifications
        this.serverAPI.joinModerator();
        
        // Setup event listeners
        this.setupEventListeners();
        this.setupSocketListeners();
        
        // Load initial data
        this.loadSubmissions();
    }

    setupSocketListeners() {
        // Listen for new submissions
        this.serverAPI.onNewSubmission((submission) => {
            console.log('📨 New submission received:', submission.name);
            this.showNotification(`📝 New submission: ${submission.name}`);
            this.loadSubmissions(); // Refresh the list
        });

        // Listen for character approvals
        this.serverAPI.onCharacterApproved((character) => {
            console.log('✅ Character approved:', character.name);
            this.showNotification(`✅ Approved: ${character.name}`);
            this.loadSubmissions(); // Refresh the list
        });

        // Listen for character rejections
        this.serverAPI.onCharacterRejected((character) => {
            console.log('❌ Character rejected:', character.name);
            this.showNotification(`❌ Rejected: ${character.name}`);
            this.loadSubmissions(); // Refresh the list
        });

        // Listen for character deletions
        this.serverAPI.onCharacterDeleted((character) => {
            console.log('🗑️ Character deleted:', character.name);
            this.showNotification(`🗑️ Deleted: ${character.name}`);
            this.loadSubmissions(); // Refresh the list
        });
    }

    // Load submissions from server
    async loadSubmissions() {
        console.log('Loading submissions from server...');
        
        try {
            this.allSubmissions = await this.serverAPI.getAllSubmissions();
            console.log('Raw API response:', this.allSubmissions);
            console.log('API response type:', typeof this.allSubmissions);
            console.log('API response isArray:', Array.isArray(this.allSubmissions));
            
            // Ensure we have an array
            if (!Array.isArray(this.allSubmissions)) {
                console.warn('API did not return an array, using empty array');
                this.allSubmissions = [];
            }
            
            console.log(`Loaded ${this.allSubmissions.length} submissions from server`);
            
            this.updateStatistics();
            this.renderSubmissions();
            this.updateLastRefresh();
        } catch (error) {
            console.error('Error loading submissions:', error);
            this.showError('Failed to load submissions from server');
        }
    }

    // Update statistics
    updateStatistics() {
        const pending = this.allSubmissions.filter(s => s.status === 'pending');
        const approved = this.allSubmissions.filter(s => s.status === 'approved');
        const rejected = this.allSubmissions.filter(s => s.status === 'rejected');

        document.getElementById('pendingCount').textContent = pending.length;
        document.getElementById('approvedCount').textContent = approved.length;
        document.getElementById('rejectedCount').textContent = rejected.length;
    }

    // Update last refresh time
    updateLastRefresh() {
        const now = new Date().toLocaleTimeString();
        const lastRefreshElement = document.getElementById('lastRefresh');
        if (lastRefreshElement) {
            lastRefreshElement.textContent = `Last refresh: ${now}`;
        }
    }

    // Render submissions based on current filter
    renderSubmissions() {
        const submissionsList = document.getElementById('submissionsList');
        if (!submissionsList) return;

        const filtered = this.allSubmissions.filter(submission => {
            if (this.currentFilter === 'all') return true;
            return submission.status === this.currentFilter;
        });

        if (filtered.length === 0) {
            const noSubmissions = SafeDOM.createHTML('div', {
                className: 'no-submissions'
            }, [
                SafeDOM.createElement('p', {}, `No ${this.currentFilter === 'pending' ? 'pending' : this.currentFilter === 'approved' ? 'approved' : 'rejected'} submissions found.`)
            ]);
            SafeDOM.setContent(submissionsList, noSubmissions);
            return;
        }

        SafeDOM.setContent(submissionsList, filtered.map(submission => this.createSubmissionCard(submission)).join(''));
    }

    // Create submission card HTML
    createSubmissionCard(submission) {
        const character = submission.character || submission;
        const statusColor = {
            pending: '#ff9800',
            approved: '#4CAF50',
            rejected: '#f44336'
        };

        return `
            <div class="submission-card" data-status="${submission.status}">
                <div class="submission-header">
                    <h3>${character.name || 'Unknown Character'}</h3>
                    <span class="status-badge" style="background: ${statusColor[submission.status]}">
                        ${submission.status.toUpperCase()}
                    </span>
                </div>
                
                <div class="submission-details">
                    <div class="character-info">
                        <p><strong>Classification:</strong> ${character.classification || 'N/A'}</p>
                        <p><strong>Playbook:</strong> ${character.playbook || 'N/A'}</p>
                        <p><strong>Submitted:</strong> ${new Date(submission.submittedAt || submission.submitted_at).toLocaleString()}</p>
                        <p><strong>Submitted By:</strong> ${submission.submittedBy || submission.submitted_by || 'Anonymous'}</p>
                    </div>
                    
                    <div class="character-bio">
                        <h4>Character Bio</h4>
                        <p>${character.bio || 'No bio provided'}</p>
                    </div>
                    
                    ${character.skills && character.skills.length > 0 ? `
                        <div class="character-skills">
                            <h4>Skills</h4>
                            <div class="skills-list">
                                ${character.skills.map(skill => `
                                    <div class="skill-item">
                                        <span class="skill-name">${skill.name}</span>
                                        <span class="skill-level">+${skill.level}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${character.moves && character.moves.length > 0 ? `
                        <div class="character-moves">
                            <h4>Moves</h4>
                            <div class="moves-list">
                                ${character.moves.map(move => `
                                    <div class="move-item">
                                        <strong>${move.name}</strong> (${move.source || 'Custom'})
                                        <p>${move.description}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                ${submission.status === 'pending' ? `
                    <div class="submission-actions">
                        <textarea id="feedback-${submission._id || submission.id}" 
                                  placeholder="Add feedback (optional)" 
                                  rows="3"></textarea>
                        <div class="action-buttons">
                            <button class="btn btn-success" onclick="moderatorPanel.approveSubmission('${submission._id || submission.id}')">
                                ✅ Approve
                            </button>
                            <button class="btn btn-warning" onclick="moderatorPanel.requestChanges('${submission._id || submission.id}')">
                                📝 Request Changes
                            </button>
                            <button class="btn btn-danger" onclick="moderatorPanel.rejectSubmission('${submission._id || submission.id}')">
                                ❌ Reject
                            </button>
                        </div>
                    </div>
                ` : `
                    <div class="submission-result">
                        ${submission.feedback ? `
                            <div class="feedback-section">
                                <h4>Feedback</h4>
                                <p>${submission.feedback}</p>
                            </div>
                        ` : ''}
                        <div class="result-info">
                            <p><strong>Reviewed By:</strong> ${submission.reviewedBy || 'Moderator'}</p>
                            <p><strong>Reviewed At:</strong> ${new Date(submission.reviewedAt).toLocaleString()}</p>
                        </div>
                        <button class="btn btn-danger" onclick="moderatorPanel.deleteSubmission('${submission._id || submission.id}')">
                            🗑️ Delete
                        </button>
                    </div>
                `}
            </div>
        `;
    }

    // Filter submissions
    filterSubmissions(filter) {
        this.currentFilter = filter;
        
        // Update filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.filter === filter);
        });
        
        this.renderSubmissions();
    }

    // Approve submission
    async approveSubmission(submissionId) {
        const feedback = document.getElementById(`feedback-${submissionId}`).value;
        
        try {
            const result = await this.serverAPI.approveCharacter(submissionId, feedback, 'moderator');
            
            console.log('Character approved successfully:', result);
            this.showNotification(`✅ Approved: ${result.name}`);
            
            // List will refresh automatically via WebSocket event
        } catch (error) {
            console.error('Approval error:', error);
            this.showError('Failed to approve submission. Please try again.');
        }
    }

    // Request changes (reject with feedback)
    async requestChanges(submissionId) {
        const feedback = document.getElementById(`feedback-${submissionId}`).value;
        
        if (!feedback.trim()) {
            alert('Please provide feedback for the requested changes.');
            return;
        }
        
        try {
            const result = await this.serverAPI.rejectCharacter(submissionId, feedback, 'moderator');
            
            console.log('Changes requested successfully:', result);
            this.showNotification(`📝 Changes requested: ${result.name}`);
            
            // List will refresh automatically via WebSocket event
        } catch (error) {
            console.error('Request changes error:', error);
            this.showError('Failed to request changes. Please try again.');
        }
    }

    // Reject submission
    async rejectSubmission(submissionId) {
        const feedback = document.getElementById(`feedback-${submissionId}`).value || 'Rejected by moderator';
        
        if (confirm('Are you sure you want to reject this submission?')) {
            try {
                const result = await this.serverAPI.rejectCharacter(submissionId, feedback, 'moderator');
                
                console.log('Submission rejected successfully:', result);
                this.showNotification(`❌ Rejected: ${result.name}`);
                
                // List will refresh automatically via WebSocket event
            } catch (error) {
                console.error('Rejection error:', error);
                this.showError('Failed to reject submission. Please try again.');
            }
        }
    }

    // Delete submission
    async deleteSubmission(submissionId) {
        if (confirm('Are you sure you want to delete this submission? This cannot be undone.')) {
            try {
                const result = await this.serverAPI.deleteCharacter(submissionId);
                
                console.log('Submission deleted successfully:', result);
                this.showNotification(`🗑️ Submission deleted`);
                
                // List will refresh automatically via WebSocket event
            } catch (error) {
                console.error('Deletion error:', error);
                this.showError('Failed to delete submission. Please try again.');
            }
        }
    }

    // Delete ALL approved characters (for cleanup)
    async deleteAllApproved() {
        const approvedCount = this.allSubmissions.filter(s => s.status === 'approved').length;
        
        if (approvedCount === 0) {
            alert('No approved characters to delete.');
            return;
        }
        
        if (confirm(`Are you sure you want to delete ALL ${approvedCount} approved characters? This cannot be undone!`)) {
            try {
                const approvedSubmissions = this.allSubmissions.filter(s => s.status === 'approved');
                let deletedCount = 0;
                
                for (const submission of approvedSubmissions) {
                    try {
                        await this.serverAPI.deleteCharacter(submission._id || submission.id);
                        deletedCount++;
                    } catch (error) {
                        console.error('Failed to delete character:', submission.name, error);
                    }
                }
                
                this.showNotification(`🗑️ Deleted ${deletedCount} approved characters`);
                this.loadSubmissions(); // Refresh the list
            } catch (error) {
                console.error('Mass deletion error:', error);
                this.showError('Failed to delete some characters. Please try again.');
            }
        }
    }

    // Delete ALL test characters (characters with "Test" in name)
    async deleteTestCharacters() {
        const testCharacters = this.allSubmissions.filter(s => 
            s.name && s.name.toLowerCase().includes('test')
        );
        
        if (testCharacters.length === 0) {
            alert('No test characters found.');
            return;
        }
        
        if (confirm(`Are you sure you want to delete ${testCharacters.length} test characters? This cannot be undone!`)) {
            try {
                let deletedCount = 0;
                
                for (const character of testCharacters) {
                    try {
                        await this.serverAPI.deleteCharacter(character._id || character.id);
                        deletedCount++;
                    } catch (error) {
                        console.error('Failed to delete test character:', character.name, error);
                    }
                }
                
                this.showNotification(`🗑️ Deleted ${deletedCount} test characters`);
                this.loadSubmissions(); // Refresh the list
            } catch (error) {
                console.error('Test deletion error:', error);
                this.showError('Failed to delete some test characters. Please try again.');
            }
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.filterSubmissions(e.target.dataset.filter);
            });
        });
    }

    // Show notification
    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; 
            background: #4CAF50; color: white; 
            padding: 1rem; border-radius: 5px; 
            z-index: 1000; animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Show error message
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed; top: 20px; right: 20px; 
            background: #f44336; color: white; 
            padding: 1rem; border-radius: 5px; 
            z-index: 1000; animation: slideIn 0.3s ease;
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}

// Initialize the moderator panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.moderatorPanel = new ModeratorPanel();
});
