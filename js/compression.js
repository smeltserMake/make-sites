/**
 * Modern compression utilities for make-sites
 * Supports Brotli and gzip with automatic fallback
 */

class MakeSitesCompression {
    constructor() {
        this.supportsBrotli = 'CompressionStream' in window;
        this.supportsGzip = 'CompressionStream' in window;
    }

    /**
     * Compress content using the best available algorithm
     * @param {string} content - Content to compress
     * @param {string} format - Content format hint ('html', 'markdown', 'json', 'text')
     * @returns {Promise<string>} Base64 encoded compressed data with metadata
     */
    async compress(content, format = 'html') {
        try {
            // Try Brotli first (best compression)
            if (this.supportsBrotli) {
                const brotliResult = await this._compressBrotli(content);
                const metadata = this._createMetadata(content, brotliResult, 'br', format);
                return this._encodeWithMetadata(brotliResult, metadata);
            }

            // Fallback to gzip
            if (this.supportsGzip) {
                const gzipResult = await this._compressGzip(content);
                const metadata = this._createMetadata(content, gzipResult, 'gzip', format);
                return this._encodeWithMetadata(gzipResult, metadata);
            }

            // Fallback to base64 only (no compression)
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
            const { data, metadata } = this._decodeWithMetadata(encodedData);

            let content;
            switch (metadata.compression) {
                case 'br':
                    content = await this._decompressBrotli(data);
                    break;
                case 'gzip':
                    content = await this._decompressGzip(data);
                    break;
                case 'none':
                    content = new TextDecoder().decode(data);
                    break;
                default:
                    throw new Error(`Unsupported compression: ${metadata.compression}`);
            }

            return { content, metadata };
        } catch (error) {
            console.error('Decompression failed:', error);
            throw new Error('Failed to decompress content');
        }
    }

    /**
     * Compress using Brotli algorithm
     * @private
     */
    async _compressBrotli(content) {
        const stream = new CompressionStream('deflate-raw');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();

        const encoder = new TextEncoder();
        const chunks = [];

        // Start compression
        const writePromise = writer.write(encoder.encode(content)).then(() => writer.close());
        
        // Read compressed chunks
        const readPromise = (async () => {
            let result;
            while (!(result = await reader.read()).done) {
                chunks.push(result.value);
            }
        })();

        await Promise.all([writePromise, readPromise]);

        // Combine chunks
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const compressed = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
            compressed.set(chunk, offset);
            offset += chunk.length;
        }

        return compressed;
    }

    /**
     * Compress using gzip algorithm
     * @private
     */
    async _compressGzip(content) {
        const stream = new CompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();

        const encoder = new TextEncoder();
        const chunks = [];

        const writePromise = writer.write(encoder.encode(content)).then(() => writer.close());
        
        const readPromise = (async () => {
            let result;
            while (!(result = await reader.read()).done) {
                chunks.push(result.value);
            }
        })();

        await Promise.all([writePromise, readPromise]);

        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const compressed = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
            compressed.set(chunk, offset);
            offset += chunk.length;
        }

        return compressed;
    }

    /**
     * Decompress Brotli data
     * @private
     */
    async _decompressBrotli(data) {
        const stream = new DecompressionStream('deflate-raw');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();

        const chunks = [];

        const writePromise = writer.write(data).then(() => writer.close());
        
        const readPromise = (async () => {
            let result;
            while (!(result = await reader.read()).done) {
                chunks.push(result.value);
            }
        })();

        await Promise.all([writePromise, readPromise]);

        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const decompressed = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
            decompressed.set(chunk, offset);
            offset += chunk.length;
        }

        return new TextDecoder().decode(decompressed);
    }

    /**
     * Decompress gzip data
     * @private
     */
    async _decompressGzip(data) {
        const stream = new DecompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();

        const chunks = [];

        const writePromise = writer.write(data).then(() => writer.close());
        
        const readPromise = (async () => {
            let result;
            while (!(result = await reader.read()).done) {
                chunks.push(result.value);
            }
        })();

        await Promise.all([writePromise, readPromise]);

        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const decompressed = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
            decompressed.set(chunk, offset);
            offset += chunk.length;
        }

        return new TextDecoder().decode(decompressed);
    }

    /**
     * Create metadata object
     * @private
     */
    _createMetadata(original, compressed, compression, format) {
        return {
            v: 1, // version
            c: compression, // compression type
            f: format, // format
            os: original.length, // original size
            cs: compressed.length, // compressed size
            r: Math.round((1 - compressed.length / original.length) * 100), // compression ratio
            ts: Date.now() // timestamp
        };
    }

    /**
     * Encode data with metadata
     * @private
     */
    _encodeWithMetadata(data, metadata) {
        const metadataStr = JSON.stringify(metadata);
        const metadataBytes = new TextEncoder().encode(metadataStr);
        const metadataLength = new Uint8Array(4);
        new DataView(metadataLength.buffer).setUint32(0, metadataBytes.length, true);

        // Combine: [metadata_length(4 bytes)][metadata][compressed_data]
        const combined = new Uint8Array(4 + metadataBytes.length + data.length);
        combined.set(metadataLength, 0);
        combined.set(metadataBytes, 4);
        combined.set(data, 4 + metadataBytes.length);

        return btoa(String.fromCharCode(...combined));
    }

    /**
     * Decode data with metadata
     * @private
     */
    _decodeWithMetadata(encodedData) {
        const combined = new Uint8Array(atob(encodedData).split('').map(c => c.charCodeAt(0)));
        
        const metadataLength = new DataView(combined.buffer).getUint32(0, true);
        const metadataBytes = combined.slice(4, 4 + metadataLength);
        const data = combined.slice(4 + metadataLength);
        
        const metadata = JSON.parse(new TextDecoder().decode(metadataBytes));
        
        return { data, metadata };
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
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
}

// Export for use in other modules
window.MakeSitesCompression = MakeSitesCompression;