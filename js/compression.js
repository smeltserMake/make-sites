/**
 * Modern compression utilities for make-sites
 * Uses Pako library for reliable gzip compression/decompression
 */

class MakeSitesCompression {
    constructor() {
        this.supportsPako = typeof pako !== 'undefined';
        console.log('MakeSitesCompression initialized, Pako available:', this.supportsPako);
    }

    /**
     * Compress content using gzip via Pako
     * @param {string} content - Content to compress
     * @param {string} format - Content format hint ('html', 'markdown', 'json', 'text')
     * @returns {Promise<string>} Base64 encoded compressed data with metadata
     */
    async compress(content, format = 'html') {
        try {
            console.log('Starting compression for', content.length, 'characters');
            
            if (this.supportsPako) {
                // Use Pako for gzip compression
                const compressed = pako.gzip(content);
                const metadata = this._createMetadata(content, compressed, 'gz', format);
                const result = this._encodeWithMetadata(compressed, metadata);
                
                console.log('Compression successful:', {
                    original: content.length,
                    compressed: compressed.length,
                    ratio: metadata.r + '%'
                });
                
                return result;
            }

            // Fallback to no compression
            const encoded = new TextEncoder().encode(content);
            const metadata = this._createMetadata(content, encoded, 'none', format);
            return this._encodeWithMetadata(encoded, metadata);

        } catch (error) {
            console.error('Compression failed:', error);
            throw new Error('Failed to compress content');
        }
    }

    /**
     * Decompress content from base64 encoded data
     * @param {string} encodedData - Base64 encoded compressed data with metadata
     * @returns {Promise<{content: string, metadata: object}>} Decompressed content and metadata
     */
    async decompress(encodedData) {
        try {
            console.log('Starting decompression...');
            const { data, metadata } = this._decodeWithMetadata(encodedData);
            
            console.log('Metadata parsed:', metadata);

            let content;
            
            if (metadata.c === 'gz' || metadata.c === 'gzip') {
                // Handle gzip decompression with Pako
                if (!this.supportsPako) {
                    throw new Error('Pako library not available for gzip decompression');
                }
                
                console.log('Decompressing gzip data with Pako...');
                const decompressed = pako.ungzip(data, { to: 'string' });
                content = decompressed;
                
            } else if (metadata.c === 'br') {
                // Handle Brotli decompression using browser API
                console.log('Decompressing Brotli data...');
                if (!('DecompressionStream' in window)) {
                    throw new Error('Browser does not support DecompressionStream for Brotli');
                }
                
                const stream = new DecompressionStream('deflate-raw');
                const decompressed = await this._streamDecompress(data, stream);
                content = new TextDecoder().decode(decompressed);
                
            } else if (metadata.c === 'none') {
                // No compression - just decode
                console.log('No compression, decoding directly...');
                content = new TextDecoder().decode(data);
                
            } else {
                throw new Error(`Unsupported compression type: ${metadata.c}`);
            }
            
            console.log('Decompression successful, content length:', content.length);
            return { content, metadata };
            
        } catch (error) {
            console.error('Decompression failed:', error);
            throw new Error('Failed to decompress content: ' + error.message);
        }
    }

    /**
     * Stream decompression helper for browser DecompressionStream API
     * @private
     */
    async _streamDecompress(data, decompressionStream) {
        const writer = decompressionStream.writable.getWriter();
        const reader = decompressionStream.readable.getReader();
        
        // Write compressed data
        await writer.write(data);
        await writer.close();
        
        // Read decompressed data
        const chunks = [];
        let done = false;
        
        while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) {
                chunks.push(value);
            }
        }
        
        // Combine chunks
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        
        for (const chunk of chunks) {
            result.set(chunk, offset);
            offset += chunk.length;
        }
        
        return result;
    }

    /**
     * Create metadata object
     * @private
     */
    _createMetadata(original, compressed, compression, format) {
        const originalSize = typeof original === 'string' ? original.length : original.byteLength;
        const compressedSize = compressed.length || compressed.byteLength;
        
        return {
            v: 1, // version
            c: compression, // compression type
            f: format, // format
            os: originalSize, // original size
            cs: compressedSize, // compressed size
            r: Math.round((1 - compressedSize / originalSize) * 100), // compression ratio
            ts: Date.now() // timestamp
        };
    }

    /**
     * Encode data with metadata - Compatible with existing format
     * @private
     */
    _encodeWithMetadata(data, metadata) {
        const metadataStr = JSON.stringify(metadata);
        const metadataBytes = new TextEncoder().encode(metadataStr);
        
        // Create length prefix (4 bytes, little-endian) - matches existing format
        const lengthBytes = new Uint8Array(4);
        const view = new DataView(lengthBytes.buffer);
        view.setUint32(0, metadataBytes.length, true); // true = little-endian
        
        // Combine: [length][metadata][data] - matches existing format
        const combined = new Uint8Array(4 + metadataBytes.length + data.length);
        combined.set(lengthBytes, 0);
        combined.set(metadataBytes, 4);
        combined.set(data, 4 + metadataBytes.length);
        
        return btoa(String.fromCharCode(...combined));
    }

    /**
     * Decode data with metadata - Compatible with existing format
     * @private
     */
    _decodeWithMetadata(encodedData) {
        try {
            // Decode base64 safely
            const binaryStr = atob(encodedData);
            const bytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) {
                bytes[i] = binaryStr.charCodeAt(i);
            }
            
            // Read metadata length (little-endian 32-bit) - matches existing format
            const view = new DataView(bytes.buffer);
            const metadataLength = view.getUint32(0, true); // true = little-endian
            
            // Validate metadata length
            if (metadataLength > bytes.length - 4 || metadataLength < 0) {
                throw new Error('Invalid metadata length: ' + metadataLength);
            }
            
            // Extract metadata and data
            const metadataBytes = bytes.slice(4, 4 + metadataLength);
            const data = bytes.slice(4 + metadataLength);
            
            // Parse metadata safely
            const metadataStr = new TextDecoder().decode(metadataBytes);
            const metadata = JSON.parse(metadataStr);
            
            return { data, metadata };
            
        } catch (error) {
            console.error('Decode error:', error);
            throw new Error('Failed to decode metadata: ' + error.message);
        }
    }

    /**
     * Get compression statistics for display
     * @param {string} original - Original content
     * @param {string} compressed - Compressed data
     * @returns {object} Statistics object
     */
    getStats(original, compressed) {
        const originalSize = new TextEncoder().encode(original).length;
        const compressedSize = atob(compressed).length;
        const ratio = Math.round((1 - compressedSize / originalSize) * 100);
        
        return {
            originalSize,
            compressedSize,
            ratio,
            readable: {
                original: this._formatBytes(originalSize),
                compressed: this._formatBytes(compressedSize),
                saved: this._formatBytes(originalSize - compressedSize)
            }
        };
    }

    /**
     * Format bytes for human readable display
     * @private
     */
    _formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Make available globally
window.MakeSitesCompression = MakeSitesCompression;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MakeSitesCompression;
}