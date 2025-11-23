// Automated Character Submission Test Script
// Run this in the browser console on the character builder page

class SubmissionTester {
    constructor() {
        this.testCount = 0;
        this.successCount = 0;
        this.errorCount = 0;
        this.testResults = [];
    }

    // Generate random character data
    generateCharacterData() {
        const names = ['Test Character', 'Auto Bot', 'Debug Hero', 'Script Test', 'Random Name'];
        const playbooks = ['Ageless', 'Wild', 'Mage', 'Mortal', 'Unsated', 'Fae'];
        const classifications = ['Human', 'Vampire', 'Werewolf', 'Wizard', 'Fairy', 'Ghost'];
        
        return {
            name: names[Math.floor(Math.random() * names.length)] + ' ' + Date.now(),
            apparentAge: Math.floor(Math.random() * 50) + 18,
            actualAge: Math.floor(Math.random() * 1000) + 100,
            classification: classifications[Math.floor(Math.random() * classifications.length)],
            playbook: playbooks[Math.floor(Math.random() * playbooks.length)],
            subtype: 'Test Subtype',
            bio: 'This is an automated test character created for debugging purposes. ' +
                 'Generated at ' + new Date().toISOString() + '. ' +
                 'This character is being used to test the submission workflow.',
            skills: [
                { name: 'Test Skill 1', level: 3 },
                { name: 'Test Skill 2', level: 2 },
                { name: 'Test Skill 3', level: 1 }
            ],
            moves: [
                { name: 'Test Move', source: 'Test', description: 'This is a test move for debugging' }
            ],
            darkestSelf: 'Test darkest self description for debugging purposes.'
        };
    }

    // Fill out the character form
    fillForm(characterData) {
        console.log('🔄 Filling form with character data...');
        
        // Fill basic fields
        document.getElementById('name').value = characterData.name;
        document.getElementById('apparentAge').value = characterData.apparentAge;
        document.getElementById('actualAge').value = characterData.actualAge;
        document.getElementById('classification').value = characterData.classification;
        document.getElementById('playbook').value = characterData.playbook;
        document.getElementById('subtype').value = characterData.subtype;
        document.getElementById('bio').value = characterData.bio;
        document.getElementById('darkestSelf').value = characterData.darkestSelf;

        // Fill skills
        const skillInputs = document.querySelectorAll('.skill-name');
        const levelInputs = document.querySelectorAll('.skill-level');
        
        characterData.skills.forEach((skill, index) => {
            if (skillInputs[index] && levelInputs[index]) {
                skillInputs[index].value = skill.name;
                levelInputs[index].value = skill.level;
            }
        });

        console.log('✅ Form filled successfully');
    }

    // Submit character and monitor results
    async submitCharacter(characterData) {
        console.log('🚀 Starting character submission test...');
        
        this.testCount++;
        const testId = `TEST_${this.testCount}_${Date.now()}`;
        
        try {
            // Fill the form
            this.fillForm(characterData);
            
            // Update preview first
            if (typeof updatePreview === 'function') {
                updatePreview();
                console.log('📝 Preview updated');
            }
            
            // Initialize submission system
            const submissionSystem = new CharacterSubmission();
            
            // Submit character
            const result = await submissionSystem.submitCharacter(characterData);
            
            if (result.success) {
                this.successCount++;
                console.log('✅ Submission successful!', result);
                this.testResults.push({
                    testId: testId,
                    status: 'SUCCESS',
                    submission: result.submission,
                    timestamp: new Date().toISOString()
                });
                
                // Verify it was saved to localStorage
                const stored = localStorage.getItem('darkCitySubmissions');
                if (stored && stored.includes(result.submission.id)) {
                    console.log('✅ Verified: Character saved to localStorage');
                } else {
                    console.log('❌ Error: Character not found in localStorage');
                }
                
                return result;
            } else {
                this.errorCount++;
                console.log('❌ Submission failed:', result);
                this.testResults.push({
                    testId: testId,
                    status: 'FAILED',
                    error: result.error,
                    timestamp: new Date().toISOString()
                });
                return null;
            }
            
        } catch (error) {
            this.errorCount++;
            console.log('❌ Test error:', error);
            this.testResults.push({
                testId: testId,
                status: 'ERROR',
                error: error.message,
                timestamp: new Date().toISOString()
            });
            return null;
        }
    }

    // Check moderator panel (open in new tab)
    async checkModeratorPanel() {
        console.log('🔍 Checking moderator panel...');
        
        // Open moderator panel in new tab
        const moderatorTab = window.open('/moderator/', '_blank');
        
        // Wait a bit for the page to load
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
            // Send a message to the moderator tab to check localStorage
            moderatorTab.postMessage({
                action: 'checkSubmissions',
                testResults: this.testResults
            }, '*');
            
            console.log('📤 Sent check request to moderator panel');
        } catch (error) {
            console.log('❌ Could not communicate with moderator tab:', error);
        }
    }

    // Run automated test sequence
    async runTests(numTests = 3) {
        console.log(`🧪 Starting automated test sequence (${numTests} tests)...`);
        
        for (let i = 0; i < numTests; i++) {
            console.log(`\n--- Test ${i + 1}/${numTests} ---`);
            
            const characterData = this.generateCharacterData();
            const result = await this.submitCharacter(characterData);
            
            if (result) {
                console.log(`✅ Test ${i + 1} completed successfully`);
                console.log(`📋 Submission ID: ${result.submission.id}`);
            } else {
                console.log(`❌ Test ${i + 1} failed`);
            }
            
            // Wait between tests
            if (i < numTests - 1) {
                console.log('⏳ Waiting 2 seconds before next test...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        // Show final results
        this.showResults();
        
        // Check moderator panel
        await this.checkModeratorPanel();
    }

    // Show test results
    showResults() {
        console.log('\n🎯 TEST RESULTS:');
        console.log(`✅ Success: ${this.successCount}`);
        console.log(`❌ Failed: ${this.errorCount}`);
        console.log(`📊 Total: ${this.testCount}`);
        console.log(`📈 Success Rate: ${((this.successCount / this.testCount) * 100).toFixed(1)}%`);
        
        console.log('\n📋 Detailed Results:');
        this.testResults.forEach(result => {
            console.log(`${result.status}: ${result.testId} - ${result.error || result.submission?.id || 'No ID'}`);
        });
        
        // Check localStorage status
        const stored = localStorage.getItem('darkCitySubmissions');
        if (stored) {
            const data = JSON.parse(stored);
            console.log(`\n💾 LocalStorage Status:`);
            console.log(`📁 Total submissions: ${Object.keys(data).length}`);
            console.log(`🕐 Pending: ${Object.values(data).filter(s => s.status === 'pending').length}`);
            console.log(`✅ Approved: ${Object.values(data).filter(s => s.status === 'approved').length}`);
        } else {
            console.log('\n💾 LocalStorage: EMPTY');
        }
    }

    // Quick single test
    async quickTest() {
        console.log('⚡ Running quick test...');
        const characterData = this.generateCharacterData();
        await this.submitCharacter(characterData);
        this.showResults();
    }
}

// Create global tester instance
window.submissionTester = new SubmissionTester();

// Usage instructions
console.log(`
🧪 AUTOMATED SUBMISSION TESTER LOADED!

Usage:
- submissionTester.quickTest()           // Run 1 quick test
- submissionTester.runTests(5)            // Run 5 tests
- submissionTester.showResults()           // Show current results

The tester will:
1. Generate random character data
2. Fill out the form automatically
3. Submit the character
4. Verify localStorage
5. Check moderator panel
6. Report detailed results

Start with: submissionTester.quickTest()
`);
