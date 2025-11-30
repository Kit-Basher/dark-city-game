// Frontend Error Handler
class ErrorHandler {
    constructor() {
        this.init();
    }

    init() {
        // Global error handler for unhandled promises
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleError(event.reason, 'Unhandled Promise Rejection');
            event.preventDefault();
        });

        // Global error handler for uncaught errors
        window.addEventListener('error', (event) => {
            console.error('Uncaught error:', event.error);
            this.handleError(event.error, 'Uncaught Error');
        });

        // Handle fetch errors globally
        this.interceptFetch();
    }

    // Intercept fetch calls to add error handling
    interceptFetch() {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);
                
                // Handle HTTP errors
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    const error = new Error(errorData.error || `HTTP ${response.status}`);
                    error.status = response.status;
                    error.data = errorData;
                    console.log('🔍 Server error details:', errorData);
                    console.log('🔍 Error details:', errorData.details);
                    console.log('🔍 Error fields:', errorData.fields);
                    console.log('🔍 Full error object:', JSON.stringify(errorData, null, 2));
                    throw error;
                }
                
                return response;
            } catch (error) {
                this.handleNetworkError(error);
                throw error;
            }
        };
    }

    // Handle different types of errors
    handleError(error, context = 'Unknown Error') {
        const errorInfo = {
            message: error.message || 'An unexpected error occurred',
            context: context,
            timestamp: new Date().toISOString(),
            stack: error.stack
        };

        // Log to console in development
        if (window.CONFIG?.NODE_ENV === 'development') {
            console.error('Error Details:', errorInfo);
        }

        // Show user-friendly error message
        this.showUserError(errorInfo);

        // Send error to logging service (in production)
        if (window.CONFIG?.NODE_ENV === 'production') {
            this.logError(errorInfo);
        }
    }

    // Handle network-specific errors
    handleNetworkError(error) {
        let userMessage = 'Network error occurred';

        if (error.status === 401) {
            userMessage = 'Authentication required. Please log in again.';
        } else if (error.status === 403) {
            userMessage = 'Access denied. You don\'t have permission for this action.';
        } else if (error.status === 404) {
            userMessage = 'The requested resource was not found.';
        } else if (error.status >= 500) {
            userMessage = 'Server error. Please try again later.';
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
            userMessage = 'Unable to connect to the server. Please check your internet connection.';
        }

        this.showUserError({
            message: userMessage,
            context: 'Network Error',
            timestamp: new Date().toISOString(),
            originalError: error
        });
    }

    // Show error message to user
    showUserError(errorInfo) {
        // Remove existing error notifications
        this.removeErrorNotifications();

        // Create error notification element
        const errorElement = document.createElement('div');
        errorElement.className = 'error-notification';
        errorElement.innerHTML = `
            <div class="error-content">
                <h4>⚠️ Error</h4>
                <p>${this.sanitizeHtml(errorInfo.message)}</p>
                <button class="error-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Add styles if not already present
        this.addErrorStyles();

        // Add to page
        document.body.appendChild(errorElement);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorElement.parentElement) {
                errorElement.remove();
            }
        }, 5000);
    }

    // Remove existing error notifications
    removeErrorNotifications() {
        const existingErrors = document.querySelectorAll('.error-notification');
        existingErrors.forEach(error => error.remove());
    }

    // Add error notification styles
    addErrorStyles() {
        if (document.getElementById('error-styles')) return;

        const style = document.createElement('style');
        style.id = 'error-styles';
        style.textContent = `
            .error-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #dc3545;
                color: white;
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 10000;
                max-width: 400px;
                animation: slideInRight 0.3s ease-out;
            }

            .error-content {
                position: relative;
            }

            .error-content h4 {
                margin: 0 0 8px 0;
                font-size: 16px;
            }

            .error-content p {
                margin: 0;
                font-size: 14px;
                line-height: 1.4;
            }

            .error-close {
                position: absolute;
                top: 5px;
                right: 5px;
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .error-close:hover {
                background: rgba(255,255,255,0.2);
                border-radius: 50%;
            }

            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @media (max-width: 768px) {
                .error-notification {
                    left: 10px;
                    right: 10px;
                    max-width: none;
                    top: 10px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    // Sanitize HTML to prevent XSS
    sanitizeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Log error to server (in production)
    async logError(errorInfo) {
        try {
            await fetch('/api/logs/error', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(errorInfo)
            });
        } catch (e) {
            // Silently fail to avoid infinite error loops
            console.warn('Failed to log error to server:', e);
        }
    }
}

// Initialize error handler
window.errorHandler = new ErrorHandler();

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
}
