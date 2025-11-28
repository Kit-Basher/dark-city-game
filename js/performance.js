// Performance optimizations for Dark City RPG

// Lazy loading for images
class LazyLoader {
    constructor() {
        this.init();
    }

    init() {
        if ('IntersectionObserver' in window) {
            this.setupIntersectionObserver();
        } else {
            this.fallbackLoad();
        }
    }

    setupIntersectionObserver() {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    fallbackLoad() {
        document.querySelectorAll('img[data-src]').forEach(img => {
            img.src = img.dataset.src;
            img.classList.remove('lazy');
        });
    }
}

// Pagination for character lists
class CharacterPagination {
    constructor(container, itemsPerPage = 12) {
        this.container = container;
        this.itemsPerPage = itemsPerPage;
        this.currentPage = 1;
        this.totalItems = 0;
        this.totalPages = 0;
        this.characters = [];
    }

    init(characters) {
        this.characters = characters;
        this.totalItems = characters.length;
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        this.currentPage = 1;
        this.render();
    }

    render() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageCharacters = this.characters.slice(startIndex, endIndex);

        this.container.innerHTML = pageCharacters.map(character => this.renderCharacter(character)).join('');
        this.renderPaginationControls();
    }

    renderCharacter(character) {
        const safeName = character.name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

        const sanitizedName = character.name ? character.name.replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'Unknown Character';
        const sanitizedClassification = character.classification ? character.classification.replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'Unknown';
        const sanitizedPlaybook = character.playbook ? character.playbook.replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'Unknown';
        const sanitizedBio = character.bio ? character.bio.substring(0, 100).replace(/</g, '&lt;').replace(/>/g, '&gt;') + (character.bio.length > 100 ? '...' : '') : 'No bio provided';

        return `
            <div class="character-card clickable-character" 
                 onclick="window.open('characters/profiles/${safeName}-${character._id}.html', '_blank')">
                <h4>${sanitizedName}</h4>
                <p class="text-sm">${sanitizedClassification} - ${sanitizedPlaybook}</p>
                <p class="text-xs text-gray">${sanitizedBio}</p>
                <p class="text-xs text-muted">📄 View full profile</p>
            </div>
        `;
    }

    renderPaginationControls() {
        if (this.totalPages <= 1) return;

        const controls = document.createElement('div');
        controls.className = 'pagination-controls';
        controls.innerHTML = `
            <button class="btn btn-outline" onclick="window.characterPagination.goToPage(${this.currentPage - 1})" 
                    ${this.currentPage === 1 ? 'disabled' : ''}>Previous</button>
            <span class="page-info">Page ${this.currentPage} of ${this.totalPages}</span>
            <button class="btn btn-outline" onclick="window.characterPagination.goToPage(${this.currentPage + 1})" 
                    ${this.currentPage === this.totalPages ? 'disabled' : ''}>Next</button>
        `;

        this.container.appendChild(controls);
    }

    goToPage(page) {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.render();
    }
}

// Debounce utility for search and other input events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle utility for scroll events
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Performance monitoring
class PerformanceMonitor {
    constructor() {
        this.metrics = {};
        this.init();
    }

    init() {
        // Monitor page load performance
        window.addEventListener('load', () => {
            this.recordPageLoadMetrics();
        });

        // Monitor API call performance
        this.monitorAPIPerformance();
    }

    recordPageLoadMetrics() {
        if ('performance' in window) {
            const navigation = performance.getEntriesByType('navigation')[0];
            this.metrics.pageLoad = {
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                totalLoad: navigation.loadEventEnd - navigation.fetchStart
            };

            if (window.APP_CONFIG.NODE_ENV === 'development') {
                console.log('Page Load Metrics:', this.metrics.pageLoad);
            }
        }
    }

    monitorAPIPerformance() {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const start = performance.now();
            const url = args[0];
            
            try {
                const response = await originalFetch(...args);
                const end = performance.now();
                
                this.recordAPIMetric(url, end - start, response.status);
                return response;
            } catch (error) {
                const end = performance.now();
                this.recordAPIMetric(url, end - start, 'error');
                throw error;
            }
        };
    }

    recordAPIMetric(url, duration, status) {
        const urlKey = url.split('/').pop() || 'unknown';
        
        if (!this.metrics.api) {
            this.metrics.api = {};
        }
        
        if (!this.metrics.api[urlKey]) {
            this.metrics.api[urlKey] = {
                count: 0,
                totalTime: 0,
                avgTime: 0,
                errors: 0
            };
        }
        
        const metric = this.metrics.api[urlKey];
        metric.count++;
        metric.totalTime += duration;
        metric.avgTime = metric.totalTime / metric.count;
        
        if (status === 'error' || status >= 400) {
            metric.errors++;
        }
        
        if (window.APP_CONFIG.NODE_ENV === 'development') {
            console.log(`API ${urlKey}: ${duration.toFixed(2)}ms (${status})`);
        }
    }

    getMetrics() {
        return this.metrics;
    }
}

// Caching for API responses
class APICache {
    constructor(maxAge = 5 * 60 * 1000) { // 5 minutes default
        this.cache = new Map();
        this.maxAge = maxAge;
    }

    set(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() - item.timestamp > this.maxAge) {
            this.cache.delete(key);
            return null;
        }
        
        return item.data;
    }

    clear() {
        this.cache.clear();
    }

    size() {
        return this.cache.size;
    }
}

// Initialize performance optimizations
window.lazyLoader = new LazyLoader();
window.performanceMonitor = new PerformanceMonitor();
window.apiCache = new APICache();

// Export utilities
window.debounce = debounce;
window.throttle = throttle;
window.CharacterPagination = CharacterPagination;
