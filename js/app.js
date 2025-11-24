// GitHub API configuration
const GITHUB_API_BASE = 'https://api.github.com/repos';
const REPO_OWNER = window.CONFIG?.REPO_OWNER || 'Kit-Basher'; // Replace with your GitHub username
const REPO_NAME = window.CONFIG?.REPO_NAME || 'dark-city-game';

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

    renderCalendar() {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        
        const monthYearElement = document.getElementById('currentMonth');
        if (monthYearElement) {
            monthYearElement.textContent = `${monthNames[this.currentMonth]} ${this.currentYear}`;
        }
        
        const calendarGrid = document.getElementById('calendarGrid');
        if (!calendarGrid) return;
        
        // Clear existing content safely
        while (calendarGrid.firstChild) {
            calendarGrid.removeChild(calendarGrid.firstChild);
        }
        
        const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
        const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        
        // Add day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            const dayHeader = SafeDOM.createElement('div', {
                className: 'calendar-day header'
            }, day);
            calendarGrid.appendChild(dayHeader);
        });
        
        // Add empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = SafeDOM.createElement('div', {
                className: 'calendar-day'
            });
            calendarGrid.appendChild(emptyDay);
        }
        
        // Add days of the month
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = SafeDOM.createElement('div', {
                className: 'calendar-day'
            }, String(day));
            
            // Highlight today
            if (today.getDate() === day && 
                today.getMonth() === this.currentMonth && 
                today.getFullYear() === this.currentYear) {
                dayElement.classList.add('today');
            }
            
            // Add events for this day
            const dayEvents = this.events.filter(event => {
                const eventDate = new Date(event.date);
                return eventDate.getDate() === day &&
                       eventDate.getMonth() === this.currentMonth &&
                       eventDate.getFullYear() === this.currentYear;
            });
            
            if (dayEvents.length > 0) {
                dayElement.classList.add('has-events');
                const eventIndicator = SafeDOM.createElement('span', {
                    className: 'event-indicator'
                }, `${dayEvents.length} event${dayEvents.length > 1 ? 's' : ''}`);
                dayElement.appendChild(eventIndicator);
            }
            
            dayElement.addEventListener('click', () => this.showDayEvents(day));
            calendarGrid.appendChild(dayElement);
        }
    }

    attachEventListeners() {
        const prevMonthBtn = document.getElementById('prevMonth');
        const nextMonthBtn = document.getElementById('nextMonth');
        
        if (prevMonthBtn) {
            prevMonthBtn.addEventListener('click', () => this.changeMonth(-1));
        }
        if (nextMonthBtn) {
            nextMonthBtn.addEventListener('click', () => this.changeMonth(1));
        }
    }

    changeMonth(direction) {
        this.currentMonth += direction;
        
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        } else if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        
        this.renderCalendar();
    }

    async loadEvents() {
        try {
            // Load events from server API or GitHub Issues
            const events = await this.fetchCalendarEvents();
            this.events = events;
            this.renderCalendar();
        } catch (error) {
            console.error('Error loading events:', error);
            // Fallback to mock data if API fails
            this.events = [
                { date: new Date(this.currentYear, this.currentMonth, 15), title: 'Game Session' },
                { date: new Date(this.currentYear, this.currentMonth, 22), title: 'Character Workshop' }
            ];
            this.renderCalendar();
        }
    }

    async fetchCalendarEvents() {
        try {
            // Try to fetch from server API first
            const response = await fetch('/api/events');
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.log('Server API not available, trying GitHub...');
        }

        // Fallback to GitHub Issues
        try {
            const githubApi = new GitHubAPI();
            const issues = await githubApi.fetchIssues();
            return issues
                .filter(issue => issue.labels.some(label => label.name === 'event'))
                .map(issue => ({
                    title: issue.title,
                    date: new Date(issue.created_at),
                    description: issue.body || '',
                    url: issue.html_url
                }));
        } catch (error) {
            console.error('Failed to load events from GitHub:', error);
            return [];
        }
    }

    showDayEvents(day) {
        const date = new Date(this.currentYear, this.currentMonth, day);
        const dayEvents = this.events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.getDate() === day &&
                   eventDate.getMonth() === this.currentMonth &&
                   eventDate.getFullYear() === this.currentYear;
        });
        
        const eventList = document.getElementById('eventList');
        if (!eventList) return;
        
        // Clear existing content safely
        while (eventList.firstChild) {
            eventList.removeChild(eventList.firstChild);
        }
        
        if (dayEvents.length === 0) {
            const noEvents = SafeDOM.createElement('p', {}, 'No events scheduled for this day.');
            eventList.appendChild(noEvents);
        } else {
            dayEvents.forEach(event => {
                const eventItem = SafeDOM.createElement('div', {
                    className: 'event-item'
                });
                
                const eventTitle = SafeDOM.createElement('h4', {}, event.title);
                const eventDate = SafeDOM.createElement('small', {}, 
                    date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                );
                
                eventItem.appendChild(eventTitle);
                eventItem.appendChild(eventDate);
                eventList.appendChild(eventItem);
            });
        }
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
    // Load characters from server
    static async loadCharacters() {
        console.log('Loading approved characters from server...');
        
        try {
            const characters = await window.serverAPI.getApprovedCharacters();
            console.log(`Loaded ${characters.length} approved characters from server`);
            
            this.displayCharacters(characters);
        } catch (error) {
            console.error('Error loading characters from server:', error);
            // Fallback to empty display
            this.displayCharacters([]);
        }
    }

    // Display characters on the main page
    static displayCharacters(characters) {
        const charactersList = document.getElementById('charactersList');
        if (!charactersList) return;

        // Clear existing content safely
        while (charactersList.firstChild) {
            charactersList.removeChild(charactersList.firstChild);
        }

        if (characters.length === 0) {
            const message = SafeDOM.createElement('p', {}, 'No characters submitted yet.');
            charactersList.appendChild(message);
            return;
        }

        characters.forEach(character => {
            const characterCard = this.createCharacterCard(character);
            if (characterCard instanceof Node) {
                charactersList.appendChild(characterCard);
            }
        });
    }

    // Create character card HTML
    static createCharacterCard(character) {
        const card = SafeDOM.createElement('div', {
            className: 'character-card'
        });
        
        const header = SafeDOM.createElement('div', {
            className: 'character-header'
        });
        
        const title = SafeDOM.createElement('h3', {}, character.name || 'Unnamed Character');
        header.appendChild(title);
        
        const type = SafeDOM.createElement('span', {
            className: 'character-type'
        }, character.classification || 'Unknown');
        header.appendChild(type);
        
        card.appendChild(header);
        
        const details = SafeDOM.createElement('div', {
            className: 'character-details'
        });
        
        const playbook = SafeDOM.createElement('p', {}, 
            `Playbook: ${character.playbook || 'N/A'}`
        );
        details.appendChild(playbook);
        
        const age = SafeDOM.createElement('p', {}, 
            `Apparent Age: ${character.apparentAge || 'N/A'}`
        );
        details.appendChild(age);
        
        if (character.bio) {
            const bio = SafeDOM.createElement('p', {}, 
                `Bio: ${character.bio.substring(0, 150)}${character.bio.length > 150 ? '...' : ''}`
            );
            details.appendChild(bio);
        }
        
        if (character.skills && character.skills.length > 0) {
            const skillsContainer = SafeDOM.createElement('div', {
                className: 'character-skills'
            });
            
            const skillsLabel = SafeDOM.createElement('strong', {}, 'Skills: ');
            skillsContainer.appendChild(skillsLabel);
            
            character.skills.slice(0, 3).forEach(skill => {
                const skillTag = SafeDOM.createElement('span', {
                    className: 'skill-tag'
                }, `+${skill.level} ${skill.name}`);
                skillsContainer.appendChild(skillTag);
            });
            
            if (character.skills.length > 3) {
                const moreSkills = SafeDOM.createElement('span', {
                    className: 'skill-more'
                }, `+${character.skills.length - 3} more`);
                skillsContainer.appendChild(moreSkills);
            }
            
            details.appendChild(skillsContainer);
        }
        
        card.appendChild(details);
        
        const footer = SafeDOM.createElement('div', {
            className: 'character-footer'
        });
        
        const submittedDate = SafeDOM.createElement('small', {}, 
            `Submitted: ${new Date(character.submittedAt || character.submitted_at).toLocaleDateString()}`
        );
        footer.appendChild(submittedDate);
        
        card.appendChild(footer);
        
        return card;
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
