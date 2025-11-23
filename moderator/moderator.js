// Moderator Panel - JavaScript-based system for GitHub Pages
class ModeratorPanel {
    constructor() {
        this.submissionSystem = new CharacterSubmission();
        this.currentFilter = 'pending';
        this.init();
    }

    init() {
        // Check for URL parameters first
        this.checkUrlParameters();
        
        // Check for cross-page notifications
        this.checkCrossPageNotifications();
        
        // Check for sessionStorage imports
        const hasImported = this.submissionSystem.checkSessionStorageImports();
        if (hasImported) {
            console.log('🔄 Imported pending submission from sessionStorage');
        }
        
        this.loadSubmissions();
        this.setupEventListeners();
        this.setupStorageListener();
        this.setupAutoRefresh();
        this.setupMessageListener();
        this.setupPostMessageListener();
    }

    // Check URL parameters for submission data
    checkUrlParameters() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const submissionData = urlParams.get('submission');
            
            if (submissionData) {
                console.log('🔍 Found submission in URL parameters');
                
                try {
                    const submission = JSON.parse(atob(submissionData));
                    console.log('📥 Imported submission from URL:', submission);
                    
                    // Save to localStorage
                    this.submissionSystem.saveSubmission(submission);
                    
                    // Clear URL parameters
                    window.history.replaceState({}, document.title, window.location.pathname);
                    
                    // Show success message
                    alert('✅ Character submission imported from URL!');
                    
                    return true;
                } catch (error) {
                    console.error('❌ Failed to parse URL submission data:', error);
                }
            }
        } catch (error) {
            console.error('❌ Error checking URL parameters:', error);
        }
        
        return false;
    }

    // Check for cross-page notifications
    checkCrossPageNotifications() {
        try {
            const storageKey = 'crossPageSubmission';
            
            // Check localStorage
            const localData = localStorage.getItem(storageKey);
            if (localData) {
                const data = JSON.parse(localData);
                const age = Date.now() - data.timestamp;
                
                if (age < 300000) { // 5 minutes
                    console.log('📥 Found cross-page notification in localStorage:', data);
                    this.submissionSystem.saveSubmission(data.submission);
                    localStorage.removeItem(storageKey);
                    return true;
                }
            }
            
            // Check sessionStorage
            const sessionData = sessionStorage.getItem(storageKey);
            if (sessionData) {
                const data = JSON.parse(sessionData);
                const age = Date.now() - data.timestamp;
                
                if (age < 300000) { // 5 minutes
                    console.log('📥 Found cross-page notification in sessionStorage:', data);
                    this.submissionSystem.saveSubmission(data.submission);
                    sessionStorage.removeItem(storageKey);
                    return true;
                }
            }
        } catch (error) {
            console.error('❌ Error checking cross-page notifications:', error);
        }
        
        return false;
    }

    // Setup postMessage listener
    setupPostMessageListener() {
        window.addEventListener('message', (event) => {
            if (event.data.type === 'characterSubmission' && event.data.action === 'newSubmission') {
                console.log('📨 Received postMessage notification:', event.data);
                
                const submission = event.data.data.submission;
                this.submissionSystem.saveSubmission(submission);
                
                // Refresh the display
                this.loadSubmissions();
                
                // Show notification
                this.showNotification('📥 New character submission received!');
            }
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

    setupMessageListener() {
        // Listen for messages from test script
        window.addEventListener('message', (event) => {
            if (event.data.action === 'checkSubmissions') {
                console.log('📨 Received test results from character builder:', event.data.testResults);
                
                // Load submissions and check for test data
                this.loadSubmissions();
                
                // Report back to character builder
                const submissions = this.submissionSystem.getSubmissions();
                const testSubmissions = Object.values(submissions).filter(s => 
                    s.character.name && s.character.name.includes('Test Character') ||
                    s.character.name && s.character.name.includes('Auto Bot') ||
                    s.character.name && s.character.name.includes('Debug Hero')
                );
                
                console.log(`🔍 Moderator panel found ${testSubmissions.length} test submissions`);
                
                if (event.source) {
                    event.source.postMessage({
                        action: 'moderatorPanelStatus',
                        foundSubmissions: testSubmissions.length,
                        totalSubmissions: Object.keys(submissions).length,
                        pendingCount: Object.values(submissions).filter(s => s.status === 'pending').length
                    }, '*');
                }
            }
        });
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
            console.log('Available localStorage keys:', Object.keys(localStorage));
            
            const submissions = this.submissionSystem.getSubmissions();
            console.log('Raw submissions object:', submissions);
            console.log('Submission keys:', Object.keys(submissions));
            
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
