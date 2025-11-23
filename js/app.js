// GitHub API configuration
const GITHUB_API_BASE = 'https://api.github.com/repos';
const REPO_OWNER = 'yourusername'; // Replace with your GitHub username
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
            // Parse YAML front matter from issue body
            const yamlMatch = body.match(/^---\n([\s\S]*?)\n---/);
            if (yamlMatch) {
                const yaml = yamlMatch[1];
                // Simple YAML parsing (you might want to use a proper YAML parser)
                const data = {};
                yaml.split('\n').forEach(line => {
                    const [key, ...valueParts] = line.split(':');
                    if (key && valueParts.length > 0) {
                        data[key.trim()] = valueParts.join(':').trim();
                    }
                });
                return data;
            }
        } catch (error) {
            console.error('Error parsing issue body:', error);
        }
        return {};
    }
}

// Character and Scene loading
class ContentLoader {
    static async loadCharacters() {
        const issues = await GitHubAPI.getIssues('character-sheet');
        const charactersList = document.getElementById('charactersList');
        
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
    }

    static async loadScenes() {
        const issues = await GitHubAPI.getIssues('scene');
        const scenesList = document.getElementById('scenesList');
        
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

    static createCharacterCard(characterData, issue) {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.innerHTML = `
            <h3>${characterData.name || 'Unknown Character'}</h3>
            <p><strong>Class:</strong> ${characterData.class || 'Not specified'}</p>
            <p><strong>Level:</strong> ${characterData.level || '1'}</p>
            <p><strong>Description:</strong> ${characterData.description || 'No description available'}</p>
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
