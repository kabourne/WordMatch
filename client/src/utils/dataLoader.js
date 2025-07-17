/**
 * Utility functions for loading vocabulary data
 */
import config from './config';
import API from './api';
import CryptoManager from './cryptoManager';

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
 * @param {number} count - Number of words to request (for difficulty adjustment)
 * @returns {Promise<Array>} Array of vocabulary words
 */
export const loadServerVocabularyData = async (volume, unit, count = null) => {
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
    
    // Determine which API endpoint to use based on whether count is provided
    const endpoint = count 
      ? `${API.API_BASE_URL}/secure/vocabulary/${volume}/${serverUnit}/count/${count}` 
      : `${API.API_BASE_URL}/secure/vocabulary/${volume}/${serverUnit}`;
    
    // Request data from secure API endpoint
    const response = await fetch(endpoint, {
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
    // Get data from the server with requested count
    let unitWords = await loadServerVocabularyData(volume, unit, count);
    
    if (!unitWords || unitWords.length === 0) {
      console.error(`No data available for Volume ${volume} Unit ${unit}`);
      return [];
    }
    
    // Process words to preserve complete data structure
    return unitWords.map(item => {
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
  } catch (error) {
    console.error('Error getting word pairs:', error);
    return [];
  }
};

/**
 * Shuffle array using Fisher-Yates algorithm
 * @param {Array} array - The array to shuffle
 * @returns {Array} Shuffled array
 */
export const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}; 