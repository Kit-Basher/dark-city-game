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
            console.log(' New submission received:', submission.name);
            this.showNotification(` New submission: ${submission.name}`);
            this.loadSubmissions(); // Refresh the list
        });

        // Listen for character approvals
        this.serverAPI.onCharacterApproved((character) => {
            console.log(' Character approved:', character.name);
            this.showNotification(` Approved: ${character.name}`);
            this.loadSubmissions(); // Refresh the list
        });

        // Listen for character rejections
        this.serverAPI.onCharacterRejected((character) => {
            console.log(' Character rejected:', character.name);
            this.showNotification(` Rejected: ${character.name}`);
            this.loadSubmissions(); // Refresh the list
        });

        // Listen for character deletions
        this.serverAPI.onCharacterDeleted((character) => {
            console.log(' Character deleted:', character.name);
            this.showNotification(` Deleted: ${character.name}`);
            this.loadSubmissions(); // Refresh the list
        });
    }

    // Load submissions from server
    async loadSubmissions() {
        console.log('Loading submissions from server...');
        
        try {
            this.allSubmissions = await this.serverAPI.getAllSubmissions();
            console.log(`Loaded ${this.allSubmissions.length} submissions from server`);
            
            this.updateStatistics();
            this.renderSubmissions();
            this.updateLastRefresh();
        } catch (error) {
            console.error('Error loading submissions:', error);
            this.showError('Failed to load submissions from server');
        }
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

    setupEventListeners() {
        // Filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.filterSubmissions(e.target.dataset.filter);
            });
        });
    }

            this.allSubmissions = Object.values(submissions);
            console.log('Submission array:', this.allSubmissions);
            console.log('Pending submissions:', this.allSubmissions.filter(s => s.status === 'pending'));
            console.log('Approved submissions:', this.allSubmissions.filter(s => s.status === 'approved'));
            
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

    // Manual sessionStorage check
    checkSessionStorage() {
        console.log('🔍 Manually checking sessionStorage...');
        
        try {
            const pending = sessionStorage.getItem('pendingSubmission');
            const timestamp = sessionStorage.getItem('pendingSubmissionTimestamp');
            
            console.log('SessionStorage data:', {
                pending: pending ? 'EXISTS' : 'EMPTY',
                timestamp: timestamp ? new Date(parseInt(timestamp)).toLocaleString() : 'NONE',
                age: timestamp ? Date.now() - parseInt(timestamp) : 'N/A'
            });
            
            if (pending && timestamp) {
                const age = Date.now() - parseInt(timestamp);
                console.log(`SessionStorage age: ${age}ms (${Math.round(age/1000)}s)`);
                
                if (age < 300000) { // 5 minutes
                    const submission = JSON.parse(pending);
                    console.log('🎯 Found pending submission in sessionStorage:', submission);
                    
                    // Import to localStorage
                    this.submissionSystem.saveSubmission(submission);
                    
                    // Clear sessionStorage
                    sessionStorage.removeItem('pendingSubmission');
                    sessionStorage.removeItem('pendingSubmissionTimestamp');
                    
                    // Refresh the display
                    this.loadSubmissions();
                    
                    alert('✅ Successfully imported pending submission from sessionStorage!');
                } else {
                    console.log('❌ SessionStorage data too old, clearing...');
                    sessionStorage.removeItem('pendingSubmission');
                    sessionStorage.removeItem('pendingSubmissionTimestamp');
                    alert('❌ SessionStorage data was too old and has been cleared.');
                }
            } else {
                console.log('❌ No pending submission found in sessionStorage');
                alert('❌ No pending submission found in sessionStorage');
            }
        } catch (error) {
            console.error('Error checking sessionStorage:', error);
            alert('❌ Error checking sessionStorage: ' + error.message);
        }
    }

    // Show data import dialog
    showDataImport() {
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
            background: rgba(0,0,0,0.8); display: flex; align-items: center; 
            justify-content: center; z-index: 1000;
        `;
        
        dialog.innerHTML = `
            <div style="background: #2a2a2a; border: 2px solid #ff6b35; border-radius: 10px; padding: 2rem; max-width: 600px; width: 90%;">
                <h3 style="color: #ff6b35; margin-bottom: 1rem;">📥 Import Character Data</h3>
                <p style="color: white; margin-bottom: 1rem;">
                    If the moderator panel isn't showing new submissions, you can manually import the data.
                </p>
                <div style="margin-bottom: 1rem;">
                    <label style="color: white; display: block; margin-bottom: 0.5rem;">Paste submission data:</label>
                    <textarea id="importData" style="width: 100%; height: 200px; background: #1a1a1a; color: white; border: 1px solid #4a5568; border-radius: 5px; padding: 0.5rem;" placeholder="Paste the JSON data from localStorage..."></textarea>
                </div>
                <div style="margin-bottom: 1rem;">
                    <button onclick="moderatorPanel.importFromClipboard()" style="background: #ff6b35; color: white; border: none; padding: 0.5rem 1rem; border-radius: 5px; margin-right: 0.5rem;">📋 Import from Clipboard</button>
                    <button onclick="moderatorPanel.exportCurrentData()" style="background: #4a5568; color: white; border: none; padding: 0.5rem 1rem; border-radius: 5px; margin-right: 0.5rem;">💾 Export Current</button>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: #666; color: white; border: none; padding: 0.5rem 1rem; border-radius: 5px;">Cancel</button>
                </div>
                <div style="font-size: 0.8rem; color: #ccc;">
                    <strong>Instructions:</strong><br>
                    1. Go to character builder page<br>
                    2. Open F12 → Application → Local Storage<br>
                    3. Copy the value of 'darkCitySubmissions' key<br>
                    4. Paste it here and click Import
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
    }

    // Import data from clipboard
    importFromClipboard() {
        const textarea = document.getElementById('importData');
        const data = textarea.value.trim();
        
        if (!data) {
            alert('Please paste data first');
            return;
        }
        
        try {
            const submissions = JSON.parse(data);
            
            // Save to localStorage
            localStorage.setItem('darkCitySubmissions', JSON.stringify(submissions));
            localStorage.setItem('darkCitySubmissions_backup', JSON.stringify(submissions));
            
            alert('Data imported successfully! Refreshing submissions...');
            
            // Close dialog and refresh
            document.getElementById('importData').closest('div[style*="position: fixed"]').remove();
            this.loadSubmissions();
            
        } catch (error) {
            alert('Invalid JSON data: ' + error.message);
        }
    }

    // Export current data
    exportCurrentData() {
        const submissions = this.submissionSystem.getSubmissions();
        const dataStr = JSON.stringify(submissions, null, 2);
        
        const textarea = document.getElementById('importData');
        textarea.value = dataStr;
        
        alert('Current data exported to textarea. You can copy this and save it as backup.');
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
