# 🚀 make-sites

Modern data URL compression for shareable web content. Create self-contained websites that exist entirely within their URL using advanced compression techniques.

## ✨ Features

- 🗜️ **Advanced Compression** - Brotli + gzip fallback for maximum compression
- 📱 **Mobile Responsive** - Beautiful design that works on all devices  
- 🔒 **No Server Storage** - Everything exists within the URL
- ⚡ **Fast Loading** - Optimized rendering and decompression
- 🎨 **Professional Styling** - Clean, modern interface
- 📊 **Multiple Formats** - HTML, Markdown, JSON, and plain text support
- 🔧 **Developer Friendly** - Easy integration with Claude Code and other tools

## 🚀 Quick Start

### Viewing Content

Simply add your compressed data to the URL fragment:
```
https://smeltserMake.github.io/make-sites#<compressed_data>
```

### Creating Content

1. **Use the Compression Tool**: Visit [compress.html](https://smeltserMake.github.io/make-sites/compress.html)
2. **Use Claude Code**: See [Claude Code Integration](#claude-code-integration) below
3. **Use the JavaScript API**: See [API Usage](#api-usage) below

## 📊 Supported Formats

| Format | Description | Features |
|--------|-------------|----------|
| **HTML** | Rich web pages | Styling, interactivity, responsive design |
| **Markdown** | Formatted text | Auto TOC, syntax highlighting, responsive |
| **JSON** | Structured data | Syntax highlighting, statistics, mobile-friendly |
| **Text** | Plain content | Statistics, formatting, responsive display |

## 💻 Claude Code Integration

Create a helper function in your Claude Code workspace:

### Basic Helper Function

```javascript
// Add this to your workspace for easy make-sites URL generation
async function createMakeSiteURL(content, format = 'html') {
    // Load compression utility
    const script = document.createElement('script');
    script.src = 'https://smeltserMake.github.io/make-sites/js/compression.js';
    await new Promise(resolve => { script.onload = resolve; document.head.appendChild(script); });
    
    // Compress content
    const compression = new MakeSitesCompression();
    const compressed = await compression.compress(content, format);
    
    // Generate URL
    const baseUrl = 'https://smeltserMake.github.io/make-sites#';
    return baseUrl + compressed;
}

// Usage examples:
// const htmlUrl = await createMakeSiteURL('<h1>Hello World</h1>', 'html');
// const markdownUrl = await createMakeSiteURL('# My Document\n\nContent here', 'markdown');
```

### Advanced Helper with Statistics

```javascript
async function createMakeSiteURLWithStats(content, format = 'html') {
    const script = document.createElement('script');
    script.src = 'https://smeltserMake.github.io/make-sites/js/compression.js';
    await new Promise(resolve => { script.onload = resolve; document.head.appendChild(script); });
    
    const compression = new MakeSitesCompression();
    const compressed = await compression.compress(content, format);
    const stats = compression.getStats(content, compressed);
    
    const url = 'https://smeltserMake.github.io/make-sites#' + compressed;
    
    console.log('📊 Compression Stats:');
    console.log(`   Original: ${stats.readable.original}`);
    console.log(`   Compressed: ${stats.readable.compressed}`);
    console.log(`   Saved: ${stats.readable.saved} (${stats.ratio}%)`);
    console.log(`🔗 URL: ${url}`);
    
    return { url, stats };
}
```

## 🔧 API Usage

### JavaScript API

```javascript
// Load the compression library
import { MakeSitesCompression } from './js/compression.js';

const compression = new MakeSitesCompression();

// Compress content
const compressed = await compression.compress(content, 'html');
const url = `https://smeltserMake.github.io/make-sites#${compressed}`;

// Get compression statistics
const stats = compression.getStats(content, compressed);
console.log(`Saved ${stats.ratio}% space!`);
```

### Node.js Usage

```javascript
// For server-side usage, you can create a simplified version:
const zlib = require('zlib');
const util = require('util');

const compress = util.promisify(zlib.brotliCompress);

async function createMakeSiteURL(content, format = 'html') {
    const compressed = await compress(Buffer.from(content));
    const base64 = compressed.toString('base64');
    
    // Create metadata (simplified)
    const metadata = {
        v: 1,
        c: 'br',
        f: format,
        os: content.length,
        cs: compressed.length,
        ts: Date.now()
    };
    
    const metadataStr = JSON.stringify(metadata);
    const combined = Buffer.concat([
        Buffer.from(new Uint32Array([metadataStr.length])),
        Buffer.from(metadataStr),
        compressed
    ]);
    
    return `https://smeltserMake.github.io/make-sites#${combined.toString('base64')}`;
}
```

## 🎯 Use Cases

### API Documentation
Perfect for creating shareable API documentation that doesn't require hosting:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My API Docs</title>
    <style>/* your styles */</style>
</head>
<body>
    <h1>API Documentation</h1>
    <!-- Your content -->
</body>
</html>
```

### Markdown Documents
Great for technical documentation, guides, and formatted text:

```markdown
# My Guide

## Overview
This is a comprehensive guide...

## Examples
```javascript
// Code examples
```

### JSON Data Visualization
Display structured data beautifully:

```json
{
    "data": {
        "users": [...],
        "analytics": {...}
    }
}
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + I` | Toggle metadata info |
| `Ctrl/Cmd + R` | Reload content |

## 🔧 Development

### Local Development

```bash
# Clone the repository
git clone https://github.com/smeltserMake/make-sites.git
cd make-sites

# Serve locally (Python 3)
python -m http.server 8000

# Or with Node.js
npx serve .

# Visit http://localhost:8000
```

### File Structure

```
make-sites/
├── index.html          # Main viewer
├── compress.html       # Compression tool
├── css/
│   └── styles.css      # Responsive styling
├── js/
│   ├── compression.js  # Compression utilities
│   ├── rendering.js    # Content rendering
│   └── viewer.js       # Main viewer logic
└── .github/workflows/
    └── deploy.yml      # Auto-deployment
```

## 🌐 Browser Support

- **Modern browsers** with ES2020 support
- **Compression**: Brotli (all modern browsers) with gzip fallback
- **Mobile**: Full responsive support
- **Offline**: Works once loaded (service worker planned)

## 🔒 Security

- **XSS Protection**: Script tags and dangerous attributes are sanitized
- **No Server Storage**: Content never leaves your browser
- **HTTPS Only**: Secure transmission
- **No Tracking**: No analytics or data collection

## 📈 Performance

- **Compression Ratio**: 60-90% size reduction typical
- **Loading Speed**: Instant rendering after decompression
- **Mobile Optimized**: Responsive design and touch-friendly
- **Caching**: Aggressive browser caching for assets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🆚 Comparison with itty.bitty

| Feature | make-sites | itty.bitty |
|---------|------------|------------|
| Compression | Brotli + gzip | LZMA only |
| Size Limits | ~10KB+ (browser dependent) | ~2-4KB typical |
| Content Types | HTML, MD, JSON, Text | HTML only |
| Mobile Support | ✅ Full responsive | ❌ Limited |
| Maintenance | ✅ Active | ❌ Stale (2+ years) |
| Browser APIs | ✅ Modern (2024) | ❌ Legacy |
| Developer Tools | ✅ Full toolkit | ❌ Basic |

## 🙏 Acknowledgments

- Inspired by Nicholas Jitkoff's [itty.bitty](https://github.com/alcor/itty-bitty)
- Built for the modern web with Claude Code integration
- Powered by modern browser compression APIs

---

**Made with ❤️ for sharing content anywhere**# Trigger deployment
