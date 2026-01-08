// Speech Recognition and Text-to-Speech Handler
class SpeechHandler {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.isSupported = this.checkSupport();
        this.voices = [];
        
        this.init();
    }
    
    init() {
        if (this.isSupported.recognition) {
            this.setupSpeechRecognition();
        }
        
        if (this.isSupported.synthesis) {
            this.setupTextToSpeech();
        }
        
        console.log('Speech Handler initialized:', this.isSupported);
    }
    
    checkSupport() {
        return {
            recognition: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
            synthesis: !!window.speechSynthesis
        };
    }
    
    setupSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // Configuration
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = this.getPreferredLanguage();
        this.recognition.maxAlternatives = 1;
        
        // Event listeners
        this.recognition.onstart = () => {
            this.isListening = true;
            this.onListeningStart && this.onListeningStart();
            console.log('Speech recognition started');
        };
        
        this.recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
            
            this.onResult && this.onResult({
                final: finalTranscript,
                interim: interimTranscript,
                confidence: event.results[0] ? event.results[0][0].confidence : 0
            });
        };
        
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
            
            let errorMessage = 'Speech recognition failed';
            switch (event.error) {
                case 'no-speech':
                    errorMessage = 'No speech detected. Please try again.';
                    break;
                case 'audio-capture':
                    errorMessage = 'Audio capture failed. Check your microphone.';
                    break;
                case 'not-allowed':
                    errorMessage = 'Microphone access denied. Please enable microphone permissions.';
                    break;
                case 'network':
                    errorMessage = 'Network error occurred during speech recognition.';
                    break;
                case 'language-not-supported':
                    errorMessage = 'Language not supported for speech recognition.';
                    break;
            }
            
            this.onError && this.onError({
                error: event.error,
                message: errorMessage
            });
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
            this.onListeningEnd && this.onListeningEnd();
            console.log('Speech recognition ended');
        };
    }
    
    setupTextToSpeech() {
        // Load voices
        this.loadVoices();
        
        // Voice list can change, so we need to listen for changes
        if (this.synthesis.onvoiceschanged !== undefined) {
            this.synthesis.onvoiceschanged = () => {
                this.loadVoices();
            };
        }
    }
    
    loadVoices() {
        this.voices = this.synthesis.getVoices();
        console.log('Available voices:', this.voices.length);
    }
    
    // Start speech recognition
    startListening(options = {}) {
        if (!this.isSupported.recognition) {
            throw new Error('Speech recognition is not supported in this browser');
        }
        
        if (this.isListening) {
            this.stopListening();
        }
        
        // Apply options
        if (options.language) {
            this.recognition.lang = options.language;
        }
        if (options.continuous !== undefined) {
            this.recognition.continuous = options.continuous;
        }
        if (options.interimResults !== undefined) {
            this.recognition.interimResults = options.interimResults;
        }
        
        try {
            this.recognition.start();
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            throw error;
        }
    }
    
    // Stop speech recognition
    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }
    
    // Get preferred language from browser settings
    getPreferredLanguage() {
        return navigator.language || navigator.userLanguage || 'en-US';
    }
    
    // Check if currently listening
    isCurrentlyListening() {
        return this.isListening;
    }
    
    // Set event handlers
    setEventHandlers(handlers) {
        if (handlers.onListeningStart) this.onListeningStart = handlers.onListeningStart;
        if (handlers.onListeningEnd) this.onListeningEnd = handlers.onListeningEnd;
        if (handlers.onResult) this.onResult = handlers.onResult;
        if (handlers.onError) this.onError = handlers.onError;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpeechHandler;
}

// Make available globally
window.SpeechHandler = SpeechHandler;