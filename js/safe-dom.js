// Safe DOM manipulation utilities
class SafeDOM {
    // Create element with text content (safe from XSS)
    static createElement(tag, attributes = {}, textContent = '') {
        const element = document.createElement(tag);
        
        // Set attributes safely
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = this.escapeHtml(value);
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else if (key.startsWith('data-')) {
                element.setAttribute(key, this.escapeHtml(value));
            } else if (!key.startsWith('on') && !key.includes('javascript')) {
                element.setAttribute(key, this.escapeHtml(value));
            }
        });
        
        // Set text content safely
        if (textContent) {
            element.textContent = textContent;
        }
        
        return element;
    }

    // Set content safely (replaces innerHTML)
    static setContent(element, content) {
        if (typeof content === 'string') {
            element.textContent = content;
        } else if (content instanceof Node) {
            element.innerHTML = '';
            element.appendChild(content);
        } else if (Array.isArray(content)) {
            element.innerHTML = '';
            content.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else if (child instanceof Node) {
                    element.appendChild(child);
                }
            });
        }
    }

    // Create HTML structure safely
    static createHTML(tag, attributes = {}, children = []) {
        const element = this.createElement(tag, attributes);
        
        // Ensure children is an array
        if (!Array.isArray(children)) {
            children = children ? [children] : [];
        }
        
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                element.appendChild(child);
            }
        });
        
        return element;
    }

    // Escape HTML to prevent XSS
    static escapeHtml(unsafe) {
        if (unsafe === null || unsafe === undefined) return '';
        
        return String(unsafe)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Create safe template literal for HTML
    static html(strings, ...values) {
        let result = '';
        strings.forEach((string, i) => {
            result += string;
            if (i < values.length) {
                const value = values[i];
                if (typeof value === 'string' || typeof value === 'number') {
                    result += this.escapeHtml(value);
                } else if (value instanceof Node) {
                    // For nodes, we'll need to handle this differently
                    result += `<!--NODE:${Math.random()}-->`;
                } else {
                    result += this.escapeHtml(String(value));
                }
            }
        });
        return result;
    }

    // Create button with safe content
    static createButton(text, onClick, attributes = {}) {
        const button = this.createElement('button', {
            type: 'button',
            ...attributes
        }, text);
        
        if (typeof onClick === 'function') {
            button.addEventListener('click', onClick);
        }
        
        return button;
    }

    // Create link with safe content
    static createLink(text, href, attributes = {}) {
        return this.createElement('a', {
            href: this.escapeHtml(href),
            ...attributes
        }, text);
    }

    // Create image with safe attributes
    static createImage(src, alt, attributes = {}) {
        return this.createElement('img', {
            src: this.escapeHtml(src),
            alt: this.escapeHtml(alt),
            ...attributes
        });
    }

    // Create form input safely
    static createInput(type, name, value = '', attributes = {}) {
        const input = this.createElement('input', {
            type: this.escapeHtml(type),
            name: this.escapeHtml(name),
            value: this.escapeHtml(value),
            ...attributes
        });
        return input;
    }

    // Create textarea safely
    static createTextarea(name, value = '', attributes = {}) {
        const textarea = this.createElement('textarea', {
            name: this.escapeHtml(name),
            ...attributes
        });
        textarea.value = value;
        return textarea;
    }

    // Create select with options safely
    static createSelect(name, options = [], selectedValue = '', attributes = {}) {
        const select = this.createElement('select', {
            name: this.escapeHtml(name),
            ...attributes
        });
        
        options.forEach(option => {
            const optionElement = this.createElement('option', {
                value: this.escapeHtml(option.value)
            }, option.text);
            
            if (option.value === selectedValue) {
                optionElement.selected = true;
            }
            
            select.appendChild(optionElement);
        });
        
        return select;
    }

    // Create table safely
    static createTable(headers, rows, attributes = {}) {
        const table = this.createElement('table', attributes);
        
        // Create header
        if (headers.length > 0) {
            const thead = this.createElement('thead');
            const headerRow = this.createElement('tr');
            
            headers.forEach(headerText => {
                const th = this.createElement('th', {}, headerText);
                headerRow.appendChild(th);
            });
            
            thead.appendChild(headerRow);
            table.appendChild(thead);
        }
        
        // Create body
        const tbody = this.createElement('tbody');
        rows.forEach(rowData => {
            const tr = this.createElement('tr');
            
            rowData.forEach(cellData => {
                const td = this.createElement('td', {}, String(cellData));
                tr.appendChild(td);
            });
            
            tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        return table;
    }

    // Create card component safely
    static createCard(title, content, footer = null, attributes = {}) {
        const card = this.createElement('div', {
            className: 'card',
            ...attributes
        });
        
        if (title) {
            const header = this.createElement('div', {
                className: 'card-header'
            });
            
            const titleElement = this.createElement('h3', {}, title);
            header.appendChild(titleElement);
            card.appendChild(header);
        }
        
        if (content) {
            const body = this.createElement('div', {
                className: 'card-body'
            });
            
            if (typeof content === 'string') {
                body.textContent = content;
            } else if (content instanceof Node) {
                body.appendChild(content);
            }
            
            card.appendChild(body);
        }
        
        if (footer) {
            const footerElement = this.createElement('div', {
                className: 'card-footer'
            });
            
            if (typeof footer === 'string') {
                footerElement.textContent = footer;
            } else if (footer instanceof Node) {
                footerElement.appendChild(footer);
            }
            
            card.appendChild(footerElement);
        }
        
        return card;
    }

    // Create notification safely
    static createNotification(message, type = 'info', duration = 5000) {
        const notification = this.createElement('div', {
            className: `notification notification-${type}`
        });
        
        const content = this.createElement('div', {
            className: 'notification-content'
        });
        
        const messageElement = this.createElement('p', {}, message);
        content.appendChild(messageElement);
        
        const closeButton = this.createElement('button', {
            className: 'notification-close',
            'aria-label': 'Close notification'
        }, '×');
        
        closeButton.addEventListener('click', () => {
            notification.remove();
        });
        
        content.appendChild(closeButton);
        notification.appendChild(content);
        
        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, duration);
        }
        
        return notification;
    }
}

// Export for use
window.SafeDOM = SafeDOM;

// Template literal tag for safe HTML
window.html = SafeDOM.html.bind(SafeDOM);
