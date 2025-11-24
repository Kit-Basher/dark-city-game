// Simple Server-Only Character Submission
// No localStorage, no redirects, no fallbacks - just server API

class SimpleCharacterSubmission {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
    }

    // Submit character directly to server
    async submitCharacter(characterData) {
        console.log('🚀 Submitting character to server...');
        
        try {
            const response = await fetch(`${this.baseURL}/characters/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(characterData)
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Character submitted successfully:', result);
            
            this.showSuccessMessage();
            return { success: true, submission: result };
            
        } catch (error) {
            console.error('❌ Submission failed:', error);
            this.showErrorMessage(error.message);
            return { success: false, error: error.message };
        }
    }

    // Show success message - NO REDIRECT
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
            <button onclick="this.parentElement.remove();" style="
                background: white; color: #4CAF50; border: none; 
                padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer;
                margin-top: 1rem;
            ">Close</button>
        `;
        document.body.appendChild(successDiv);
        
        // Clear form after a delay
        setTimeout(() => {
            const form = document.getElementById('characterForm');
            if (form) {
                form.reset();
                const preview = document.getElementById('preview');
                if (preview) {
                    preview.innerHTML = '';
                }
            }
        }, 2000);
    }

    // Show error message
    showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: #f44336; color: white; padding: 2rem; border-radius: 10px;
            z-index: 10000; font-size: 1.2rem; text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        errorDiv.innerHTML = `
            <h2>❌ Submission Failed</h2>
            <p>${message}</p>
            <p style="font-size: 0.9rem; opacity: 0.8;">Please try again or contact support.</p>
            <button onclick="this.parentElement.remove();" style="
                background: white; color: #f44336; border: none; 
                padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer;
                margin-top: 1rem;
            ">Close</button>
        `;
        document.body.appendChild(errorDiv);
    }
}

// Create global instance
window.simpleSubmission = new SimpleCharacterSubmission();

// Replace the old submit function
window.submitCharacterSimple = async function(characterData) {
    console.log('🎯 Using simple server-only submission...');
    return await window.simpleSubmission.submitCharacter(characterData);
};

console.log('📦 Simple Character Submission loaded - NO REDIRECTS, NO LOCALSTORAGE');
