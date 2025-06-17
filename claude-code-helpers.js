/**
 * Claude Code Helper Functions for make-sites
 * 
 * Copy these functions into your Claude Code workspace for easy make-sites integration.
 * These functions allow you to quickly generate compressed URLs for sharing content.
 */

/**
 * Basic helper function to create make-sites URLs
 * @param {string} content - Content to compress and share
 * @param {string} format - Content format ('html', 'markdown', 'json', 'text')
 * @returns {Promise<string>} The shareable make-sites URL
 */
async function createMakeSiteURL(content, format = 'html') {
    // Dynamically load the compression library
    if (!window.MakeSitesCompression) {
        const script = document.createElement('script');
        script.src = 'https://smeltserMake.github.io/make-sites/js/compression.js';
        await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    // Compress the content
    const compression = new window.MakeSitesCompression();
    const compressed = await compression.compress(content, format);
    
    // Generate the URL
    const baseUrl = 'https://smeltserMake.github.io/make-sites#';
    return baseUrl + compressed;
}

/**
 * Advanced helper with compression statistics and logging
 * @param {string} content - Content to compress and share
 * @param {string} format - Content format ('html', 'markdown', 'json', 'text')
 * @param {boolean} showStats - Whether to log compression statistics
 * @returns {Promise<{url: string, stats: object}>} URL and compression stats
 */
async function createMakeSiteURLWithStats(content, format = 'html', showStats = true) {
    // Load compression library if needed
    if (!window.MakeSitesCompression) {
        const script = document.createElement('script');
        script.src = 'https://smeltserMake.github.io/make-sites/js/compression.js';
        await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    const compression = new window.MakeSitesCompression();
    const compressed = await compression.compress(content, format);
    const stats = compression.getStats(content, compressed);
    
    const url = 'https://smeltserMake.github.io/make-sites#' + compressed;
    
    if (showStats) {
        console.log('📊 make-sites Compression Results:');
        console.log(`   Format: ${format.toUpperCase()}`);
        console.log(`   Original Size: ${stats.readable.original}`);
        console.log(`   Compressed Size: ${stats.readable.compressed}`);
        console.log(`   Space Saved: ${stats.readable.saved} (${stats.ratio}%)`);
        console.log(`   Method: ${compression.supportsBrotli ? 'Brotli' : 'Gzip'}`);
        console.log(`🔗 Shareable URL: ${url}`);
        console.log(`📏 URL Length: ${url.length} characters`);
    }
    
    return { url, stats, format };
}

/**
 * Create a make-sites URL for HTML content with automatic styling
 * @param {string} title - Page title
 * @param {string} content - HTML content (without html/head/body tags)
 * @param {string} customCSS - Additional CSS styling (optional)
 * @returns {Promise<string>} The shareable make-sites URL
 */
async function createStyledHTMLSite(title, content, customCSS = '') {
    const defaultCSS = `
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            background: #f8fafc;
        }
        
        .container {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        h1, h2, h3 { color: #2c3e50; margin-top: 2rem; }
        h1 { border-bottom: 3px solid #3498db; padding-bottom: 0.5rem; }
        h2 { border-bottom: 2px solid #ecf0f1; padding-bottom: 0.25rem; }
        
        code {
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Monaco', 'Menlo', monospace;
        }
        
        pre {
            background: #2c3e50;
            color: #ecf0f1;
            padding: 1rem;
            border-radius: 5px;
            overflow-x: auto;
        }
        
        pre code { background: none; color: inherit; }
        
        a { color: #3498db; text-decoration: none; }
        a:hover { text-decoration: underline; }
        
        @media (max-width: 768px) {
            body { padding: 1rem; }
            .container { padding: 1rem; }
        }
    `;
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>${defaultCSS}${customCSS}</style>
</head>
<body>
    <div class="container">
        ${content}
    </div>
</body>
</html>`;
    
    return await createMakeSiteURL(html, 'html');
}

/**
 * Create a make-sites URL for API documentation
 * @param {string} apiName - Name of the API
 * @param {Array} endpoints - Array of endpoint objects
 * @returns {Promise<string>} The shareable make-sites URL
 */
async function createAPIDocs(apiName, endpoints) {
    let endpointsHTML = '';
    
    endpoints.forEach(endpoint => {
        const methodColor = {
            'GET': '#28a745',
            'POST': '#007bff', 
            'PUT': '#ffc107',
            'DELETE': '#dc3545',
            'PATCH': '#17a2b8'
        }[endpoint.method] || '#6c757d';
        
        endpointsHTML += `
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method" style="background-color: ${methodColor}">${endpoint.method}</span>
                    <span class="path">${endpoint.path}</span>
                </div>
                <p class="description">${endpoint.description || ''}</p>
                ${endpoint.parameters ? `
                    <h4>Parameters</h4>
                    <ul>${endpoint.parameters.map(p => `<li><code>${p.name}</code> - ${p.description}</li>`).join('')}</ul>
                ` : ''}
                ${endpoint.example ? `
                    <h4>Example Response</h4>
                    <pre><code>${JSON.stringify(endpoint.example, null, 2)}</code></pre>
                ` : ''}
            </div>
        `;
    });
    
    const apiDocsHTML = `
        <h1>📚 ${apiName} API Documentation</h1>
        <p class="api-intro">Complete API reference with examples and usage information.</p>
        ${endpointsHTML}
        <div class="footer">
            <p><em>Generated with make-sites • Share this URL anywhere!</em></p>
        </div>
    `;
    
    const customCSS = `
        .api-intro { font-size: 1.1rem; color: #666; margin-bottom: 2rem; }
        .endpoint { 
            background: #f8f9fa; 
            border: 1px solid #e9ecef;
            border-radius: 8px; 
            padding: 1.5rem; 
            margin: 1.5rem 0; 
        }
        .endpoint-header { display: flex; align-items: center; margin-bottom: 1rem; }
        .method { 
            color: white; 
            padding: 0.25rem 0.75rem; 
            border-radius: 4px; 
            font-size: 0.875rem; 
            font-weight: bold;
            margin-right: 1rem;
        }
        .path { 
            font-family: 'Monaco', 'Menlo', monospace; 
            font-weight: bold; 
            font-size: 1.1rem;
        }
        .description { color: #555; margin: 0.5rem 0; }
        .footer { 
            margin-top: 3rem; 
            padding-top: 2rem; 
            border-top: 1px solid #e9ecef; 
            text-align: center; 
            color: #999; 
        }
    `;
    
    return await createStyledHTMLSite(`${apiName} API Documentation`, apiDocsHTML, customCSS);
}

/**
 * Create a make-sites URL for the current Novus API documentation
 * @returns {Promise<string>} The shareable make-sites URL
 */
async function createNovusAPIDocs() {
    // Read the current Novus API documentation
    const novusContent = `
        <h1>🔗 Novus 360 API Documentation</h1>
        <p><strong>Integration with New York Life Portal for WAEPA</strong></p>
        <p><em>Version: v1.0 | Date: 3/6/2025</em></p>
        
        <h2>📊 Make Integration Guide</h2>
        <p>This API works perfectly with Make's HTTP modules using a simple two-step process:</p>
        
        <div class="integration-flow">
            <div class="step">
                <h3>Step 1: Token Request</h3>
                <div class="endpoint">
                    <span class="method post">POST</span>
                    <span class="path">https://[CLIENT URL]/[API PATH]/WAEPANYL/Token</span>
                </div>
                <p><strong>Headers:</strong> UserName, Password</p>
                <p><strong>Response:</strong> Authentication token (expires in 5 minutes)</p>
            </div>
            
            <div class="step">
                <h3>Step 2: Member Info Request</h3>
                <div class="endpoint">
                    <span class="method post">POST</span>
                    <span class="path">https://[CLIENT URL]/[API PATH]/WAEPANYL/GetMemberInfo</span>
                </div>
                <p><strong>Headers:</strong> UserName, Password, Token (from Step 1)</p>
                <p><strong>Body:</strong> Member identification data</p>
            </div>
        </div>
        
        <h2>🔧 Make Configuration</h2>
        <h3>Module 1: Token Request</h3>
        <ul>
            <li>Method: POST</li>
            <li>Parse response: Yes (automatic JSON parsing)</li>
            <li>Map token to: <code>{{1.token}}</code></li>
        </ul>
        
        <h3>Module 2: Member Info Request</h3>
        <ul>
            <li>Method: POST</li>
            <li>Token header: <code>{{1.token}}</code></li>
            <li>Body: JSON with member data</li>
            <li>Parse response: Yes</li>
        </ul>
        
        <h2>📝 Request Example</h2>
        <pre><code>{
    "MembershipID": "123456",
    "MemberSSN": "123-45-6789", 
    "DateOfBirth": "1999-03-19",
    "FirstName": "Jane",
    "LastName": "Doe"
}</code></pre>
        
        <h2>📋 Response Example</h2>
        <pre><code>[{
    "coveredPersonType": "Member",
    "demographics": {
        "firstName": "Jane",
        "lastName": "Doe",
        "membershipID": "123456",
        "membershipStatus": "ACTIVE",
        "residentialAddress": {
            "streetAddressOrPOBox": "123 Main Street",
            "city": "PLANO", 
            "stateOfProvince": "TX",
            "zipCode": "12345"
        }
    },
    "Products": [...]
}]</code></pre>
        
        <h2>⚠️ Important Notes</h2>
        <ul>
            <li><strong>IP Restriction:</strong> API access is restricted by IP address</li>
            <li><strong>Token Expiry:</strong> Tokens expire after 5 minutes</li>
            <li><strong>Empty Responses:</strong> No records or multiple matches return empty</li>
            <li><strong>Make Advantage:</strong> Automatic JSON parsing eliminates need for parser modules</li>
        </ul>
    `;
    
    const novusCSS = `
        .integration-flow { margin: 2rem 0; }
        .step { 
            background: #f8f9fa; 
            border-left: 4px solid #007bff;
            padding: 1.5rem; 
            margin: 1rem 0; 
            border-radius: 0 8px 8px 0;
        }
        .endpoint { 
            background: white;
            padding: 0.75rem;
            border-radius: 6px;
            margin: 1rem 0;
            display: flex;
            align-items: center;
            border: 1px solid #dee2e6;
        }
        .method { 
            padding: 0.25rem 0.75rem; 
            border-radius: 4px; 
            font-size: 0.875rem; 
            font-weight: bold;
            margin-right: 1rem;
            color: white;
        }
        .method.post { background-color: #007bff; }
        .path { 
            font-family: 'Monaco', 'Menlo', monospace; 
            font-weight: bold;
            color: #495057;
        }
        ul li { margin: 0.5rem 0; }
        pre { font-size: 0.9rem; }
    `;
    
    return await createStyledHTMLSite('Novus API + Make Integration Guide', novusContent, novusCSS);
}

/**
 * Copy a make-sites URL to clipboard and optionally open it
 * @param {string} url - The make-sites URL to copy
 * @param {boolean} autoOpen - Whether to automatically open the URL
 */
async function copyAndOpenMakeSiteURL(url, autoOpen = true) {
    try {
        await navigator.clipboard.writeText(url);
        console.log('✅ URL copied to clipboard!');
        console.log(`🔗 ${url}`);
        
        if (autoOpen) {
            window.open(url, '_blank');
            console.log('🌐 Opened in new tab');
        }
    } catch (error) {
        console.error('❌ Failed to copy URL:', error);
        console.log('🔗 Manual copy:', url);
    }
}

// Example usage functions that you can call directly in Claude Code:

/**
 * Quick demo - creates a simple HTML page and opens it
 */
async function makeDemo() {
    const demoContent = `
        <h1>🚀 make-sites Demo</h1>
        <p>This page was created with Claude Code and exists entirely within the URL!</p>
        
        <h2>Features</h2>
        <ul>
            <li>✅ No server required</li>
            <li>✅ Shareable anywhere</li>
            <li>✅ Works offline</li>
            <li>✅ Mobile responsive</li>
        </ul>
        
        <h2>Code Example</h2>
        <pre><code>// Create a make-sites URL
const url = await createMakeSiteURL(content, 'html');
console.log('Share this:', url);</code></pre>
        
        <p><em>Generated at ${new Date().toLocaleString()}</em></p>
    `;
    
    const url = await createStyledHTMLSite('make-sites Demo', demoContent);
    await copyAndOpenMakeSiteURL(url);
    return url;
}

/**
 * Create and open the Novus API documentation
 */
async function openNovusDocs() {
    const url = await createNovusAPIDocs();
    await copyAndOpenMakeSiteURL(url);
    return url;
}

// Export all functions for easy access
window.makeSitesHelpers = {
    createMakeSiteURL,
    createMakeSiteURLWithStats,
    createStyledHTMLSite,
    createAPIDocs,
    createNovusAPIDocs,
    copyAndOpenMakeSiteURL,
    makeDemo,
    openNovusDocs
};

console.log('🚀 make-sites helpers loaded! Try: makeDemo() or openNovusDocs()');