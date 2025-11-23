// Character submission system for GitHub Pages (static hosting)
class CharacterSubmission {
    constructor() {
        this.discordWebhook = 'https://discordapp.com/api/webhooks/1442233189795106896/iIyJHwZ-V02DiX08e_3i8vYLpCUX-F2SXUzNRpmp2hJrDEOiIXzL-w6y5wE9Gh1O4G38';
        this.storageKey = 'darkCitySubmissions';
    }

    // Submit character for review
    async submitCharacter(characterData) {
        try {
            // Create submission record
            const submission = {
                id: this.generateId(),
                character: characterData,
                status: 'pending',
                submitted_at: new Date().toISOString(),
                submitted_by: this.getClientId()
            };

            // Save to localStorage (fallback for GitHub Pages)
            this.saveSubmission(submission);

            // Send Discord notification
            await this.sendDiscordNotification(submission, 'new_submission');

            return {
                success: true,
                submission: submission
            };

        } catch (error) {
            console.error('Submission error:', error);
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

    // Get all submissions
    getSubmissions() {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : {};
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

    // Save submission to localStorage
    saveSubmission(submission) {
        const submissions = this.getSubmissions();
        submissions[submission.id] = submission;
        localStorage.setItem(this.storageKey, JSON.stringify(submissions));
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
