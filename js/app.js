// GitHub API configuration
const GITHUB_API_BASE = 'https://api.github.com/repos';
const REPO_OWNER = 'Kit-Basher'; // Replace with your GitHub username
const REPO_NAME = 'dark-city-game';

// Calendar functionality
class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.currentMonth = this.currentDate.getMonth();
        this.currentYear = this.currentDate.getFullYear();
        this.events = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderCalendar();
        this.loadEvents();
    }

    setupEventListeners() {
        document.getElementById('prevMonth').addEventListener('click', () => this.previousMonth());
        document.getElementById('nextMonth').addEventListener('click', () => this.nextMonth());
    }

    previousMonth() {
        this.currentMonth--;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        this.renderCalendar();
    }

    nextMonth() {
        this.currentMonth++;
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        this.renderCalendar();
    }

    renderCalendar() {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
        
        document.getElementById('currentMonth').textContent = `${monthNames[this.currentMonth]} ${this.currentYear}`;
        
        const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
        const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        
        const calendarGrid = document.getElementById('calendarGrid');
        calendarGrid.innerHTML = '';
        
        // Add day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day header';
            dayHeader.textContent = day;
            calendarGrid.appendChild(dayHeader);
        });
        
        // Add empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day';
            calendarGrid.appendChild(emptyDay);
        }
        
        // Add days of the month
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            
            // Check if this is today
            if (this.currentYear === today.getFullYear() && 
                this.currentMonth === today.getMonth() && 
                day === today.getDate()) {
                dayElement.classList.add('today');
            }
            
            // Check if there are events for this day
            const dayEvents = this.getEventsForDay(day);
            if (dayEvents.length > 0) {
                dayElement.classList.add('has-events');
                const eventDot = document.createElement('div');
                eventDot.className = 'event-dot';
                dayElement.appendChild(eventDot);
                
                // Add tooltip with event info
                dayElement.title = dayEvents.map(event => event.title).join(', ');
            }
            
            calendarGrid.appendChild(dayElement);
        }
    }

    getEventsForDay(day) {
        return this.events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.getFullYear() === this.currentYear &&
                   eventDate.getMonth() === this.currentMonth &&
                   eventDate.getDate() === day;
        });
    }

    async loadEvents() {
        try {
            // Load events from scenes and characters
            const scenes = await this.loadScenes();
            const characters = await this.loadCharacters();
            
            // Process scenes as events
            scenes.forEach(scene => {
                if (scene.date) {
                    this.events.push({
                        title: `Scene: ${scene.title}`,
                        date: scene.date,
                        type: 'scene',
                        characters: scene.characters || []
                    });
                }
            });
            
            // Process character activities as events
            characters.forEach(character => {
                if (character.activities) {
                    character.activities.forEach(activity => {
                        if (activity.date) {
                            this.events.push({
                                title: `${character.name}: ${activity.description}`,
                                date: activity.date,
                                type: 'character',
                                character: character.name
                            });
                        }
                    });
                }
            });
            
            this.renderCalendar();
        } catch (error) {
            console.error('Error loading events:', error);
        }
    }

    async loadScenes() {
        // This would load from GitHub Issues or a JSON file
        // For now, return mock data
        return [
            { title: 'The Alley Meeting', date: '2024-01-15', characters: ['John', 'Sarah'] },
            { title: 'Rooftop Chase', date: '2024-01-18', characters: ['Mike', 'Alex'] }
        ];
    }

    async loadCharacters() {
        // This would load from GitHub Issues or a JSON file
        // For now, return mock data
        return [
            { 
                name: 'John Doe', 
                activities: [
                    { date: '2024-01-15', description: 'Investigating the warehouse' },
                    { date: '2024-01-16', description: 'Meeting with informant' }
                ]
            },
            { 
                name: 'Sarah Smith', 
                activities: [
                    { date: '2024-01-15', description: 'Following the suspect' },
                    { date: '2024-01-17', description: 'Researching ancient texts' }
                ]
            }
        ];
    }
}

// GitHub API integration
class GitHubAPI {
    static async getIssues(label) {
        try {
            const response = await fetch(`${GITHUB_API_BASE}/${REPO_OWNER}/${REPO_NAME}/issues?labels=${label}&state=all`);
            if (!response.ok) throw new Error('Failed to fetch issues');
            return await response.json();
        } catch (error) {
            console.error('Error fetching issues:', error);
            return [];
        }
    }

    static async parseIssueBody(body) {
        try {
            // Parse Dark City character sheet format
            const characterData = {};
            
            // Extract basic info from the first table
            const nameMatch = body.match(/\|\s*Name:\s*([^|]+)\s*\|/);
            if (nameMatch) characterData.name = nameMatch[1].trim();
            
            const ageMatch = body.match(/\|\s*Apparent Age:\s*([^|]+)\s*\|/);
            if (ageMatch) characterData.apparentAge = ageMatch[1].trim();
            
            const actualAgeMatch = body.match(/\|\s*Actual Age:\s*([^|]+)\s*\|/);
            if (actualAgeMatch) characterData.actualAge = actualAgeMatch[1].trim();
            
            const classificationMatch = body.match(/\|\*\*Classification:\*\*\s*([^|]+)\s*\|/);
            if (classificationMatch) characterData.classification = classificationMatch[1].trim();
            
            const playbookMatch = body.match(/\|\*\*Playbook:\*\*\s*([^|]+)\s*\|/);
            if (playbookMatch) characterData.playbook = playbookMatch[1].trim();
            
            const subtypeMatch = body.match(/\|\*\*Subtype:\*\*\s*([^|]+)\s*\|/);
            if (subtypeMatch) characterData.subtype = subtypeMatch[1].trim();
            
            // Extract character bio
            const bioMatch = body.match(/\|\s*-Character Bio-\s*\|\s*\n\|\s*:?----\s*\|\s*\n\|\s*([^|]+)\s*\|/);
            if (bioMatch) characterData.bio = bioMatch[1].trim();
            
            // Extract skills
            characterData.skills = {};
            const skillMatches = body.matchAll(/\|\s*\+(\d+)\s*\|\s*\?\s*\|\s*([^|]*)\s*\|/g);
            for (const match of skillMatches) {
                const level = match[1];
                const skillName = match[2].trim();
                if (skillName) {
                    characterData.skills[skillName] = `+${level}`;
                }
            }
            
            // Extract fate points
            const fateMatch = body.match(/\|\s*Fate Points\s*\|\s*(\d+)\/\d+\s*\|/);
            if (fateMatch) characterData.fatePoints = fateMatch[1];
            
            // Extract scene archive for calendar
            characterData.scenes = [];
            const sceneMatches = body.matchAll(/\|\s*\*\*\[([^\]]+)\]\*\*\s*([^|]+)\s*\|\s*([^|]*)\s*\|/g);
            for (const match of sceneMatches) {
                characterData.scenes.push({
                    title: match[1],
                    summary: match[2].trim(),
                    characters: match[3].trim()
                });
            }
            
            return characterData;
        } catch (error) {
            console.error('Error parsing issue body:', error);
            return {};
        }
    }
}

// Character and Scene loading
class ContentLoader {
    static async loadCharacters() {
        const charactersList = document.getElementById('charactersList');
        
        // Check if charactersList element exists
        if (!charactersList) {
            console.log('Characters section not found on this page - skipping characters loading');
            return;
        }
        
        // Try to load from new JavaScript-based system first
        try {
            if (typeof CharacterSubmission !== 'undefined') {
                const submissionSystem = new CharacterSubmission();
                const approvedCharacters = submissionSystem.getApprovedSubmissions();
                
                if (approvedCharacters.length > 0) {
                    charactersList.innerHTML = '';
                    approvedCharacters.forEach(submission => {
                        const character = submission.character;
                        const card = this.createCharacterCardFromSubmission(character, submission);
                        charactersList.appendChild(card);
                    });
                    console.log(`Loaded ${approvedCharacters.length} approved characters from localStorage`);
                    return;
                }
            }
        } catch (error) {
            console.log('Failed to load from localStorage, falling back to GitHub API:', error);
        }
        
        // Fallback to GitHub API system
        try {
            const issues = await GitHubAPI.getIssues('character-sheet');
            
            if (issues.length === 0) {
                charactersList.innerHTML = '<p>No character sheets submitted yet.</p>';
                return;
            }
            
            charactersList.innerHTML = '';
            issues.forEach(issue => {
                const characterData = GitHubAPI.parseIssueBody(issue.body);
                const card = this.createCharacterCard(characterData, issue);
                charactersList.appendChild(card);
            });
            console.log(`Loaded ${issues.length} characters from GitHub API`);
        } catch (error) {
            console.error('Failed to load characters from GitHub API:', error);
            charactersList.innerHTML = '<p>Unable to load characters at this time.</p>';
        }
    }

    static async loadScenes() {
        const scenesList = document.getElementById('scenesList');
        
        // Check if scenesList element exists
        if (!scenesList) {
            console.log('Scenes section not found on this page - skipping scenes loading');
            return;
        }
        
        const issues = await GitHubAPI.getIssues('scene');
        
        if (issues.length === 0) {
            scenesList.innerHTML = '<p>No scenes submitted yet.</p>';
            return;
        }
        
        scenesList.innerHTML = '';
        issues.forEach(issue => {
            const sceneData = GitHubAPI.parseIssueBody(issue.body);
            const card = this.createSceneCard(sceneData, issue);
            scenesList.appendChild(card);
        });
    }

    static createCharacterCardFromSubmission(character, submission) {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.style.cssText = `
            background: #2a2a2a;
            border: 2px solid #4CAF50;
            border-radius: 10px;
            padding: 1.5rem;
            margin-bottom: 1rem;
            transition: all 0.3s ease;
        `;
        
        const approvedDate = new Date(submission.updated_at || submission.submitted_at).toLocaleDateString();
        
        card.innerHTML = `
            <div style="position: relative;">
                <div style="position: absolute; top: 10px; right: 10px; background: #4CAF50; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: bold;">
                    ✅ APPROVED
                </div>
                <h3 style="color: #ff6b35; margin-bottom: 0.5rem;">${character.name || 'Unnamed Character'}</h3>
                <div style="color: #ccc; font-size: 0.9rem; margin-bottom: 1rem;">
                    <p><strong>Playbook:</strong> ${character.playbook || 'Unknown'}</p>
                    <p><strong>Classification:</strong> ${character.classification || 'Unknown'}</p>
                    <p><strong>Subtype:</strong> ${character.subtype || 'None'}</p>
                    <p><strong>Age:</strong> ${character.apparentAge || 'Unknown'}${character.actualAge ? ` (${character.actualAge})` : ''}</p>
                    <p><strong>Approved:</strong> ${approvedDate}</p>
                </div>
                <div style="color: white; margin-bottom: 1rem;">
                    ${character.bio ? `<p><strong>Bio:</strong> ${character.bio.substring(0, 150)}${character.bio.length > 150 ? '...' : ''}</p>` : ''}
                </div>
                <div style="margin-top: 1rem;">
                    <a href="characters/index.html" class="btn btn-primary" style="font-size: 0.8rem; padding: 0.5rem 1rem;">View Details</a>
                </div>
            </div>
        `;
        
        return card;
    }

    static createCharacterCard(characterData, issue) {
        const card = document.createElement('div');
        card.className = 'character-card';
        
        // Create skills display
        let skillsHtml = '';
        if (characterData.skills && Object.keys(characterData.skills).length > 0) {
            skillsHtml = '<div class="character-skills"><strong>Skills:</strong><ul>';
            Object.entries(characterData.skills).forEach(([skill, level]) => {
                skillsHtml += `<li>${skill}: ${level}</li>`;
            });
            skillsHtml += '</ul></div>';
        }
        
        card.innerHTML = `
            <h3>${characterData.name || 'Unknown Character'}</h3>
            <div class="character-info">
                <p><strong>Classification:</strong> ${characterData.classification || 'Not specified'}</p>
                <p><strong>Playbook:</strong> ${characterData.playbook || 'Not specified'}</p>
                <p><strong>Apparent Age:</strong> ${characterData.apparentAge || 'Not specified'}</p>
                <p><strong>Actual Age:</strong> ${characterData.actualAge || 'Not specified'}</p>
                ${characterData.fatePoints ? `<p><strong>Fate Points:</strong> ${characterData.fatePoints}/5</p>` : ''}
            </div>
            ${characterData.bio ? `<div class="character-bio"><p><strong>Bio:</strong> ${characterData.bio}</p></div>` : ''}
            ${skillsHtml}
            <a href="${issue.html_url}" class="btn btn-outline" target="_blank">View Full Sheet</a>
        `;
        return card;
    }

    static createSceneCard(sceneData, issue) {
        const card = document.createElement('div');
        card.className = 'scene-card';
        card.innerHTML = `
            <h3>${sceneData.title || 'Untitled Scene'}</h3>
            <p><strong>Date:</strong> ${sceneData.date || 'Not specified'}</p>
            <p><strong>Location:</strong> ${sceneData.location || 'Not specified'}</p>
            <p><strong>Characters:</strong> ${sceneData.characters || 'Not specified'}</p>
            <p><strong>Description:</strong> ${sceneData.description || 'No description available'}</p>
            <a href="${issue.html_url}" class="btn btn-outline" target="_blank">View Full Scene</a>
        `;
        return card;
    }
}

// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize calendar
    new Calendar();
    
    // Load content
    ContentLoader.loadCharacters();
    ContentLoader.loadScenes();
});

// Add some interactivity for mobile menu
const createMobileMenu = () => {
    const nav = document.querySelector('.nav-container');
    const navLinks = document.querySelector('.nav-links');
    
    // Create mobile menu button
    const mobileMenuBtn = document.createElement('button');
    mobileMenuBtn.className = 'mobile-menu-btn';
    mobileMenuBtn.innerHTML = '☰';
    mobileMenuBtn.style.cssText = `
        display: none;
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
    `;
    
    nav.insertBefore(mobileMenuBtn, navLinks);
    
    // Toggle mobile menu
    mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('mobile-open');
    });
    
    // Show mobile menu button on small screens
    const checkScreenSize = () => {
        if (window.innerWidth <= 768) {
            mobileMenuBtn.style.display = 'block';
        } else {
            mobileMenuBtn.style.display = 'none';
            navLinks.classList.remove('mobile-open');
        }
    };
    
    window.addEventListener('resize', checkScreenSize);
    checkScreenSize();
};

createMobileMenu();
