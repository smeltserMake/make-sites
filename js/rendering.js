/**
 * Content rendering utilities for make-sites
 * Supports HTML, Markdown, JSON, and text content
 */

class MakeSitesRenderer {
    constructor() {
        this.marked = null; // Will be loaded dynamically if needed
        this.highlightjs = null; // Will be loaded dynamically if needed
    }

    /**
     * Render content based on format
     * @param {string} content - Content to render
     * @param {object} metadata - Content metadata
     * @returns {Promise<string>} Rendered HTML
     */
    async render(content, metadata) {
        const format = metadata.f || 'html';
        
        switch (format.toLowerCase()) {
            case 'html':
                return this._renderHTML(content);
            case 'markdown':
            case 'md':
                return await this._renderMarkdown(content);
            case 'json':
                return this._renderJSON(content);
            case 'text':
            case 'txt':
                return this._renderText(content);
            default:
                return this._renderText(content);
        }
    }

    /**
     * Render HTML content with safety checks
     * @private
     */
    _renderHTML(content) {
        // Basic XSS protection - remove script tags and javascript: protocols
        const sanitized = content
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, 'blocked:')
            .replace(/on\w+\s*=/gi, 'data-blocked=');
        
        return `
            <div class="html-content">
                ${sanitized}
            </div>
        `;
    }

    /**
     * Render Markdown content
     * @private
     */
    async _renderMarkdown(content) {
        await this._loadMarked();
        
        if (!this.marked) {
            // Fallback to basic markdown-like rendering
            return this._renderBasicMarkdown(content);
        }

        try {
            const html = this.marked.parse(content);
            return `
                <div class="markdown-content">
                    ${html}
                </div>
            `;
        } catch (error) {
            console.error('Markdown rendering failed:', error);
            return this._renderText(content);
        }
    }

    /**
     * Render JSON content with syntax highlighting
     * @private
     */
    _renderJSON(content) {
        try {
            const parsed = JSON.parse(content);
            const formatted = JSON.stringify(parsed, null, 2);
            
            return `
                <div class="json-content">
                    <div class="content-header">
                        <h2>JSON Data</h2>
                        <div class="json-stats">
                            <span class="stat">Objects: ${this._countObjects(parsed)}</span>
                            <span class="stat">Size: ${this._formatBytes(content.length)}</span>
                        </div>
                    </div>
                    <pre class="json-display"><code class="language-json">${this._escapeHTML(formatted)}</code></pre>
                </div>
            `;
        } catch (error) {
            return `
                <div class="json-content error">
                    <div class="content-header">
                        <h2>Invalid JSON</h2>
                    </div>
                    <div class="error-message">
                        <p>Failed to parse JSON: ${error.message}</p>
                    </div>
                    <pre class="raw-content"><code>${this._escapeHTML(content)}</code></pre>
                </div>
            `;
        }
    }

    /**
     * Render plain text content
     * @private
     */
    _renderText(content) {
        const lines = content.split('\n').length;
        const words = content.split(/\s+/).filter(w => w.length > 0).length;
        
        return `
            <div class="text-content">
                <div class="content-header">
                    <h2>Text Content</h2>
                    <div class="text-stats">
                        <span class="stat">Lines: ${lines}</span>
                        <span class="stat">Words: ${words}</span>
                        <span class="stat">Characters: ${content.length}</span>
                    </div>
                </div>
                <pre class="text-display">${this._escapeHTML(content)}</pre>
            </div>
        `;
    }

    /**
     * Load marked.js library dynamically
     * @private
     */
    async _loadMarked() {
        if (this.marked) return;

        try {
            // Try to load from CDN
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
            
            await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });

            this.marked = window.marked;
            
            // Configure marked
            if (this.marked) {
                this.marked.setOptions({
                    breaks: true,
                    gfm: true,
                    headerIds: true,
                    mangle: false
                });
            }
        } catch (error) {
            console.warn('Failed to load marked.js:', error);
        }
    }

    /**
     * Basic markdown-like rendering fallback
     * @private
     */
    _renderBasicMarkdown(content) {
        let html = this._escapeHTML(content);
        
        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        
        // Bold and italic
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Code blocks
        html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        html = html.replace(/`(.*?)`/g, '<code>$1</code>');
        
        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
        
        // Line breaks
        html = html.replace(/\n/g, '<br>');
        
        return `
            <div class="markdown-content basic">
                ${html}
            </div>
        `;
    }

    /**
     * Count objects in JSON structure
     * @private
     */
    _countObjects(obj, count = 0) {
        if (typeof obj === 'object' && obj !== null) {
            count++;
            if (Array.isArray(obj)) {
                obj.forEach(item => {
                    count = this._countObjects(item, count);
                });
            } else {
                Object.values(obj).forEach(value => {
                    count = this._countObjects(value, count);
                });
            }
        }
        return count;
    }

    /**
     * Escape HTML characters
     * @private
     */
    _escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Format bytes for display
     * @private
     */
    _formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    /**
     * Create a table of contents for rendered content
     * @param {string} content - Rendered HTML content
     * @returns {string} TOC HTML
     */
    generateTOC(content) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        
        const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
        if (headings.length === 0) return '';
        
        let toc = '<div class="table-of-contents"><h3>Contents</h3><ul>';
        
        headings.forEach((heading, index) => {
            const id = `heading-${index}`;
            heading.id = id;
            const level = parseInt(heading.tagName[1]);
            const indent = (level - 1) * 20;
            
            toc += `<li style="margin-left: ${indent}px">
                <a href="#${id}">${heading.textContent}</a>
            </li>`;
        });
        
        toc += '</ul></div>';
        
        return toc + content;
    }
}

// Export for use in other modules
window.MakeSitesRenderer = MakeSitesRenderer;