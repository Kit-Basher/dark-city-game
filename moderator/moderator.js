// Moderator Panel - JavaScript-based system for GitHub Pages
class ModeratorPanel {
    constructor() {
        this.submissionSystem = new CharacterSubmission();
        this.currentFilter = 'pending';
        this.init();
    }

    init() {
        this.loadSubmissions();
        this.setupEventListeners();
        this.setupStorageListener();
        this.setupAutoRefresh();
    }

    setupStorageListener() {
        // Listen for storage changes from other pages
        window.addEventListener('storage', (e) => {
            if (e.key === 'darkCitySubmissions' || e.key === 'darkCitySubmissions_backup') {
                console.log('Storage changed, refreshing submissions...');
                this.loadSubmissions();
            }
        });

        // Listen for custom events from same page
        window.addEventListener('characterSubmission', (e) => {
            console.log('Character submission event:', e.detail);
            if (e.detail.action === 'saved') {
                this.loadSubmissions();
            }
        });
    }

    setupAutoRefresh() {
        // Refresh every 30 seconds to catch new submissions
        setInterval(() => {
            this.loadSubmissions();
        }, 30000);
    }

    setupEventListeners() {
        // Filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.filterSubmissions(e.target.dataset.filter);
            });
        });
    }

    // Load submissions from localStorage
    async loadSubmissions() {
        try {
            console.log('Loading submissions...');
            const submissions = this.submissionSystem.getSubmissions();
            console.log('Loaded submissions:', submissions);
            this.allSubmissions = Object.values(submissions);
            console.log('Submission array:', this.allSubmissions);
            this.updateStats();
            this.displaySubmissions();
            
            // Update last refresh time
            document.getElementById('lastRefresh').textContent = 'Last refresh: ' + new Date().toLocaleTimeString();
            
        } catch (error) {
            console.error('Failed to load submissions:', error);
            this.showError('Failed to load submissions: ' + error.message);
        }
    }

    // Update statistics
    updateStats() {
        const today = new Date().toDateString();
        const pending = this.allSubmissions.filter(s => s.status === 'pending').length;
        const approvedToday = this.allSubmissions.filter(s => s.status === 'approved' && new Date(s.updated_at || s.submitted_at).toDateString() === today).length;
        const rejectedToday = this.allSubmissions.filter(s => s.status === 'rejected' && new Date(s.updated_at || s.submitted_at).toDateString() === today).length;
        
        document.getElementById('pendingCount').textContent = pending;
        document.getElementById('approvedCount').textContent = approvedToday;
        document.getElementById('rejectedCount').textContent = rejectedToday;
        document.getElementById('totalCount').textContent = this.allSubmissions.length;
    }

    // Filter submissions
    filterSubmissions(filter) {
        this.currentFilter = filter;
        
        // Update tab styles
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.displaySubmissions();
    }

    // Display submissions
    displaySubmissions() {
        const container = document.getElementById('submissionsList');
        
        let filtered = this.allSubmissions;
        if (this.currentFilter !== 'all') {
            filtered = this.allSubmissions.filter(s => s.status === this.currentFilter);
        }
        
        if (filtered.length === 0) {
            container.innerHTML = '<p style="color: white; text-align: center;">No submissions found for this filter.</p>';
            return;
        }
        
        // Sort by submission date (newest first)
        filtered.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
        
        container.innerHTML = filtered.map(submission => {
            const character = submission.character;
            return `
                <div class="submission-card" data-id="${submission.id}">
                    <div class="submission-header">
                        <div>
                            <div class="submission-title">${character.name || 'Unnamed Character'}</div>
                            <div style="color: #ccc; font-size: 0.9rem;">
                                ${character.playbook || 'Unknown Playbook'} • ${character.classification || 'Unknown Classification'} • 
                                Submitted: ${new Date(submission.submitted_at).toLocaleString()}
                            </div>
                        </div>
                        <span class="submission-status status-${submission.status}">${submission.status.toUpperCase().replace('_', ' ')}</span>
                    </div>
                    
                    <div class="character-preview">${this.formatCharacterSheet(character)}</div>
                    
                    ${submission.status === 'pending' ? `
                        <div class="feedback-section">
                            <h4>Moderator Feedback (optional):</h4>
                            <textarea id="feedback-${submission.id}" placeholder="Enter feedback for the player..."></textarea>
                        </div>
                        <div class="moderator-actions">
                            <button class="btn btn-primary" onclick="moderatorPanel.approveSubmission('${submission.id}')">✅ Approve</button>
                            <button class="btn btn-outline" onclick="moderatorPanel.requestChanges('${submission.id}')">📝 Request Changes</button>
                            <button class="btn btn-secondary" onclick="moderatorPanel.rejectSubmission('${submission.id}')">❌ Reject</button>
                        </div>
                    ` : submission.feedback ? `
                        <div class="feedback-section">
                            <h4>Moderator Feedback:</h4>
                            <div style="color: white; white-space: pre-wrap;">${submission.feedback}</div>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    // Format character sheet for display
    formatCharacterSheet(character) {
        let sheet = `# ${character.name || 'Unnamed Character'}`;
        
        if (character.apparentAge) sheet += `\n**Apparent Age:** ${character.apparentAge}`;
        if (character.actualAge) sheet += `\n**Actual Age:** ${character.actualAge}`;
        if (character.classification) sheet += `\n**Classification:** ${character.classification}`;
        if (character.playbook) sheet += `\n**Playbook:** ${character.playbook}`;
        if (character.subtype) sheet += `\n**Subtype:** ${character.subtype}`;
        
        if (character.bio) {
            sheet += `\n\n## Character Bio\n${character.bio}`;
        }
        
        if (character.skills && character.skills.length > 0) {
            sheet += `\n\n## Skills`;
            character.skills.forEach(skill => {
                sheet += `\n+${skill.level} ${skill.name}`;
            });
        }
        
        if (character.moves && character.moves.length > 0) {
            sheet += `\n\n## Moves`;
            character.moves.forEach(move => {
                sheet += `\n**${move.name}** (${move.source})\n${move.description}`;
            });
        }
        
        return sheet;
    }

    // Approve submission
    async approveSubmission(submissionId) {
        const feedback = document.getElementById(`feedback-${submissionId}`).value;
        
        try {
            const result = await this.submissionSystem.updateSubmission(submissionId, 'approved', feedback);
            
            if (result.success) {
                alert('Character approved and added to the character list!');
                this.loadSubmissions(); // Refresh the list
            } else {
                alert('Failed to approve submission. Please try again.');
            }
        } catch (error) {
            console.error('Approval error:', error);
            alert('Error approving submission. Please try again.');
        }
    }

    // Request changes
    async requestChanges(submissionId) {
        const feedback = document.getElementById(`feedback-${submissionId}`).value;
        
        if (!feedback.trim()) {
            alert('Please provide feedback explaining what changes are needed.');
            return;
        }
        
        try {
            const result = await this.submissionSystem.updateSubmission(submissionId, 'changes_requested', feedback);
            
            if (result.success) {
                alert('Change request sent to player with your feedback!');
                this.loadSubmissions(); // Refresh the list
            } else {
                alert('Failed to send change request. Please try again.');
            }
        } catch (error) {
            console.error('Change request error:', error);
            alert('Error sending change request. Please try again.');
        }
    }

    // Reject submission
    async rejectSubmission(submissionId) {
        const feedback = document.getElementById(`feedback-${submissionId}`).value;
        
        if (!feedback.trim()) {
            alert('Please provide feedback explaining why the character is rejected.');
            return;
        }
        
        if (!confirm('Are you sure you want to reject this character?')) {
            return;
        }
        
        try {
            const result = await this.submissionSystem.updateSubmission(submissionId, 'rejected', feedback);
            
            if (result.success) {
                alert('Character rejected with feedback sent to player.');
                this.loadSubmissions(); // Refresh the list
            } else {
                alert('Failed to reject submission. Please try again.');
            }
        } catch (error) {
            console.error('Rejection error:', error);
            alert('Error rejecting submission. Please try again.');
        }
    }

    // Show error message
    showError(message) {
        const container = document.getElementById('submissionsList');
        container.innerHTML = `<p style="color: #f44336; text-align: center;">${message}</p>`;
    }
}

// Initialize moderator panel when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.moderatorPanel = new ModeratorPanel();
});
