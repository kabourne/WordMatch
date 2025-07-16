import { useState, useEffect } from 'react';
import { getWordPairs, shuffleArray } from '../utils/dataLoader';
import { DIFFICULTY_WORD_COUNTS } from './useGameState';

/**
 * Custom hook for initializing the game with vocabulary data
 * 
 * @param {Object} level - The game level configuration
 * @param {Object} vocabularyData - The vocabulary data for the game
 * @param {Function} generateOptions - Function to generate options for a word
 * @param {Object} gameState - Game state object containing state setters
 * @param {Object} refs - Refs for game management
 */
export const useGameInitializer = (level, vocabularyData, generateOptions, gameState, gameStartedRef) => {
  const [isInitializing, setIsInitializing] = useState(false);
  
  const {
    setWords,
    resetGameState,
    setGameUnits,
    setIsLoading,
    setError
  } = gameState;
  
  // This effect only runs when level changes (when "Start Game" is clicked)
  // which ensures words and publicKey APIs are only called at that time
  useEffect(() => {
    if (!level || !vocabularyData || isInitializing) {
      setIsLoading(false);
      return;
    }
    
    const initializeGame = async () => {
      try {
        setIsInitializing(true);
        setIsLoading(true);
        const { volume, units, difficulty } = level;
        
        // Support for both single unit (legacy) and multiple units
        const selectedUnits = Array.isArray(units) ? units : [level.unit];
        
        // Store the selected units for display
        setGameUnits(selectedUnits);
        
        // Array to store all words from selected units
        let allWords = [];
        
        // Get words for each selected unit
        // This is where the publicKey and words APIs will be called
        for (const unit of selectedUnits) {
          try {
            // Use the updated getWordPairs function that can fetch from server
            const wordCount = DIFFICULTY_WORD_COUNTS[difficulty] || DIFFICULTY_WORD_COUNTS.normal;
            const unitWords = await getWordPairs(vocabularyData, volume, unit, wordCount);
            
            if (unitWords && unitWords.length > 0) {
              allWords = [...allWords, ...unitWords];
            } else {
              console.warn(`No words found for Volume ${volume}, Unit ${unit}`);
            }
          } catch (err) {
            console.error(`Error loading words for Volume ${volume}, Unit ${unit}:`, err);
          }
        }
        
        if (allWords.length === 0) {
          setError("No vocabulary data found for the selected units");
          setIsLoading(false);
          setIsInitializing(false);
          return;
        }
        
        // Make sure we have enough words for the game
        if (allWords.length < 5) {
          setError("Not enough valid vocabulary words found");
          setIsLoading(false);
          setIsInitializing(false);
          return;
        }
        
        // Get word count based on difficulty
        const wordCount = DIFFICULTY_WORD_COUNTS[difficulty] || DIFFICULTY_WORD_COUNTS.normal;
        
        // Select words and shuffle them
        const gameWords = shuffleArray(allWords).slice(0, wordCount);
        
        // The words now already have the correct format with explanations
        setWords(gameWords);
        
        // Generate options for the first word
        if (gameWords.length > 0) {
          generateOptions(gameWords, 0);
        }
        
        // Reset game state
        resetGameState();
        setIsLoading(false);
        setIsInitializing(false);
      } catch (error) {
        console.error("Error initializing game:", error);
        setError("Error initializing game. Please try again.");
        setIsLoading(false);
        setIsInitializing(false);
      }
    };
    
    // Initialize the game when level changes (when "Start Game" is clicked)
    initializeGame();
    if (gameStartedRef) {
      gameStartedRef.current = true;
    }
    
    return () => {
      if (gameStartedRef) {
        gameStartedRef.current = false;
      }
    };
  }, [level, vocabularyData]);
  
  return {
    isInitializing
  };
}; 