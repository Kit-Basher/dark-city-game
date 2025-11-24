// Character submission system for GitHub Pages (static hosting)
class CharacterSubmission {
    constructor() {
        this.discordWebhook = 'https://discordapp.com/api/webhooks/1442233189795106896/iIyJHwZ-V02DiX08e_3i8vYLpCUX-F2SXUzNRpmp2hJrDEOiIXzL-w6y5wE9Gh1O4G38';
        this.storageKey = 'darkCitySubmissions';
    }

    // Submit character using server API
    async submitCharacter(characterData) {
        console.log('CharacterSubmission: Starting submission for', characterData.name);
        
        try {
            // Submit to server
            const result = await window.serverAPI.submitCharacter(characterData);
            
            console.log('CharacterSubmission: Server submission successful:', result);
            
            // Show success message
            this.showSuccessMessage();
            
            // Send Discord notification (server handles this automatically)
            console.log('CharacterSubmission: Discord notification handled by server');
            
            return { success: true, submission: result };
            
        } catch (error) {
            console.error('CharacterSubmission: Server submission failed:', error);
            
            // Fallback to localStorage if server is down
            console.log('CharacterSubmission: Falling back to localStorage');
            return this.submitCharacterLocalStorage(characterData);
        }
    }

    // Fallback localStorage submission
    async submitCharacterLocalStorage(characterData) {
        const submission = {
            id: this.generateId(),
            character: characterData,
            status: 'pending',
            submitted_at: new Date().toISOString(),
            submitted_by: this.getClientId()
        };
        
        console.log('CharacterSubmission: Created submission', submission);
        
        // Save to localStorage
        this.saveSubmission(submission);
        
        // Send Discord notification
        await this.sendDiscordNotification(submission);
        
        console.log('CharacterSubmission: Saved to localStorage');
        
        return { success: true, submission };
    }

    // Show success message
    showSuccessMessage() {
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: #4CAF50; color: white; padding: 2rem; border-radius: 10px;
            z-index: 10000; font-size: 1.2rem; text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        successDiv.innerHTML = `
            <h2>✅ Character Submitted Successfully!</h2>
            <p>Your character has been sent to the moderator for review.</p>
            <p style="font-size: 0.9rem; opacity: 0.8;">You will be notified when it's approved.</p>
            <button onclick="this.parentElement.remove(); window.location.reload();" style="
                background: white; color: #4CAF50; border: none; 
                padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer;
                margin-top: 1rem;
            ">Close</button>
        `;
        document.body.appendChild(successDiv);
        
        // Clear form
        document.getElementById('characterForm').reset();
        document.getElementById('preview').innerHTML = '';
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
            
            // Create a URL with the submission data as a parameter
            const submissionData = btoa(JSON.stringify(submission)).substring(0, 800); // Limit URL length
            const shareUrl = `${window.location.origin}/moderator/?submission=${submissionData}`;
            
            console.log('CharacterSubmission: Shareable URL created:', shareUrl);
            
            // Store backup in case redirect fails
            sessionStorage.setItem('latestSubmission', JSON.stringify(submission));
            sessionStorage.setItem('latestSubmissionTimestamp', Date.now().toString());
            
            // Auto-redirect to moderator panel with the data
            console.log('CharacterSubmission: Redirecting to moderator panel with submission data...');
            
            // Show brief success message before redirect
            const successDiv = document.createElement('div');
            successDiv.style.cssText = `
                position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                background: #4CAF50; color: white; padding: 2rem; border-radius: 10px;
                z-index: 10000; font-size: 1.2rem; text-align: center;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            `;
            successDiv.innerHTML = `
                <h2>✅ Character Submitted Successfully!</h2>
                <p>Redirecting to moderator panel for review...</p>
                <p style="font-size: 0.9rem; opacity: 0.8;">This happens automatically for all submissions</p>
            `;
            document.body.appendChild(successDiv);
            
            // Redirect after 2 seconds
            setTimeout(() => {
                window.location.href = shareUrl;
            }, 2000);
            
        } catch (error) {
            console.log('CharacterSubmission: Could not create shareable URL:', error);
            
            // Fallback: Show manual instructions
            this.showManualInstructions(submission);
        }
    }

    // Show manual instructions if auto-redirect fails
    showManualInstructions(submission) {
        const instructionsDiv = document.createElement('div');
        instructionsDiv.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: #ff9800; color: white; padding: 2rem; border-radius: 10px;
            z-index: 10000; font-size: 1.1rem; text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3); max-width: 500px;
        `;
        instructionsDiv.innerHTML = `
            <h2>⚠️ Auto-Redirect Failed</h2>
            <p>Your character was submitted successfully!</p>
            <p><strong>Please manually go to the moderator panel:</strong></p>
            <p><a href="/moderator/" style="color: white; text-decoration: underline;">Open Moderator Panel</a></p>
            <p style="font-size: 0.9rem; opacity: 0.8;">The moderator will review your submission shortly.</p>
            <button onclick="this.parentElement.remove()" style="
                background: white; color: #ff9800; border: none; 
                padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer;
                margin-top: 1rem;
            ">Close</button>
        `;
        document.body.appendChild(instructionsDiv);
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
