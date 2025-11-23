// Character submission system for GitHub Pages (static hosting)
class CharacterSubmission {
    constructor() {
        this.discordWebhook = 'https://discordapp.com/api/webhooks/1442233189795106896/iIyJHwZ-V02DiX08e_3i8vYLpCUX-F2SXUzNRpmp2hJrDEOiIXzL-w6y5wE9Gh1O4G38';
        this.storageKey = 'darkCitySubmissions';
    }

    // Submit character for review
    async submitCharacter(characterData) {
        try {
            console.log('CharacterSubmission: Starting submission for', characterData.name);
            
            // Create submission record
            const submission = {
                id: this.generateId(),
                character: characterData,
                status: 'pending',
                submitted_at: new Date().toISOString(),
                submitted_by: this.getClientId()
            };
            
            console.log('CharacterSubmission: Created submission', submission);

            // Save to localStorage (fallback for GitHub Pages)
            this.saveSubmission(submission);
            
            console.log('CharacterSubmission: Saved to localStorage');

            // Send Discord notification
            await this.sendDiscordNotification(submission, 'new_submission');
            
            console.log('CharacterSubmission: Discord notification sent');

            return {
                success: true,
                submission: submission
            };

        } catch (error) {
            console.error('CharacterSubmission: Submission error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Update submission status
    async updateSubmission(submissionId, status, feedback = '') {
        try {
            const submissions = this.getSubmissions();
            const submission = submissions[submissionId];
            
            if (!submission) {
                throw new Error('Submission not found');
            }

            submission.status = status;
            submission.feedback = feedback;
            submission.updated_at = new Date().toISOString();

            // Save updated submission
            submissions[submissionId] = submission;
            localStorage.setItem(this.storageKey, JSON.stringify(submissions));

            // Send Discord notification
            await this.sendDiscordNotification(submission, 'status_update');

            return {
                success: true,
                submission: submission
            };

        } catch (error) {
            console.error('Update error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get all submissions (with fallback to backup)
    getSubmissions() {
        let stored = localStorage.getItem(this.storageKey);
        
        // Try backup key if primary is empty
        if (!stored) {
            stored = localStorage.getItem('darkCitySubmissions_backup');
        }
        
        // Try both keys and merge
        const primary = stored ? JSON.parse(stored) : {};
        const backup = localStorage.getItem('darkCitySubmissions_backup');
        const backupData = backup ? JSON.parse(backup) : {};
        
        // Merge both sources
        const merged = { ...backupData, ...primary };
        
        // Update storage with merged data
        localStorage.setItem(this.storageKey, JSON.stringify(merged));
        localStorage.setItem('darkCitySubmissions_backup', JSON.stringify(merged));
        
        return merged;
    }

    // Get pending submissions
    getPendingSubmissions() {
        const submissions = this.getSubmissions();
        return Object.values(submissions).filter(s => s.status === 'pending');
    }

    // Get approved submissions
    getApprovedSubmissions() {
        const submissions = this.getSubmissions();
        return Object.values(submissions).filter(s => s.status === 'approved');
    }

    // Save submission to localStorage with cross-page sharing
    saveSubmission(submission) {
        console.log('CharacterSubmission: Saving submission', submission.id);
        
        const submissions = this.getSubmissions();
        submissions[submission.id] = submission;
        
        const dataString = JSON.stringify(submissions);
        console.log('CharacterSubmission: Data to save:', dataString);
        
        localStorage.setItem(this.storageKey, dataString);
        
        // Also save to a backup key for cross-page access
        const backupKey = 'darkCitySubmissions_backup';
        localStorage.setItem(backupKey, dataString);
        
        console.log('CharacterSubmission: Saved to both localStorage keys');
        
        // Verify it was saved
        const verify = localStorage.getItem(this.storageKey);
        console.log('CharacterSubmission: Verification - stored data length:', verify ? verify.length : 'null');
        
        // Dispatch custom event to notify other pages
        window.dispatchEvent(new CustomEvent('characterSubmission', {
            detail: { action: 'saved', submission: submission }
        }));
        
        console.log('CharacterSubmission: Dispatched custom event');
        
        // NEW: Create shareable URL for cross-page sync
        this.createShareableUrl(submission);
    }

    // Create shareable URL for moderator panel
    createShareableUrl(submission) {
        try {
            console.log('CharacterSubmission: Creating shareable URL for cross-page sync...');
            
            // Store the latest submission in sessionStorage with timestamp
            sessionStorage.setItem('latestSubmission', JSON.stringify(submission));
            sessionStorage.setItem('latestSubmissionTimestamp', Date.now().toString());
            
            // Create a URL with the submission data as a parameter
            const submissionData = btoa(JSON.stringify(submission)).substring(0, 800); // Limit URL length
            const shareUrl = `${window.location.origin}/moderator/?submission=${submissionData}`;
            
            console.log('CharacterSubmission: Shareable URL created:', shareUrl);
            
            // Also try to create a simple notification system
            this.createCrossPageNotification(submission);
            
        } catch (error) {
            console.log('CharacterSubmission: Could not create shareable URL:', error);
        }
    }

    // Create cross-page notification system
    createCrossPageNotification(submission) {
        try {
            // Store in multiple locations for redundancy
            const storageKey = 'crossPageSubmission';
            const data = {
                submission: submission,
                timestamp: Date.now(),
                source: 'character-builder'
            };
            
            // Try different storage methods
            localStorage.setItem(storageKey, JSON.stringify(data));
            sessionStorage.setItem(storageKey, JSON.stringify(data));
            
            // Create a global event that other pages can listen for
            window.parent.postMessage({
                type: 'characterSubmission',
                action: 'newSubmission',
                data: data
            }, '*');
            
            console.log('CharacterSubmission: Cross-page notification created');
            
        } catch (error) {
            console.log('CharacterSubmission: Cross-page notification failed:', error);
        }
    }

    // Check for sessionStorage imports
    checkSessionStorageImports() {
        try {
            const pending = sessionStorage.getItem('pendingSubmission');
            const timestamp = sessionStorage.getItem('pendingSubmissionTimestamp');
            
            if (pending && timestamp) {
                const age = Date.now() - parseInt(timestamp);
                
                // Only import if less than 5 minutes old
                if (age < 300000) {
                    const submission = JSON.parse(pending);
                    console.log('CharacterSubmission: Found pending submission in sessionStorage:', submission);
                    
                    // Import to localStorage
                    this.saveSubmission(submission);
                    
                    // Clear sessionStorage
                    sessionStorage.removeItem('pendingSubmission');
                    sessionStorage.removeItem('pendingSubmissionTimestamp');
                    
                    return true;
                } else {
                    // Clear old data
                    sessionStorage.removeItem('pendingSubmission');
                    sessionStorage.removeItem('pendingSubmissionTimestamp');
                }
            }
        } catch (error) {
            console.log('CharacterSubmission: Error checking sessionStorage imports:', error);
        }
        
        return false;
    }

    // Generate unique submission ID
    generateId() {
        return 'char_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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

    // Send Discord notification
    async sendDiscordNotification(submission, type) {
        const character = submission.character;
        
        let message;
        let color;
        
        switch (type) {
            case 'new_submission':
                message = {
                    content: `🎮 **New Character Submission**\n\n**Character:** ${character.name}\n**Playbook:** ${character.playbook}\n**Status:** Pending Review\n\nA moderator will review this submission shortly. You'll be notified when it's approved or if changes are needed.\n\n**Submission ID:** ${submission.id}`,
                    embeds: [{
                        title: 'Character: ' + character.name,
                        description: (character.bio || 'No bio provided').substring(0, 500),
                        fields: [
                            { name: 'Classification', value: character.classification || 'Unknown', inline: true },
                            { name: 'Playbook', value: character.playbook || 'Unknown', inline: true },
                            { name: 'Submission ID', value: submission.id, inline: true }
                        ],
                        color: 16711680 // Red for pending
                    }]
                };
                break;
                
            case 'status_update':
                if (submission.status === 'approved') {
                    message = {
                        content: `✅ **Character Approved!**\n\n**Character:** ${character.name}\n**Playbook:** ${character.playbook}\n**Status:** APPROVED\n\nYour character has been approved and will appear in the character list!\n\n**Submission ID:** ${submission.id}`,
                        embeds: [{
                            title: 'Character Approved: ' + character.name,
                            description: 'Your character is now ready for play!',
                            fields: [
                                { name: 'Classification', value: character.classification || 'Unknown', inline: true },
                                { name: 'Playbook', value: character.playbook || 'Unknown', inline: true },
                                { name: 'Approved At', value: new Date(submission.updated_at).toLocaleString(), inline: true }
                            ],
                            color: 6732650 // Green for approved
                        }]
                    };
                } else if (submission.status === 'changes_requested') {
                    message = {
                        content: `📝 **Changes Requested**\n\n**Character:** ${character.name}\n**Playbook:** ${character.playbook}\n**Status:** CHANGES REQUESTED\n\nPlease review the moderator feedback and update your character.\n\n**Submission ID:** ${submission.id}`,
                        embeds: [{
                            title: 'Changes Requested: ' + character.name,
                            description: 'Moderator Feedback:\n' + (submission.feedback || 'No feedback provided'),
                            fields: [
                                { name: 'Classification', value: character.classification || 'Unknown', inline: true },
                                { name: 'Playbook', value: character.playbook || 'Unknown', inline: true },
                                { name: 'Requested At', value: new Date(submission.updated_at).toLocaleString(), inline: true }
                            ],
                            color: 16755200 // Orange for changes requested
                        }]
                    };
                } else if (submission.status === 'rejected') {
                    message = {
                        content: `❌ **Character Rejected**\n\n**Character:** ${character.name}\n**Playbook:** ${character.playbook}\n**Status:** REJECTED\n\nPlease review the moderator feedback and create a new character.\n\n**Submission ID:** ${submission.id}`,
                        embeds: [{
                            title: 'Character Rejected: ' + character.name,
                            description: 'Moderator Feedback:\n' + (submission.feedback || 'No feedback provided'),
                            fields: [
                                { name: 'Classification', value: character.classification || 'Unknown', inline: true },
                                { name: 'Playbook', value: character.playbook || 'Unknown', inline: true },
                                { name: 'Rejected At', value: new Date(submission.updated_at).toLocaleString(), inline: true }
                            ],
                            color: 16711680 // Red for rejected
                        }]
                    };
                }
                break;
        }

        if (!message) return;

        try {
            const response = await fetch(this.discordWebhook, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message)
            });

            if (!response.ok) {
                throw new Error(`Discord webhook failed: ${response.status}`);
            }

            return { success: true };

        } catch (error) {
            console.error('Discord notification error:', error);
            // Don't throw - Discord failure shouldn't break submission
            return { success: false, error: error.message };
        }
    }

    // Export submissions for backup
    exportSubmissions() {
        const submissions = this.getSubmissions();
        const dataStr = JSON.stringify(submissions, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `dark_city_submissions_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Import submissions from backup
    importSubmissions(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const submissions = JSON.parse(e.target.result);
                    localStorage.setItem(this.storageKey, JSON.stringify(submissions));
                    resolve({ success: true, count: Object.keys(submissions).length });
                } catch (error) {
                    reject(new Error('Invalid backup file format'));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }
}

// Export for use in other files
window.CharacterSubmission = CharacterSubmission;
