/**
 * Main viewer logic for make-sites
 * Handles URL fragment parsing and content rendering
 */

class MakeSitesViewer {
    constructor() {
        this.compression = new MakeSitesCompression();
        this.renderer = new MakeSitesRenderer();
        this.contentContainer = null;
        this.errorContainer = null;
        this.loadingContainer = null;
        this.metadataContainer = null;
    }

    /**
     * Initialize the viewer
     */
    async init() {
        this._setupContainers();
        this._setupEventListeners();
        await this._loadFromURL();
    }

    /**
     * Setup DOM containers
     * @private
     */
    _setupContainers() {
        // Create main containers if they don't exist
        if (!document.getElementById('content')) {
            document.body.innerHTML = `
                <div class="viewer-container">
                    <div id="loading" class="loading-container">
                        <div class="loading-spinner"></div>
                        <p>Loading content...</p>
                    </div>
                    <div id="error" class="error-container" style="display: none;">
                        <h2>Error Loading Content</h2>
                        <p class="error-message"></p>
                        <div class="error-actions">
                            <button onclick="location.reload()">Retry</button>
                            <button onclick="window.makeSitesViewer.showHelp()">Help</button>
                        </div>
                    </div>
                    <div id="metadata" class="metadata-container" style="display: none;">
                        <div class="metadata-content">
                            <span class="compression-info"></span>
                            <span class="size-info"></span>
                            <span class="format-info"></span>
                            <button class="metadata-toggle" onclick="this.parentElement.parentElement.style.display='none'">×</button>
                        </div>
                    </div>
                    <div id="content" class="content-container" style="display: none;"></div>
                </div>
            `;
        }

        this.contentContainer = document.getElementById('content');
        this.errorContainer = document.getElementById('error');
        this.loadingContainer = document.getElementById('loading');
        this.metadataContainer = document.getElementById('metadata');
    }

    /**
     * Setup event listeners
     * @private
     */
    _setupEventListeners() {
        // Listen for hash changes
        window.addEventListener('hashchange', () => this._loadFromURL());
        
        // Listen for keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'i':
                        e.preventDefault();
                        this._toggleMetadata();
                        break;
                    case 'r':
                        e.preventDefault();
                        this._reloadContent();
                        break;
                }
            }
        });
    }

    /**
     * Load content from URL fragment
     * @private
     */
    async _loadFromURL() {
        const hash = window.location.hash.substring(1); // Remove #
        
        if (!hash) {
            this._showHelp();
            return;
        }

        this._showLoading();

        try {
            const { content, metadata } = await this.compression.decompress(hash);
            const renderedContent = await this.renderer.render(content, metadata);
            
            // Add table of contents if applicable
            const finalContent = this.renderer.generateTOC(renderedContent);
            
            this._showContent(finalContent, metadata);
        } catch (error) {
            console.error('Failed to load content:', error);
            this._showError(error.message);
        }
    }

    /**
     * Show loading state
     * @private
     */
    _showLoading() {
        this.loadingContainer.style.display = 'block';
        this.contentContainer.style.display = 'none';
        this.errorContainer.style.display = 'none';
        this.metadataContainer.style.display = 'none';
    }

    /**
     * Show content
     * @private
     */
    _showContent(content, metadata) {
        this.contentContainer.innerHTML = content;
        this.contentContainer.style.display = 'block';
        this.loadingContainer.style.display = 'none';
        this.errorContainer.style.display = 'none';
        
        this._updateMetadata(metadata);
        this._enhanceContent();
    }

    /**
     * Show error message
     * @private
     */
    _showError(message) {
        this.errorContainer.querySelector('.error-message').textContent = message;
        this.errorContainer.style.display = 'block';
        this.contentContainer.style.display = 'none';
        this.loadingContainer.style.display = 'none';
        this.metadataContainer.style.display = 'none';
    }

    /**
     * Show help/landing page
     * @private
     */
    _showHelp() {
        const helpContent = `
            <div class="help-content">
                <h1>🚀 make-sites</h1>
                <p class="subtitle">Modern data URL compression for shareable web content</p>
                
                <div class="help-section">
                    <h2>How to Use</h2>
                    <ol>
                        <li>Create compressed content using Claude Code or the compression tool</li>
                        <li>Append the compressed data to this URL: <code>${window.location.origin}${window.location.pathname}#&lt;data&gt;</code></li>
                        <li>Share the URL - it contains your entire site!</li>
                    </ol>
                </div>

                <div class="help-section">
                    <h2>Supported Formats</h2>
                    <div class="format-grid">
                        <div class="format-card">
                            <h3>📄 HTML</h3>
                            <p>Rich web pages with styling and interactivity</p>
                        </div>
                        <div class="format-card">
                            <h3>📝 Markdown</h3>
                            <p>Formatted text with automatic TOC generation</p>
                        </div>
                        <div class="format-card">
                            <h3>📊 JSON</h3>
                            <p>Structured data with syntax highlighting</p>
                        </div>
                        <div class="format-card">
                            <h3>📋 Text</h3>
                            <p>Plain text with statistics and formatting</p>
                        </div>
                    </div>
                </div>

                <div class="help-section">
                    <h2>Features</h2>
                    <ul>
                        <li>🗜️ Advanced compression (Brotli/gzip)</li>
                        <li>📱 Mobile responsive design</li>
                        <li>🔒 No server storage - everything in the URL</li>
                        <li>⚡ Fast loading and rendering</li>
                        <li>🎨 Professional styling</li>
                    </ul>
                </div>

                <div class="help-section">
                    <h2>Keyboard Shortcuts</h2>
                    <ul>
                        <li><kbd>Ctrl/Cmd + I</kbd> - Toggle metadata info</li>
                        <li><kbd>Ctrl/Cmd + R</kbd> - Reload content</li>
                    </ul>
                </div>

                <div class="help-footer">
                    <p>Built with ❤️ for sharing content anywhere</p>
                    <p><a href="https://github.com/smeltserMake/make-sites" target="_blank">View on GitHub</a></p>
                </div>
            </div>
        `;

        this.contentContainer.innerHTML = helpContent;
        this.contentContainer.style.display = 'block';
        this.loadingContainer.style.display = 'none';
        this.errorContainer.style.display = 'none';
        this.metadataContainer.style.display = 'none';
    }

    /**
     * Update metadata display
     * @private
     */
    _updateMetadata(metadata) {
        const compressionInfo = this.metadataContainer.querySelector('.compression-info');
        const sizeInfo = this.metadataContainer.querySelector('.size-info');
        const formatInfo = this.metadataContainer.querySelector('.format-info');

        compressionInfo.textContent = `Compression: ${metadata.c.toUpperCase()}`;
        sizeInfo.textContent = `${this._formatBytes(metadata.cs)} (${metadata.r}% saved)`;
        formatInfo.textContent = `Format: ${metadata.f.toUpperCase()}`;
    }

    /**
     * Toggle metadata display
     * @private
     */
    _toggleMetadata() {
        const display = this.metadataContainer.style.display;
        this.metadataContainer.style.display = display === 'none' ? 'block' : 'none';
    }

    /**
     * Reload current content
     * @private
     */
    _reloadContent() {
        this._loadFromURL();
    }

    /**
     * Enhance rendered content with additional features
     * @private
     */
    _enhanceContent() {
        // Add click handlers for TOC links
        const tocLinks = this.contentContainer.querySelectorAll('.table-of-contents a');
        tocLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        // Add copy buttons to code blocks
        const codeBlocks = this.contentContainer.querySelectorAll('pre code');
        codeBlocks.forEach(block => {
            const button = document.createElement('button');
            button.className = 'copy-button';
            button.textContent = 'Copy';
            button.onclick = () => this._copyToClipboard(block.textContent, button);
            
            block.parentElement.style.position = 'relative';
            block.parentElement.appendChild(button);
        });

        // Add external link indicators
        const externalLinks = this.contentContainer.querySelectorAll('a[href^="http"]');
        externalLinks.forEach(link => {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
            link.insertAdjacentHTML('beforeend', ' ↗');
        });
    }

    /**
     * Copy text to clipboard
     * @private
     */
    async _copyToClipboard(text, button) {
        try {
            await navigator.clipboard.writeText(text);
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            button.classList.add('copied');
            setTimeout(() => {
                button.textContent = originalText;
                button.classList.remove('copied');
            }, 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
            button.textContent = 'Failed';
            setTimeout(() => {
                button.textContent = 'Copy';
            }, 2000);
        }
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
     * Public method to show help
     */
    showHelp() {
        this._showHelp();
    }
}

// Initialize viewer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.makeSitesViewer = new MakeSitesViewer();
    window.makeSitesViewer.init();
});

// Export for use in other modules
window.MakeSitesViewer = MakeSitesViewer;