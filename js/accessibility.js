// Accessibility enhancements for Dark City RPG
class AccessibilityManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupKeyboardNavigation();
        this.setupScreenReaderAnnouncements();
        this.setupFocusManagement();
        this.setupMobileMenuAccessibility();
        this.setupFormAccessibility();
        this.setupCalendarAccessibility();
    }

    // Keyboard navigation support
    setupKeyboardNavigation() {
        // Add keyboard navigation class when using keyboard
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-nav');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-nav');
        });

        // Handle escape key for modals and menus
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
                this.closeMobileMenu();
            }
        });

        // Handle arrow keys for calendar navigation
        this.setupCalendarKeyboardNavigation();
    }

    // Screen reader announcements
    setupScreenReaderAnnouncements() {
        this.announceElement = document.querySelector('.aria-live');
        
        if (!this.announceElement) {
            this.announceElement = document.createElement('div');
            this.announceElement.className = 'aria-live';
            this.announceElement.setAttribute('aria-live', 'polite');
            this.announceElement.setAttribute('aria-atomic', 'true');
            document.body.insertBefore(this.announceElement, document.body.firstChild);
        }
    }

    // Announce messages to screen readers
    announce(message, priority = 'polite') {
        if (!this.announceElement) return;

        this.announceElement.setAttribute('aria-live', priority);
        this.announceElement.textContent = message;
        
        // Clear after announcement
        setTimeout(() => {
            this.announceElement.textContent = '';
        }, 1000);
    }

    // Focus management
    setupFocusManagement() {
        // Trap focus within modals
        this.setupModalFocusTrap();
        
        // Manage focus for dynamic content
        this.observeContentChanges();
    }

    // Modal focus trap
    setupModalFocusTrap() {
        const modals = document.querySelectorAll('.modal');
        
        modals.forEach(modal => {
            modal.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    const focusableElements = modal.querySelectorAll(
                        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                    );
                    
                    if (focusableElements.length === 0) return;
                    
                    const firstElement = focusableElements[0];
                    const lastElement = focusableElements[focusableElements.length - 1];
                    
                    if (e.shiftKey) {
                        if (document.activeElement === firstElement) {
                            e.preventDefault();
                            lastElement.focus();
                        }
                    } else {
                        if (document.activeElement === lastElement) {
                            e.preventDefault();
                            firstElement.focus();
                        }
                    }
                }
            });
        });
    }

    // Observe content changes for focus management
    observeContentChanges() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.enhanceElementAccessibility(node);
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Mobile menu accessibility
    setupMobileMenuAccessibility() {
        const toggle = document.querySelector('.mobile-menu-toggle');
        const menu = document.querySelector('.nav-links');
        
        if (!toggle || !menu) return;

        toggle.addEventListener('click', () => {
            const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
            
            toggle.setAttribute('aria-expanded', !isExpanded);
            menu.setAttribute('aria-hidden', isExpanded);
            
            if (!isExpanded) {
                // Focus first menu item when opening
                const firstMenuItem = menu.querySelector('a');
                if (firstMenuItem) {
                    setTimeout(() => firstMenuItem.focus(), 100);
                }
                this.announce('Mobile menu opened');
            } else {
                this.announce('Mobile menu closed');
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!toggle.contains(e.target) && !menu.contains(e.target)) {
                this.closeMobileMenu();
            }
        });
    }

    closeMobileMenu() {
        const toggle = document.querySelector('.mobile-menu-toggle');
        const menu = document.querySelector('.nav-links');
        
        if (toggle && menu) {
            toggle.setAttribute('aria-expanded', 'false');
            menu.setAttribute('aria-hidden', 'true');
            this.announce('Mobile menu closed');
        }
    }

    // Form accessibility enhancements
    setupFormAccessibility() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            this.enhanceFormAccessibility(form);
        });
    }

    enhanceFormAccessibility(form) {
        // Add required field indicators
        const requiredFields = form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            const label = form.querySelector(`label[for="${field.id}"]`) || 
                          field.closest('.form-group')?.querySelector('label');
            
            if (label && !label.querySelector('.required')) {
                const requiredIndicator = document.createElement('span');
                requiredIndicator.className = 'required';
                requiredIndicator.textContent = ' *';
                requiredIndicator.setAttribute('aria-label', 'required field');
                label.appendChild(requiredIndicator);
            }
        });

        // Add error message containers
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            const group = input.closest('.form-group');
            if (group && !group.querySelector('.error-message')) {
                const errorContainer = document.createElement('div');
                errorContainer.className = 'error-message';
                errorContainer.setAttribute('role', 'alert');
                errorContainer.setAttribute('aria-live', 'polite');
                group.appendChild(errorContainer);
            }
        });

        // Form submission feedback
        form.addEventListener('submit', (e) => {
            this.announce('Form submitted');
        });
    }

    // Calendar accessibility
    setupCalendarAccessibility() {
        const calendar = document.querySelector('#calendarGrid');
        if (!calendar) return;

        // Make calendar grid keyboard navigable
        calendar.setAttribute('role', 'grid');
        calendar.setAttribute('aria-label', 'Calendar');
        
        const days = calendar.querySelectorAll('.calendar-day');
        days.forEach((day, index) => {
            day.setAttribute('role', 'gridcell');
            day.setAttribute('tabindex', '-1');
            
            // Add keyboard navigation
            day.addEventListener('keydown', (e) => {
                this.handleCalendarKeyNavigation(e, index, days);
            });
        });

        // Add navigation buttons
        this.enhanceCalendarNavigation();
    }

    handleCalendarKeyNavigation(e, currentIndex, days) {
        let newIndex = currentIndex;
        
        switch(e.key) {
            case 'ArrowRight':
                newIndex = Math.min(currentIndex + 1, days.length - 1);
                break;
            case 'ArrowLeft':
                newIndex = Math.max(currentIndex - 1, 0);
                break;
            case 'ArrowDown':
                newIndex = Math.min(currentIndex + 7, days.length - 1);
                break;
            case 'ArrowUp':
                newIndex = Math.max(currentIndex - 7, 0);
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                days[currentIndex].click();
                return;
            default:
                return;
        }
        
        e.preventDefault();
        days[newIndex].focus();
        days[newIndex].setAttribute('tabindex', '0');
        days[currentIndex].setAttribute('tabindex', '-1');
    }

    enhanceCalendarNavigation() {
        const prevBtn = document.querySelector('#prevMonth');
        const nextBtn = document.querySelector('#nextMonth');
        
        if (prevBtn) {
            prevBtn.setAttribute('aria-label', 'Previous month');
            prevBtn.addEventListener('click', () => {
                this.announce('Previous month selected');
            });
        }
        
        if (nextBtn) {
            nextBtn.setAttribute('aria-label', 'Next month');
            nextBtn.addEventListener('click', () => {
                this.announce('Next month selected');
            });
        }
    }

    // Character card accessibility
    enhanceCharacterCards() {
        const cards = document.querySelectorAll('.character-card');
        
        cards.forEach(card => {
            card.setAttribute('role', 'article');
            card.setAttribute('tabindex', '0');
            
            // Add keyboard interaction
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    card.click();
                }
            });
        });
    }

    // Modal management
    closeAllModals() {
        const modals = document.querySelectorAll('.modal[aria-hidden="false"]');
        modals.forEach(modal => {
            modal.setAttribute('aria-hidden', 'true');
            this.announce('Modal closed');
        });
    }

    // Dynamic content enhancement
    enhanceElementAccessibility(element) {
        // Character cards
        if (element.classList.contains('character-card') || element.querySelector('.character-card')) {
            this.enhanceCharacterCards();
        }
        
        // Forms
        if (element.tagName === 'FORM' || element.querySelector('form')) {
            this.setupFormAccessibility();
        }
        
        // Calendar
        if (element.id === 'calendarGrid' || element.querySelector('#calendarGrid')) {
            this.setupCalendarAccessibility();
        }
        
        // Loading states
        if (element.classList.contains('loading')) {
            element.setAttribute('aria-busy', 'true');
            this.announce('Loading content');
        }
    }

    // High contrast mode detection
    detectHighContrast() {
        if (window.matchMedia('(prefers-contrast: high)').matches) {
            document.body.classList.add('high-contrast');
            this.announce('High contrast mode enabled');
        }
    }

    // Reduced motion detection
    detectReducedMotion() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.body.classList.add('reduced-motion');
            this.announce('Reduced motion enabled');
        }
    }

    // Initialize accessibility features
    initAccessibilityFeatures() {
        this.detectHighContrast();
        this.detectReducedMotion();
        
        // Enhance existing content
        this.enhanceElementAccessibility(document.body);
    }
}

// Initialize accessibility manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.accessibilityManager = new AccessibilityManager();
    window.accessibilityManager.initAccessibilityFeatures();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AccessibilityManager;
}
