// Message Actions Handler
class MessageActions {
    constructor() {
        this.init();
    }
    
    init() {
        console.log('Message Actions initialized');
    }
    
    // Copy message content to clipboard
    static async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback for older browsers
                return MessageActions.fallbackCopyToClipboard(text);
            }
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            return MessageActions.fallbackCopyToClipboard(text);
        }
    }
    
    // Fallback copy method for older browsers
    static fallbackCopyToClipboard(text) {
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            return successful;
        } catch (error) {
            console.error('Fallback copy failed:', error);
            return false;
        }
    }
    
    // Share message using Web Share API or fallback
    static async shareMessage(content, title = 'Gemini Chat Response') {
        const shareData = {
            title: title,
            text: content,
            url: window.location.href
        };
        
        try {
            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
                return { success: true, method: 'native' };
            } else {
                // Fallback to copy to clipboard
                const copied = await MessageActions.copyToClipboard(content);
                return { 
                    success: copied, 
                    method: 'clipboard',
                    message: copied ? 'Content copied to clipboard for sharing' : 'Failed to copy content'
                };
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                return { success: false, method: 'native', message: 'Share cancelled' };
            } else {
                console.error('Share failed:', error);
                // Try clipboard as fallback
                const copied = await MessageActions.copyToClipboard(content);
                return { 
                    success: copied, 
                    method: 'clipboard',
                    message: copied ? 'Content copied to clipboard for sharing' : 'Share failed'
                };
            }
        }
    }
    
    // Download message as text file
    static downloadAsFile(content, filename = null) {
        try {
            if (!filename) {
                const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
                filename = `gemini-chat-${timestamp}.txt`;
            }
            
            // Create blob with UTF-8 encoding
            const blob = new Blob([content], { 
                type: 'text/plain;charset=utf-8' 
            });
            
            // Create download link
            const url = URL.createObjectURL(blob);
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = filename;
            
            // Trigger download
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            // Clean up
            setTimeout(() => URL.revokeObjectURL(url), 100);
            
            return { success: true, filename: filename };
        } catch (error) {
            console.error('Download failed:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Download conversation as formatted text
    static downloadConversation(messages, filename = null) {
        try {
            if (!filename) {
                const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
                filename = `gemini-conversation-${timestamp}.txt`;
            }
            
            let conversationText = 'Gemini Chat Conversation\n';
            conversationText += '='.repeat(50) + '\n\n';
            
            messages.forEach((message, index) => {
                const timestamp = new Date(message.timestamp).toLocaleString();
                const sender = message.type === 'user' ? 'You' : 'Gemini';
                
                conversationText += `${sender} (${timestamp}):\n`;
                conversationText += '-'.repeat(30) + '\n';
                conversationText += message.content + '\n';
                
                if (message.file) {
                    conversationText += `[File: ${message.file.name}]\n`;
                }
                
                conversationText += '\n';
            });
            
            return MessageActions.downloadAsFile(conversationText, filename);
        } catch (error) {
            console.error('Conversation download failed:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Export conversation as JSON
    static downloadConversationJSON(messages, filename = null) {
        try {
            if (!filename) {
                const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
                filename = `gemini-conversation-${timestamp}.json`;
            }
            
            const exportData = {
                exportDate: new Date().toISOString(),
                messageCount: messages.length,
                messages: messages.map(msg => ({
                    id: msg.id,
                    type: msg.type,
                    content: msg.content,
                    timestamp: msg.timestamp,
                    ...(msg.file && { file: { name: msg.file.name, size: msg.file.size, type: msg.file.type } })
                }))
            };
            
            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            
            const url = URL.createObjectURL(blob);
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = filename;
            
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            setTimeout(() => URL.revokeObjectURL(url), 100);
            
            return { success: true, filename: filename };
        } catch (error) {
            console.error('JSON export failed:', error);
            return { success: false, error: error.message };
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MessageActions;
}

// Make available globally
window.MessageActions = MessageActions;