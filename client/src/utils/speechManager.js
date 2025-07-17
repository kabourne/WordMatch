/**
 * Speech synthesis module for WordMatch
 * Handles text-to-speech functionality for word pronunciation and spelling
 * Based on the WordMaster implementation pattern
 */

// Configuration constants
const SPEECH_CONFIG = {
    RATES: {
        NORMAL: 1.0,
        SLOW: 0.8,
        SPELLING: 1.1,
        POS: 0.7,
        CHINESE: 1.0,
        ENGLISH: 1.0
    },
    PITCH: {
        NORMAL: 1.0,
        SPELLING: 1.1
    },
    PAUSES: {
        BETWEEN_LETTERS: 300,
        AFTER_WORD: 500
    },
    LANGUAGES: {
        ENGLISH: 'en-US',
        CHINESE: 'zh-CN'
    }
};

// Part of speech translation mapping
const POS_TRANSLATIONS = {
    'aux v.': '助动词',
    'vi.': '不及物动词',
    'vt.': '及物动词',
    'adj.': '形容词',
    'adv.': '副词',
    'prep.': '介词',
    'conj.': '连词',
    'pron.': '代词',
    'interj.': '感叹词',
    'det.': '限定词',
    'num.': '数词',
    'art.': '冠词',
    'aux.': '助动词',
    'abbr.': '缩写',
    'pl.': '复数',
    'sing.': '单数',
    'inf.': '不定式',
    'n.': '名词',
    'v.': '动词'
};

// Text processing utilities
class TextProcessor {
    /**
     * Preprocess text for speech synthesis, handling special characters
     */
    static preprocess(text) {
        if (!text) return text;
        
        if (/[a-zA-Z]/.test(text)) {
            // Handle English abbreviations
            return text
                .replace(/sb\./g, "somebody")
                .replace(/sth\./g, "something");
        } else {
            // Handle Chinese text (replace ellipses)
            return text.replace(/…/g, "什么");
        }
    }

    /**
     * Split meaning into language segments for proper pronunciation
     */
    static splitMeaningSegments(meaning) {
        const regex = /([\u4e00-\u9fa5\d\s、，。,.]+|[^\u4e00-\u9fa5\d\s、，。,.]+)/g;
        return meaning.match(regex).filter(seg => seg.trim() !== '');
    }

    /**
     * Clean segment by removing punctuation while preserving meaningful content
     */
    static cleanSegment(segment) {
        return segment.replace(/[、，。,.!?:;；（）\-()\[\]{}'"""''【】《》·]/g, '');
    }

    /**
     * Check if segment contains only punctuation
     */
    static isPunctuationOnly(segment) {
        return /^[\s、，。,.!?:;\-()\[\]{}'"""''【】《》·]+$/.test(segment);
    }

    /**
     * Determine language and rate for a text segment
     */
    static getLanguageAndRate(segment) {
        const isChineseDigitConnector = /^[\u4e00-\u9fa5\d\s、，。,.]+$/.test(segment);
        
        if (isChineseDigitConnector) {
            return { lang: SPEECH_CONFIG.LANGUAGES.CHINESE, rate: SPEECH_CONFIG.RATES.CHINESE };
        }
        
        const hasChinese = /[\u4e00-\u9fa5]/.test(segment);
        const hasLatin = /[a-zA-Z]/.test(segment);
        const isDigits = /^[0-9\s.,:;!\-()\[\]{}'"""''、，。；：！？（）【】《》·]*$/.test(segment);
        
        if (hasChinese || (!hasLatin && isDigits)) {
            return { lang: SPEECH_CONFIG.LANGUAGES.CHINESE, rate: SPEECH_CONFIG.RATES.CHINESE };
        } else {
            return { lang: SPEECH_CONFIG.LANGUAGES.ENGLISH, rate: SPEECH_CONFIG.RATES.ENGLISH };
        }
    }
}

// Part of speech utilities
class POSProcessor {
    /**
     * Convert POS abbreviations to full form in Chinese
     */
    static translateToFullForm(pos) {
        if (!pos) return pos;
        
        // Handle compound parts of speech like "vi&vt"
        if (pos.includes('&')) {
            const parts = pos.split('&');
            return parts.map(p => POSProcessor.translateToFullForm(p.trim())).join('且');
        }
        
        // Sort keys by length descending to avoid partial matches
        const sortedAbbrs = Object.keys(POS_TRANSLATIONS).sort((a, b) => b.length - a.length);
        
        for (const abbr of sortedAbbrs) {
            if (pos.includes(abbr)) {
                return pos.replace(abbr, POS_TRANSLATIONS[abbr]);
            }
        }
        
        return pos;
    }
}

// Speech Queue - Manages the queue data structure
class SpeechQueue {
    constructor(maxSize = 100) {
        this._items = [];
        this._maxSize = maxSize;
        this._consumer = null;
        this._processing = false;
    }

    setConsumer(speechConsumer) {
        this._consumer = speechConsumer;
    }

    enqueue(item) {
        // Increase capacity for simple text items and pause items
        if (this.size() >= this._maxSize) {
            if (item.text && item.text.length === 1) {
                // For single letter items (like spelling), we can still add
                console.warn('Speech queue near capacity, but allowing single letter:', item.text);
            } else if (item.isPause) {
                // For pause items, we can adjust the duration instead of rejecting
                console.warn('Speech queue near capacity, but allowing pause item');
            } else {
                console.warn('Speech queue is full, item not added:', item);
                // If there's a callback, call it immediately to prevent blocking
                if (item.onEnd) item.onEnd();
                return false;
            }
        }
        
        this._items.push(item);
        
        // Notify consumer that a new item is available
        if (this._consumer && this._items.length === 1 && !this._processing) {
            this._processing = true;
            this._consumer.startConsuming();
        }
        
        return true;
    }

    dequeue() {
        if (this.isEmpty()) {
            this._processing = false;
            return null;
        }
        return this._items.shift();
    }

    isEmpty() {
        return this._items.length === 0;
    }

    isFull() {
        return this._items.length >= this._maxSize;
    }

    size() {
        return this._items.length;
    }

    clear() {
        this._items = [];
        this._processing = false;
        return true;
    }
}

// Speech Producer - Responsible for creating speech items and adding them to the queue
class SpeechProducer {
    constructor(queue, speechSynthesizer) {
        this._queue = queue;
        this._speechSynthesizer = speechSynthesizer;
    }
    
    /**
     * Add speech item to the queue
     */
    produce(text, lang = SPEECH_CONFIG.LANGUAGES.ENGLISH, rate = SPEECH_CONFIG.RATES.NORMAL, pitch = SPEECH_CONFIG.PITCH.NORMAL, onEnd = null) {
        if (!text || !this._speechSynthesizer.isAvailable()) {
            console.warn('Cannot produce speech: missing text or speech synthesis not available');
            if (onEnd) onEnd();
            return false;
        }
        
        // Create speech item
        const speechItem = {
            text,
            lang,
            rate,
            pitch,
            onEnd
        };
        
        // Add to queue
        return this._queue.enqueue(speechItem);
    }

    /**
     * Add a pause item to the queue
     */
    producePause(duration, onEnd = null) {
        if (!this._speechSynthesizer.isAvailable()) {
            if (onEnd) onEnd();
            return false;
        }
        
        const pauseItem = {
            isPause: true,
            duration,
            onEnd
        };
        
        // Add to queue
        return this._queue.enqueue(pauseItem);
    }
}

// Speech Consumer - Responsible for taking items from the queue and executing them
class SpeechConsumer {
    constructor(queue, speechSynthesizer) {
        this._queue = queue;
        this._speechSynthesizer = speechSynthesizer;
        this.isProcessing = false;
        this.isSpeaking = false;
        this._processingTimeout = null;
    }
    
    startConsuming() {
        // If already processing an item, don't start another
        if (this.isProcessing || this._queue.isEmpty()) {
            return;
        }
        
        this.isProcessing = true;
        const item = this._queue.dequeue();
        
        if (!item) {
            this.isProcessing = false;
            return;
        }
        
        // Handle pause items
        if (item.isPause) {
            // Clear any existing timeout to prevent memory leaks
            if (this._processingTimeout) {
                clearTimeout(this._processingTimeout);
            }
            
            this._processingTimeout = setTimeout(() => {
                this._processingTimeout = null;
                this.isProcessing = false;
                
                // Call original callback if provided
                if (item.onEnd) item.onEnd();
                
                // Continue with next item if queue is not empty
                if (!this._queue.isEmpty()) {
                    // Short delay to prevent stack overflow with recursive calls
                    setTimeout(() => this.startConsuming(), 0);
                }
            }, item.duration);
            
            return;
        }
        
        // Ensure the item has text content
        if (!item.text || item.text.trim() === '') {
            console.log('Empty text item, skipping', item);
            this.isProcessing = false;
            if (item.onEnd) item.onEnd();
            
            // Continue with next item
            if (!this._queue.isEmpty()) {
                // Short delay to prevent stack overflow with recursive calls
                setTimeout(() => this.startConsuming(), 0);
            }
            return;
        }
        
        // Create a wrapper for the onend callback
        const onEndWrapper = () => {
            this.isSpeaking = false;
            this.isProcessing = false;
            
            // Clear any timeout
            if (this._processingTimeout) {
                clearTimeout(this._processingTimeout);
                this._processingTimeout = null;
            }
            
            // Call original callback if provided
            if (item.onEnd) item.onEnd();
            
            // Continue with next item if queue is not empty
            if (!this._queue.isEmpty()) {
                // Short delay to prevent stack overflow with recursive calls
                setTimeout(() => this.startConsuming(), 0);
            }
        };
        
        // Create error handler
        const errorHandler = (event) => {
            console.error('Speech synthesis error:', event);
            
            this.isSpeaking = false;
            this.isProcessing = false;
            
            // Clear any timeout
            if (this._processingTimeout) {
                clearTimeout(this._processingTimeout);
                this._processingTimeout = null;
            }
            
            // Call original callback if provided
            if (item.onEnd) item.onEnd();
            
            // Continue with next item despite error
            if (!this._queue.isEmpty()) {
                // Short delay to prevent stack overflow with recursive calls
                setTimeout(() => this.startConsuming(), 0);
            }
        };
        
        // Set safety timeout in case speech synthesis fails to call onend
        this._processingTimeout = setTimeout(() => {
            console.warn('Speech synthesis timeout - forcing completion', item);
            this._processingTimeout = null;
            
            if (this.isSpeaking) {
                this._speechSynthesizer.cancel();
                this.isSpeaking = false;
            }
            
            this.isProcessing = false;
            if (item.onEnd) item.onEnd();
            
            // Continue with next item
            if (!this._queue.isEmpty()) {
                setTimeout(() => this.startConsuming(), 0);
            }
        }, 5000); // 5-second safety timeout
        
        // Speak the current item
        this.isSpeaking = true;
        
        try {
            const utterance = this._speechSynthesizer.createUtterance(
                item.text, 
                item.lang, 
                item.rate, 
                item.pitch, 
                onEndWrapper, 
                errorHandler
            );
            
            this._speechSynthesizer.cancel(); // Cancel any ongoing speech
            this._speechSynthesizer.speak(utterance);
        } catch (error) {
            console.error('Failed to start speech synthesis:', error);
            this.isSpeaking = false;
            this.isProcessing = false;
            
            // Clear the timeout
            if (this._processingTimeout) {
                clearTimeout(this._processingTimeout);
                this._processingTimeout = null;
            }
            
            if (item.onEnd) item.onEnd();
            
            // Try next item despite error
            if (!this._queue.isEmpty()) {
                setTimeout(() => this.startConsuming(), 0);
            }
        }
    }
    
    stopConsuming() {
        this._speechSynthesizer.cancel();
        this.isSpeaking = false;
        this.isProcessing = false;
        
        // Clear any existing timeout
        if (this._processingTimeout) {
            clearTimeout(this._processingTimeout);
            this._processingTimeout = null;
        }
    }
}

// Core speech synthesis functionality
class SpeechSynthesizer {
    constructor() {
        this.speechSynth = null;
        this.isSupported = false;
        this.voices = [];
        this.lastUtterance = null;
        this.init();
    }

    /**
     * Initialize speech synthesis
     */
    init() {
        try {
            this.speechSynth = window.speechSynthesis;
            this.isSupported = !!this.speechSynth;
            
            if (this.isSupported) {
                console.log('Speech synthesis initialized successfully');
                
                // Detect browser for specific compatibility fixes
                const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                
                // Load voices if available
                if (this.speechSynth.getVoices) {
                    this.voices = this.speechSynth.getVoices();
                    
                    // Set up event to load voices when they become available
                    if ('onvoiceschanged' in this.speechSynth) {
                        this.speechSynth.onvoiceschanged = () => {
                            this.voices = this.speechSynth.getVoices();
                        };
                    }
                }
                
                // Fix for Chrome bug with speech synthesis getting stuck
                if (window.chrome) {
                    setInterval(() => {
                        // If speech synthesis is paused but we're not intending it to be, resume it
                        if (this.speechSynth && this.speechSynth.paused) {
                            console.log('Chrome speech synthesis bug detected - resuming speech');
                            this.speechSynth.resume();
                        }
                    }, 1000);
                }
                
                // Fix for Safari/iOS which has known issues with speech synthesis
                if (isSafari || isIOS) {
                    console.log('Safari/iOS detected - applying speech synthesis workarounds');
                    
                    // Regularly check if speech synthesis is working
                    setInterval(() => {
                        // If speaking but no audio coming out
                        if (this.speechSynth && this.speechSynth.speaking && !this.speechSynth.paused) {
                            // Try to pause and immediately resume
                            try {
                                this.speechSynth.pause();
                                setTimeout(() => {
                                    if (this.speechSynth.paused) {
                                        this.speechSynth.resume();
                                    }
                                }, 50);
                            } catch (e) {
                                console.warn('Safari/iOS speech fix attempt failed:', e);
                            }
                        }
                    }, 2000);
                }
            } else {
                console.warn('Speech synthesis not supported in this browser');
            }
        } catch (error) {
            console.error('Failed to initialize speech synthesis:', error);
            this.isSupported = false;
        }
    }

    /**
     * Check if speech synthesis is available
     */
    isAvailable() {
        return this.isSupported && this.speechSynth !== null;
    }

    /**
     * Cancel current speech
     */
    cancel() {
        if (this.isAvailable()) {
            try {
                this.speechSynth.cancel();
                this.lastUtterance = null;
            } catch (e) {
                console.error('Error cancelling speech:', e);
            }
        }
    }
    
    /**
     * Speak an utterance
     */
    speak(utterance) {
        if (!this.isAvailable()) return;
        
        try {
            this.lastUtterance = utterance;
            
            // For Chrome - ensure speech synthesis is resumed
            if (window.chrome && this.speechSynth.paused) {
                this.speechSynth.resume();
            }
            
            this.speechSynth.speak(utterance);
        } catch (e) {
            console.error('Error speaking utterance:', e);
            
            // Attempt to recover
            if (utterance.onend) {
                utterance.onend();
            }
        }
    }

    /**
     * Create and configure a speech utterance
     */
    createUtterance(text, lang, rate, pitch, onEnd, onError) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = Math.min(rate, 1.5); // Cap the rate to avoid browser issues
        utterance.pitch = pitch;
        
        if (onEnd) {
            utterance.onend = onEnd;
        }
        
        // Add error event listener
        if (onError) {
            utterance.onerror = onError;
        } else {
            // Default error handler
            utterance.onerror = (event) => {
                console.error('Speech synthesis error:', event);
                
                // Don't call onEnd for 'canceled' errors in Chrome as it could be from our own cancel() calls
                if (event.error === 'canceled' && window.chrome && this.lastUtterance !== utterance) {
                    console.log('Ignoring canceled error for utterance that is not the last one');
                    return;
                }
                
                // Handle 'interrupted' errors - this is often due to multiple speech requests
                // For interrupted speech, we should invoke the onEnd callback to keep the flow going
                if (event.error === 'interrupted') {
                    console.log('Speech was interrupted, continuing with next item');
                    if (onEnd) onEnd();
                    return;
                }
                
                // Call onEnd callback to continue with next item in queue
                if (onEnd) onEnd();
            };
        }
        
        return utterance;
    }
}

// Speech Sequencer - Handles complex speech sequences
class SpeechSequencer {
    constructor(speechProducer) {
        this._producer = speechProducer;
    }
    
    /**
     * Spell out a word letter by letter or by syllables
     * @param {string} word - The word to spell
     * @param {function} onComplete - Callback when spelling is complete
     * @param {string} syllableBreaks - Optional syllable breaks (e.g. "bal·let")
     */
    spellWord(word, onComplete = null, syllableBreaks = null) {
        if (!word) {
            if (onComplete) onComplete();
            return;
        }
        
        // Add short pause before spelling
        this._producer.producePause(SPEECH_CONFIG.PAUSES.AFTER_WORD);
        
        // Filter out only alphabetic characters to reduce queue load
        const letters = word.split('').filter(letter => /[a-zA-Z]/.test(letter));
        
        if (letters.length === 0) {
            if (onComplete) onComplete();
            return;
        }
        // Spell out each letter
        letters.forEach((letter, index) => {
            // Use slightly different pitch for each letter to make it more natural
            const randomPitch = SPEECH_CONFIG.PITCH.SPELLING + (Math.random() * 0.2 - 0.1);
            
            // For the last letter, provide completion callback
            const isLast = index === letters.length - 1;
            const letterCallback = isLast ? onComplete : null;
            
            this._producer.produce(
                letter, 
                SPEECH_CONFIG.LANGUAGES.ENGLISH, 
                SPEECH_CONFIG.RATES.SPELLING,
                randomPitch,
                letterCallback
            );
            
            // Add pause between letters (except after the last one)
            if (!isLast) {
                this._producer.producePause(SPEECH_CONFIG.PAUSES.BETWEEN_LETTERS);
            }
        });
    }
    
    /**
     * Speak meaning segments with proper language detection and pronunciation
     */
    speakMeaningSegments(segments, segmentIndex, onComplete) {
        let lastValidSegmentIndex = -1;
        
        // Queue all valid segments
        for (let i = segmentIndex; i < segments.length; i++) {
            const segment = segments[i].trim();
            
            if (!segment || TextProcessor.isPunctuationOnly(segment)) {
                continue;
            }
            
            const cleanedSegment = TextProcessor.cleanSegment(segment);
            if (!cleanedSegment.trim()) {
                continue;
            }
            
            const { lang, rate } = TextProcessor.getLanguageAndRate(segment);
            
            // Only set callback on the last valid segment
            const isLastSegment = i === segments.length - 1;
            lastValidSegmentIndex = i;
            
            // Add to speech queue without callback
            if (!isLastSegment) {
                this._producer.produce(cleanedSegment, lang, rate, SPEECH_CONFIG.PITCH.NORMAL);
            } else {
                // Only add callback to the last segment
                this._producer.produce(cleanedSegment, lang, rate, SPEECH_CONFIG.PITCH.NORMAL, onComplete);
            }
        }
        
        // If no valid segments were found, call onComplete directly
        if (lastValidSegmentIndex === -1 && onComplete) {
            onComplete();
        }
    }
    
    /**
     * Play explanation with part of speech handling
     */
    playExplanationWithPOS(explanation, onComplete) {
        if (explanation.pos && explanation.pos.trim() !== '') {
            const fullPos = POSProcessor.translateToFullForm(explanation.pos);
            this._producer.produce(fullPos, SPEECH_CONFIG.LANGUAGES.CHINESE, SPEECH_CONFIG.RATES.POS, SPEECH_CONFIG.PITCH.NORMAL);
            this.playMeaning(explanation.meaning, onComplete);
        } else {
            this.playMeaning(explanation.meaning, onComplete);
        }
    }
    
    /**
     * Play meaning with proper language segmentation
     */
    playMeaning(meaning, onComplete) {
        const processedMeaning = TextProcessor.preprocess(meaning);
        const segments = TextProcessor.splitMeaningSegments(processedMeaning);
        this.speakMeaningSegments(segments, 0, onComplete);
    }
}

// Main SpeechManager module (singleton)
const SpeechManager = (() => {
    let isInitialized = false;
    let speechSynthesizer = new SpeechSynthesizer();
    let speechQueue = new SpeechQueue(100);
    let speechProducer;
    let speechConsumer;
    let speechSequencer;
    let voiceSpeed = 1.0;
    
    /**
     * Initialize the speech manager
     */
    function init() {
        if (isInitialized) {
            return;
        }
        
        try {
            speechConsumer = new SpeechConsumer(speechQueue, speechSynthesizer);
            speechQueue.setConsumer(speechConsumer);
            speechProducer = new SpeechProducer(speechQueue, speechSynthesizer);
            speechSequencer = new SpeechSequencer(speechProducer);
            isInitialized = true;
            
            console.log('SpeechManager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize SpeechManager', error);
        }
    }
    
    /**
     * Set the voice speed for all speech
     */
    function setVoiceSpeed(speed) {
        if (typeof speed === 'number' && speed > 0) {
            voiceSpeed = speed;
        }
    }
    
    /**
     * Queue speech synthesis
     */
    function queueSpeech(text, lang = SPEECH_CONFIG.LANGUAGES.ENGLISH, rate = SPEECH_CONFIG.RATES.NORMAL, onComplete = null) {
        if (!isInitialized) {
            init();
        }
        
        // Apply voice speed
        const adjustedRate = rate * voiceSpeed;
        
        // Skip empty text to avoid wasting queue slots
        if (!text || text.trim() === '') {
            if (onComplete) setTimeout(onComplete, 10);
            return true;
        }
        
        return speechProducer.produce(text, lang, adjustedRate, SPEECH_CONFIG.PITCH.NORMAL, onComplete);
    }
    
    /**
     * Play the pronunciation of a word, followed by spelling
     * @param {string|object} word - The word to pronounce and spell, can be a string or an object
     * @param {function} onComplete - Callback when sequence is complete
     */
    function playWordWithSpelling(word, onComplete = null) {
        if (!isInitialized) {
            init();
        }
        
        if (!word) {
            if (onComplete) onComplete();
            return;
        }
        
        // Clear previous speech
        stopSpeech();
        
        // Extract word and syllable information
        let wordText, syllableBreaks;
        
        if (typeof word === 'object') {
            wordText = word.english || word.word;
            syllableBreaks = word.syllable_breaks || word.phonetic;
        } else {
            wordText = word;
            syllableBreaks = null;
        }
        
        if (!wordText) {
            if (onComplete) onComplete();
            return;
        }
        
        // For very short words, we can simplify the sequence
        if (wordText.length <= 3) {
            // Just pronounce the word and don't spell it
            return queueSpeech(wordText, SPEECH_CONFIG.LANGUAGES.ENGLISH, SPEECH_CONFIG.RATES.NORMAL, onComplete);
        }
        
        // Step 1: Queue word pronunciation
        queueSpeech(wordText, SPEECH_CONFIG.LANGUAGES.ENGLISH, SPEECH_CONFIG.RATES.NORMAL);
        
        // Step 2: Queue word spelling for longer words
        speechSequencer.spellWord(wordText, onComplete, syllableBreaks);
    }
    
    /**
     * Play a meaning (explanation)
     * @param {string|object} explanation - The meaning to speak, either a string or object with pos and meaning
     * @param {function} onComplete - Callback when meaning is complete
     */
    function playMeaning(explanation, onComplete = null) {
        if (!isInitialized) {
            init();
        }
        
        if (!explanation) {
            console.log("Empty meaning provided to playMeaning");
            if (onComplete) {
                setTimeout(onComplete, 10);
            }
            return;
        }
        
        console.log("Playing meaning:", typeof explanation === 'object' ? explanation.meaning : explanation);
        
        try {
            // Stop any ongoing speech
            stopSpeech();
            
            // Check if meaning is an object with pos and meaning properties
            if (typeof explanation === 'object' && explanation.pos !== undefined && explanation.meaning !== undefined) {
                // Play with part of speech handling
                const fullPos = POSProcessor.translateToFullForm(explanation.pos);
                
                // Only speak the POS if it's valid
                if (fullPos && fullPos.trim() !== '') {
                    queueSpeech(fullPos, SPEECH_CONFIG.LANGUAGES.CHINESE, SPEECH_CONFIG.RATES.POS);
                }
                
                // Process and segment the meaning text
                const processedMeaning = TextProcessor.preprocess(explanation.meaning);
                const segments = TextProcessor.splitMeaningSegments(processedMeaning);
                
                // Speak each segment with proper language detection
                let lastSegmentIndex = -1;
                
                for (let i = 0; i < segments.length; i++) {
                    const segment = segments[i].trim();
                    
                    if (!segment || TextProcessor.isPunctuationOnly(segment)) {
                        continue;
                    }
                    
                    const cleanedSegment = TextProcessor.cleanSegment(segment);
                    if (!cleanedSegment.trim()) {
                        continue;
                    }
                    
                    const { lang, rate } = TextProcessor.getLanguageAndRate(segment);
                    const isLastSegment = i === segments.length - 1;
                    lastSegmentIndex = i;
                    
                    // Only add callback to the last segment
                    if (isLastSegment) {
                        queueSpeech(cleanedSegment, lang, rate, onComplete);
                    } else {
                        queueSpeech(cleanedSegment, lang, rate);
                    }
                }
                
                // If no valid segments were found, call onComplete directly
                if (lastSegmentIndex === -1 && onComplete) {
                    setTimeout(onComplete, 10);
                }
            } else {
                // Simple string meaning - process and segment
                const meaningText = typeof explanation === 'string' ? explanation : String(explanation);
                const processedMeaning = TextProcessor.preprocess(meaningText);
                const segments = TextProcessor.splitMeaningSegments(processedMeaning);
                
                // Speak each segment with proper language detection
                let lastSegmentIndex = -1;
                
                for (let i = 0; i < segments.length; i++) {
                    const segment = segments[i].trim();
                    
                    if (!segment || TextProcessor.isPunctuationOnly(segment)) {
                        continue;
                    }
                    
                    const cleanedSegment = TextProcessor.cleanSegment(segment);
                    if (!cleanedSegment.trim()) {
                        continue;
                    }
                    
                    const { lang, rate } = TextProcessor.getLanguageAndRate(segment);
                    const isLastSegment = i === segments.length - 1;
                    lastSegmentIndex = i;
                    
                    // Only add callback to the last segment
                    if (isLastSegment) {
                        queueSpeech(cleanedSegment, lang, rate, onComplete);
                    } else {
                        queueSpeech(cleanedSegment, lang, rate);
                    }
                }
                
                // If no valid segments were found, call onComplete directly
                if (lastSegmentIndex === -1 && onComplete) {
                    setTimeout(onComplete, 10);
                }
            }
        } catch (error) {
            console.error("Error in playMeaning:", error);
            if (onComplete) {
                setTimeout(onComplete, 10);
            }
        }
    }
    
    /**
     * Stop all speech
     */
    function stopSpeech() {
        if (!isInitialized) {
            init();
        }
        
        speechQueue.clear();
        speechConsumer.stopConsuming();
    }
    
    /**
     * Check if speech synthesis is available
     */
    function isAvailable() {
        return speechSynthesizer.isAvailable();
    }
    
    // Initialize on module load
    init();
    
    // Public API
    return {
        playWordWithSpelling,
        playMeaning,
        queueSpeech,
        stopSpeech,
        isAvailable,
        setVoiceSpeed
    };
})();

export default SpeechManager; 