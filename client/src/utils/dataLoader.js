/**
 * Utility functions for loading vocabulary data
 */
import config from './config';
import API from './api';
import CryptoManager from './cryptoManager';

// Store recently used words to avoid repetition
const recentlyUsedWords = new Map();

// Maximum number of recently used words to track per level
const MAX_RECENT_WORDS = 30;

// Track if crypto is initialized
let cryptoInitialized = false;

/**
 * Load all vocabulary structure from server
 * @returns {Object} Organized vocabulary structure by volume and unit
 */
export const loadVocabularyData = async () => {
  try {
    // Create empty data structure
    const data = {};
    
    // Initialize volumes
    config.VOLUMES.forEach(volume => {
      data[volume] = {};
    });
    
    // Create default structure based on config
    config.VOLUMES.forEach(volume => {
      data[volume] = {};
      config.UNITS.forEach(unit => {
        data[volume][unit] = []; // Empty placeholder
      });
    });
    
    return data;
  } catch (error) {
    console.error('Failed to create vocabulary structure:', error);
    return {};
  }
};

/**
 * Load vocabulary data for a specific volume and unit from the server
 * @param {number} volume - Volume number
 * @param {string|number} unit - Unit number or 'Welcome_Unit'
 * @returns {Promise<Array>} Array of vocabulary words
 */
export const loadServerVocabularyData = async (volume, unit) => {
  try {
    // Convert unit format if needed
    let serverUnit = unit;
    if (unit === 'Welcome_Unit') {
      serverUnit = 'welcome';
    }
    
    // Initialize crypto if not already done
    // This ensures the publicKey API is called only when starting a game
    if (!cryptoInitialized) {
      // Get the server's public key
      const publicKey = await API.getPublicKey();
      if (!publicKey) {
        throw new Error("Failed to fetch server public key");
      }
      
      // Initialize crypto with the fetched public key
      await CryptoManager.init(publicKey);
      cryptoInitialized = true;
    }
    
    // Generate a random AES key for this request
    const aesKey = CryptoManager.generateAesKey();
    
    // Encrypt the AES key with the server's public key
    const encryptedAesKey = CryptoManager.encryptAesKey(aesKey);
    
    // Request data from secure API endpoint
    const response = await fetch(`${API.API_BASE_URL}/secure/vocabulary/${volume}/${serverUnit}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ encryptedAesKey })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to load data for Volume ${volume} Unit ${unit}`);
    }
    
    const encryptedResponse = await response.json();
    
    // Decrypt the response using the AES key
    const decryptedData = await CryptoManager.decryptData(
      encryptedResponse.encryptedData,
      encryptedResponse.iv,
      encryptedResponse.authTag,
      aesKey
    );
    
    // Verify data integrity using the hash
    const isValid = CryptoManager.verifyDataIntegrity(decryptedData, encryptedResponse.hash);
    
    if (!isValid) {
      throw new Error('Data integrity check failed');
    }
    
    // Parse the decrypted JSON data
    return JSON.parse(decryptedData);
  } catch (error) {
    console.error('Error loading server vocabulary data:', error);
    return null;
  }
};

/**
 * Get vocabulary words for a specific volume and unit
 * @param {Object} vocabularyData - The complete vocabulary data object
 * @param {number} volume - Volume number
 * @param {number|string} unit - Unit number or 'Welcome_Unit'
 * @param {number} count - Number of words to include (for difficulty adjustment)
 * @returns {Array} Array of word pairs (English-Chinese)
 */
export const getWordPairs = async (vocabularyData, volume, unit, count = 10) => {
  try {
    // Get data from the server
    let unitWords = await loadServerVocabularyData(volume, unit);
    
    if (!unitWords || unitWords.length === 0) {
      console.error(`No data available for Volume ${volume} Unit ${unit}`);
      return [];
    }
    
    // Process words to preserve complete data structure
    const wordPairs = unitWords.map(item => {
      // Generate a unique ID for this word
      const id = `${item.word}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Keep the new data structure intact
      return {
        id,
        english: item.word,
        syllable_breaks: item.syllable_breaks || item.word, // Use word as fallback
        phonetic: item.phonetic || '',
        explanation: item.explanation || [],
        // Add derived fields needed by the game
        chinese: item.explanation && item.explanation.length > 0 
          ? item.explanation[0].meaning 
          : '无翻译'
      };
    });
    
    // Get optimally selected words based on various algorithms
    return selectOptimalWords(wordPairs, count, `${volume}-${unit}`);
  } catch (error) {
    console.error('Error getting word pairs:', error);
    return [];
  }
};

/**
 * Selects words optimally using advanced selection techniques
 * @param {Array} wordPool - The pool of available words
 * @param {number} count - Number of words to select
 * @param {string} levelKey - A unique key to identify the level
 * @returns {Array} Array of selected words
 */
export const selectOptimalWords = (wordPool, count, levelKey) => {
  // Don't try to select more words than available
  count = Math.min(count, wordPool.length);
  
  // Get the recently used words for this level
  const recentWords = recentlyUsedWords.get(levelKey) || new Set();
  
  // Calculate weights for each word (lower for recently used words)
  const weightedPool = wordPool.map(word => {
    const isRecentlyUsed = recentWords.has(word.english);
    // Words not recently used get higher weight
    const weight = isRecentlyUsed ? 0.3 : 1.0;
    return { ...word, weight };
  });
  
  // If we have enough words not recently used, prioritize those
  let selectedPool = weightedPool;
  if (wordPool.length - recentWords.size >= count) {
    // If we can avoid all recently used words, filter them out
    selectedPool = weightedPool.filter(word => !recentWords.has(word.english));
  }
  
  // Select words using weighted reservoir sampling
  const selectedWords = weightedReservoirSampling(selectedPool, count);
  
  // Update recently used words cache
  const newRecentWords = new Set();
  // Keep some old words but prevent the set from growing too large
  if (recentWords.size > MAX_RECENT_WORDS / 2) {
    // Keep only half of the recent words to make room for new ones
    [...recentWords].slice(0, MAX_RECENT_WORDS / 2).forEach(word => {
      newRecentWords.add(word);
    });
  } else {
    recentWords.forEach(word => newRecentWords.add(word));
  }
  
  // Add the newly selected words to the recent set
  selectedWords.forEach(word => newRecentWords.add(word.english));
  
  // Update the cache
  recentlyUsedWords.set(levelKey, newRecentWords);
  
  return selectedWords;
};

/**
 * Generate a better random number using a combination of sources
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (exclusive)
 * @returns {number} A random number between min (inclusive) and max (exclusive)
 */
export const betterRandom = (min, max) => {
  // Combine multiple sources of randomness
  const r1 = Math.random();
  const r2 = Math.random();
  const r3 = Date.now() % 1000 / 1000;
  
  // XOR the values for better distribution
  const combined = (r1 * 0.4) + (r2 * 0.4) + (r3 * 0.2);
  
  // Scale to the requested range
  return min + combined * (max - min);
};

/**
 * Weighted reservoir sampling algorithm for selecting items with weights
 * @param {Array} items - Array of items with weight property
 * @param {number} count - Number of items to select
 * @returns {Array} Array of selected items
 */
export const weightedReservoirSampling = (items, count) => {
  const n = items.length;
  count = Math.min(count, n);
  
  if (n <= count) return [...items]; // If we need all items, just return them all
  
  // Calculate the sum of weights
  const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0);
  
  // Initialize result array with first k elements
  const result = items.slice(0, count);
  
  // Process the rest of the elements
  for (let i = count; i < n; i++) {
    // Generate a random weight
    const r = betterRandom(0, totalWeight);
    
    // Find which element to replace (if any)
    let currentWeight = 0;
    for (let j = 0; j < count; j++) {
      currentWeight += (result[j].weight || 1);
      if (r < currentWeight) {
        // Replace this element
        result[j] = items[i];
        break;
      }
    }
  }
  
  // Final shuffle to avoid bias
  return shuffleArray(result);
};

/**
 * Shuffle array using Fisher-Yates algorithm with improved randomness
 * @param {Array} array - The array to shuffle
 * @returns {Array} Shuffled array
 */
export const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(betterRandom(0, i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}; 