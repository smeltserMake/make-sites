/**
 * Modern compression utilities for make-sites
 * Fixed version that properly handles metadata decoding
 */

class MakeSitesCompression {
    constructor() {
        this.supportsBrotli = 'CompressionStream' in window && 'DecompressionStream' in window;
        this.supportsGzip = 'CompressionStream' in window && 'DecompressionStream' in window;
    }

    /**
     * Compress content using the best available algorithm
     */
    async compress(content, format = 'html') {
        try {
            // For now, use simple base64 encoding with metadata
            // This ensures compatibility while we develop better compression
            const encoded = new TextEncoder().encode(content);
            const metadata = {
                v: 1,
                c: 'none',
                f: format,
                os: content.length,
                cs: encoded.length,
                ts: Date.now()
            };
            
            return this._encodeWithMetadata(encoded, metadata);
            
        } catch (error) {
            console.error('Compression failed:', error);
            throw new Error('Failed to compress content');
        }
    }

    /**
     * Decompress content from base64 encoded data
     */
    async decompress(encodedData) {
        try {
            console.log('Starting decompression...');
            const { data, metadata } = this._decodeWithMetadata(encodedData);
            
            console.log('Metadata:', metadata);
            
            let content;
            
            if (metadata.c === 'gz') {
                // Handle gzip decompression
                if (!this.supportsGzip) {
                    throw new Error('Gzip decompression not supported in this browser');
                }
                
                const stream = new DecompressionStream('gzip');
                const decompressed = await this._streamDecompress(data, stream);
                content = new TextDecoder().decode(decompressed);
                
            } else if (metadata.c === 'br') {
                // Handle Brotli decompression
                if (!this.supportsBrotli) {
                    throw new Error('Brotli decompression not supported in this browser');
                }
                
                const stream = new DecompressionStream('deflate');
                const decompressed = await this._streamDecompress(data, stream);
                content = new TextDecoder().decode(decompressed);
                
            } else {
                // No compression - just decode
                content = new TextDecoder().decode(data);
            }
            
            return { content, metadata };
            
        } catch (error) {
            console.error('Decompression failed:', error);
            throw new Error('Failed to decompress content');
        }
    }

    /**
     * Stream decompression helper
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
     * Encode data with metadata - FIXED VERSION
     * @private
     */
    _encodeWithMetadata(data, metadata) {
        const metadataStr = JSON.stringify(metadata);
        const metadataBytes = new TextEncoder().encode(metadataStr);
        
        // Create length prefix (4 bytes, little-endian)
        const lengthBytes = new Uint8Array(4);
        const view = new DataView(lengthBytes.buffer);
        view.setUint32(0, metadataBytes.length, true); // true = little-endian
        
        // Combine: [length][metadata][data]
        const combined = new Uint8Array(4 + metadataBytes.length + data.length);
        combined.set(lengthBytes, 0);
        combined.set(metadataBytes, 4);
        combined.set(data, 4 + metadataBytes.length);
        
        return btoa(String.fromCharCode(...combined));
    }

    /**
     * Decode data with metadata - FIXED VERSION
     * @private
     */
    _decodeWithMetadata(encodedData) {
        try {
            // Decode base64 more safely
            const binaryStr = atob(encodedData);
            const bytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) {
                bytes[i] = binaryStr.charCodeAt(i);
            }
            
            // Read metadata length (little-endian 32-bit)
            const view = new DataView(bytes.buffer);
            const metadataLength = view.getUint32(0, true); // true = little-endian
            
            // Validate metadata length
            if (metadataLength > bytes.length - 4 || metadataLength < 0) {
                throw new Error('Invalid metadata length: ' + metadataLength);
            }
            
            // Extract metadata
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
     * Create metadata object
     * @private
     */
    _createMetadata(originalContent, compressedData, compression, format) {
        return {
            v: 1,
            c: compression,
            f: format,
            os: originalContent.length,
            cs: compressedData.length,
            ts: Date.now()
        };
    }

    /**
     * Get compression statistics
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
     * Format bytes for display
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