// Main Chat Application
class GeminiChat {
    constructor() {
        // API Configuration
        this.apiKey = 'ejjfjfjsjehfhhsjwiwirifiiiqieifkfkkwkwjjrjrjwj';
        this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
        
        // Initialize elements
        this.initializeElements();
        
        // Initialize state
        this.currentFile = null;
        this.isVoiceEnabled = true;
        this.isDarkMode = localStorage.getItem('darkMode') === 'true';
        this.isRecording = false;
        this.chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
        
        // Initialize app
        this.initialize();
    }
    
    initializeElements() {
        // Main elements
        this.welcomeScreen = document.getElementById('welcomeScreen');
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.typingIndicator = document.getElementById('typingIndicator');
        
        // Navigation elements
        this.darkModeToggle = document.getElementById('darkModeToggle');
        this.voiceToggle = document.getElementById('voiceToggle');
        
        // Input elements
        this.fileUpload = document.getElementById('fileUpload');
        this.fileInput = document.getElementById('fileInput');
        this.micButton = document.getElementById('micButton');
        this.filePreview = document.getElementById('filePreview');
        this.removeFileBtn = document.getElementById('removeFile');
        
        // Other elements
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.toastContainer = document.getElementById('toastContainer');
    }
    
    initialize() {
        // Set initial theme
        this.setTheme(this.isDarkMode);
        
        // Restore chat history
        this.restoreChatHistory();
        
        // Event listeners
        this.setupEventListeners();
        
        // Auto-resize textarea
        this.setupTextareaResize();
        
        // Initialize voice recognition
        if (window.SpeechRecognition || window.webkitSpeechRecognition) {
            this.initializeSpeechRecognition();
        } else {
            this.isVoiceEnabled = false;
            this.micButton.disabled = true;
            document.body.classList.add('voice-disabled');
        }
        
        console.log('Gemini Chat initialized successfully');
    }
    
    setupEventListeners() {
        // Send message events
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Navigation events
        this.darkModeToggle.addEventListener('click', () => this.toggleDarkMode());
        this.voiceToggle.addEventListener('click', () => this.toggleVoice());
        
        // File handling events
        this.fileUpload.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.removeFileBtn.addEventListener('click', () => this.removeFile());
        
        // Voice recording events
        this.micButton.addEventListener('click', () => this.toggleRecording());
        
        // Suggestion card events
        document.querySelectorAll('.suggestion-card').forEach(card => {
            card.addEventListener('click', () => {
                const prompt = card.getAttribute('data-prompt');
                this.messageInput.value = prompt;
                this.sendMessage();
            });
        });
    }
    
    setupTextareaResize() {
        this.messageInput.addEventListener('input', () => {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 200) + 'px';
        });
    }
    
    initializeSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
        
        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            this.messageInput.value = transcript;
            this.stopRecording();
        };
        
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.showToast('Speech recognition failed. Please try again.', 'error');
            this.stopRecording();
        };
        
        this.recognition.onend = () => {
            this.stopRecording();
        };
    }
    
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message && !this.currentFile) return;
        
        // Hide welcome screen
        this.welcomeScreen.style.display = 'none';
        
        // Create user message
        const userMessage = this.createUserMessage(message, this.currentFile);
        this.addMessageToChat(userMessage);
        
        // Clear input
        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';
        this.removeFile();
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Send to API
            const response = await this.callGeminiAPI(message);
            
            // Hide typing indicator
            this.hideTypingIndicator();
            
            // Create AI response
            const aiMessage = this.createAIMessage(response);
            this.addMessageToChat(aiMessage);
            
            // Save to history
            this.saveChatHistory();
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.hideTypingIndicator();
            this.showToast('Failed to send message. Please try again.', 'error');
        }
    }
    
    async callGeminiAPI(message) {
        const requestBody = {
            contents: [{
                parts: [{
                    text: message
                }]
            }]
        };
        
        const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('Invalid API response format');
        }
    }
    
    createUserMessage(content, file = null) {
        return {
            id: this.generateId(),
            type: 'user',
            content: content,
            file: file,
            timestamp: new Date().toISOString()
        };
    }
    
    createAIMessage(content) {
        return {
            id: this.generateId(),
            type: 'ai',
            content: content,
            timestamp: new Date().toISOString()
        };
    }
    
    addMessageToChat(message) {
        const messageElement = this.createMessageElement(message);
        this.chatMessages.appendChild(messageElement);
        this.scrollToBottom();
        
        // Add to chat history
        this.chatHistory.push(message);
    }
    
    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.type}-message`;
        messageDiv.setAttribute('data-message-id', message.id);
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'message-header';
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = `message-avatar ${message.type}-avatar`;
        
        if (message.type === 'user') {
            avatarDiv.textContent = 'You';
        } else {
            avatarDiv.innerHTML = '<img src="https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg" alt="Gemini">';
        }
        
        const senderSpan = document.createElement('span');
        senderSpan.className = 'message-sender';
        senderSpan.textContent = message.type === 'user' ? 'You' : 'Gemini';
        
        headerDiv.appendChild(avatarDiv);
        headerDiv.appendChild(senderSpan);
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = this.formatMessageContent(message.content);
        
        if (message.file) {
            const fileDiv = document.createElement('div');
            fileDiv.className = 'message-file';
            fileDiv.innerHTML = `
                <i class="fas fa-file"></i>
                <span>${message.file.name}</span>
                <span class="file-size">${this.formatFileSize(message.file.size)}</span>
            `;
            contentDiv.appendChild(fileDiv);
        }
        
        messageDiv.appendChild(headerDiv);
        messageDiv.appendChild(contentDiv);
        
        const actionsDiv = this.createMessageActions(message);
        messageDiv.appendChild(actionsDiv);
        
        return messageDiv;
    }
    
    createMessageActions(message) {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'message-actions';
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'action-btn copy-btn';
        copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
        copyBtn.addEventListener('click', () => this.copyMessage(message.content));
        actionsDiv.appendChild(copyBtn);
        
        if (message.type === 'ai') {
            const shareBtn = document.createElement('button');
            shareBtn.className = 'action-btn share-btn';
            shareBtn.innerHTML = '<i class="fas fa-share"></i> Share';
            shareBtn.addEventListener('click', () => this.shareMessage(message.content));
            actionsDiv.appendChild(shareBtn);
            
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'action-btn download-btn';
            downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download';
            downloadBtn.addEventListener('click', () => this.downloadMessage(message.content));
            actionsDiv.appendChild(downloadBtn);
        }
        
        return actionsDiv;
    }
    
    formatMessageContent(content) {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>')
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    }
    
    showTypingIndicator() {
        this.typingIndicator.style.display = 'flex';
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        this.typingIndicator.style.display = 'none';
    }
    
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        this.setTheme(this.isDarkMode);
        localStorage.setItem('darkMode', this.isDarkMode);
    }
    
    setTheme(isDark) {
        if (isDark) {
            document.body.setAttribute('data-theme', 'dark');
            this.darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            this.darkModeToggle.classList.add('active');
        } else {
            document.body.removeAttribute('data-theme');
            this.darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            this.darkModeToggle.classList.remove('active');
        }
    }
    
    toggleVoice() {
        this.isVoiceEnabled = !this.isVoiceEnabled;
        
        if (this.isVoiceEnabled) {
            this.voiceToggle.classList.add('active');
            this.micButton.disabled = false;
            document.body.classList.remove('voice-disabled');
            this.showToast('Voice input enabled');
        } else {
            this.voiceToggle.classList.remove('active');
            this.micButton.disabled = true;
            document.body.classList.add('voice-disabled');
            if (this.isRecording) this.stopRecording();
            this.showToast('Voice input disabled');
        }
    }
    
    toggleRecording() {
        if (!this.isVoiceEnabled) return;
        
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }
    
    startRecording() {
        if (!this.recognition) return;
        
        try {
            this.recognition.start();
            this.isRecording = true;
            this.micButton.classList.add('recording');
            this.showToast('Listening...');
        } catch (error) {
            console.error('Error starting recording:', error);
            this.showToast('Could not start recording', 'error');
        }
    }
    
    stopRecording() {
        if (this.recognition && this.isRecording) {
            this.recognition.stop();
        }
        this.isRecording = false;
        this.micButton.classList.remove('recording');
    }
    
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (file.size > 10 * 1024 * 1024) {
            this.showToast('File size must be less than 10MB', 'error');
            return;
        }
        
        this.currentFile = {
            name: file.name,
            size: file.size,
            type: file.type,
            file: file
        };
        
        this.showFilePreview();
    }
    
    showFilePreview() {
        if (!this.currentFile) return;
        
        this.filePreview.style.display = 'block';
        this.filePreview.querySelector('.file-name').textContent = this.currentFile.name;
        this.filePreview.querySelector('.file-size').textContent = this.formatFileSize(this.currentFile.size);
    }
    
    removeFile() {
        this.currentFile = null;
        this.filePreview.style.display = 'none';
        this.fileInput.value = '';
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    copyMessage(content) {
        navigator.clipboard.writeText(content).then(() => {
            this.showToast('Message copied to clipboard');
        }).catch(() => {
            this.showToast('Failed to copy message', 'error');
        });
    }
    
    shareMessage(content) {
        if (navigator.share) {
            navigator.share({
                title: 'Gemini Chat Response',
                text: content
            }).then(() => {
                this.showToast('Message shared successfully');
            }).catch(() => {
                this.showToast('Failed to share message', 'error');
            });
        } else {
            this.copyMessage(content);
        }
    }
    
    downloadMessage(content) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gemini-response-${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showToast('Response downloaded');
    }
    
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        this.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    saveChatHistory() {
        localStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));
    }
    
    restoreChatHistory() {
        if (this.chatHistory.length > 0) {
            this.welcomeScreen.style.display = 'none';
            this.chatHistory.forEach(message => {
                const messageElement = this.createMessageElement(message);
                this.chatMessages.appendChild(messageElement);
            });
            this.scrollToBottom();
        }
    }
    
    generateId() {
        return 'msg_' + Math.random().toString(36).substr(2, 9);
    }
}

// Initialize the chat application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.geminiChat = new GeminiChat();
});