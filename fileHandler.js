// File Upload and Processing Handler
class FileHandler {
    constructor() {
        this.supportedTypes = {
            images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
            videos: ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'],
            audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac'],
            documents: [
                'text/plain', 'text/markdown', 'text/csv',
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            ]
        };
        
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.maxImageSize = 5 * 1024 * 1024;  // 5MB for images
        
        console.log('File Handler initialized');
    }
    
    // Check if file type is supported
    isSupported(file) {
        const allSupportedTypes = [
            ...this.supportedTypes.images,
            ...this.supportedTypes.videos,
            ...this.supportedTypes.audio,
            ...this.supportedTypes.documents
        ];
        
        return allSupportedTypes.includes(file.type) || 
               this.isTextFile(file.name);
    }
    
    // Check if file is a text file based on extension
    isTextFile(fileName) {
        const textExtensions = ['.txt', '.md', '.csv', '.json', '.js', '.css', '.html', '.xml'];
        return textExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
    }
    
    // Get file category
    getFileCategory(file) {
        if (this.supportedTypes.images.includes(file.type)) return 'image';
        if (this.supportedTypes.videos.includes(file.type)) return 'video';
        if (this.supportedTypes.audio.includes(file.type)) return 'audio';
        if (this.supportedTypes.documents.includes(file.type) || this.isTextFile(file.name)) return 'document';
        return 'unknown';
    }
    
    // Validate file
    validateFile(file) {
        const errors = [];
        
        // Check if file type is supported
        if (!this.isSupported(file)) {
            errors.push(`File type "${file.type}" is not supported`);
        }
        
        // Check file size
        const category = this.getFileCategory(file);
        const maxSize = category === 'image' ? this.maxImageSize : this.maxFileSize;
        
        if (file.size > maxSize) {
            errors.push(`File size exceeds ${this.formatFileSize(maxSize)} limit`);
        }
        
        // Check for empty files
        if (file.size === 0) {
            errors.push('File is empty');
        }
        
        return {
            valid: errors.length === 0,
            errors: errors,
            category: category,
            size: file.size
        };
    }
    
    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Get supported file types as string
    getSupportedTypesString() {
        return [
            'Images: JPEG, PNG, GIF, WebP, SVG',
            'Documents: PDF, Word, Excel, PowerPoint, Text files',
            'Media: MP4, WebM, MP3, WAV',
            'Code: JavaScript, CSS, HTML, JSON, Markdown'
        ].join('\n');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileHandler;
}

// Make available globally
window.FileHandler = FileHandler;