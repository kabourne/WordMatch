import { useRef } from 'react';
import { shuffleArray } from '../utils/dataLoader';

// Helper function to generate a better random number
const betterRandom = (min, max) => {
  // Combine multiple sources of randomness
  const r1 = Math.random();
  const r2 = Math.random();
  const r3 = Date.now() % 1000 / 1000;
  
  // Combine the values for better distribution
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
const weightedReservoirSampling = (items, count) => {
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

// Helper function to format unit names for display
export const formatUnitsForDisplay = (units) => {
  if (!units) return '';
  
  const formattedUnits = Array.isArray(units) ? units : [units];
  return formattedUnits.map(unit => {
    if (unit === 'welcome') return 'W';
    return unit === 'Welcome_Unit' ? 'W' : unit;
  }).join(', ');
};

/**
 * Custom hook for game logic
 */
export const useGameLogic = (gameState) => {
  const gameStartedRef = useRef(false);
  const transitionRef = useRef(false);
  
  /**
   * Calculate similarity between two words to find good distractors
   * @param {Object} targetWord - The current word being tested
   * @param {Object} otherWord - Potential distractor word
   * @returns {number} Similarity score (lower is more different)
   */
  const calculateSimilarity = (targetWord, otherWord) => {
    // Simple similarity calculation - can be improved with more sophisticated metrics
    let score = 0;
    
    // Check if words start with same letter (slight similarity)
    if (targetWord.english.charAt(0) === otherWord.english.charAt(0)) {
      score += 0.1;
    }
    
    // Check for similar length (slight similarity)
    const lengthDiff = Math.abs(targetWord.english.length - otherWord.english.length);
    if (lengthDiff < 3) {
      score += 0.1;
    }
    
    // Check for similar parts of speech in explanations
    const targetPos = new Set(targetWord.explanation.map(exp => exp.pos));
    const otherPos = new Set(otherWord.explanation.map(exp => exp.pos));
    
    // If they share parts of speech, they are slightly more similar
    otherPos.forEach(pos => {
      if (targetPos.has(pos)) {
        score += 0.2;
      }
    });
    
    return score;
  };

  // Generate multiple choice options for a specific word
  const generateOptions = (wordsList, index) => {
    try {
      const { 
        setOptions, 
        setCorrectOptionsRemaining, 
        setAllCorrectSelected,
        setSelectedOptions
      } = gameState;
      
      const currentWord = wordsList[index];
      
      // Create correct options from all explanations of the current word
      const correctOptions = currentWord.explanation.map(explanation => ({
        id: `option-correct-${currentWord.id}-${Math.random().toString(36).substr(2, 9)}`,
        meaning: explanation.meaning,
        pos: explanation.pos,
        examples: explanation.examples || [],
        isCorrect: true
      }));
      
      // Set the number of correct options remaining
      setCorrectOptionsRemaining(correctOptions.length);
      setAllCorrectSelected(false);
      
      // Collect all other words' explanations to use as distractors
      let distractors = [];
      wordsList.forEach((word, wordIndex) => {
        if (wordIndex !== index) { // Don't use explanations from the current word
          word.explanation.forEach(explanation => {
            distractors.push({
              id: `option-${word.id}-${Math.random().toString(36).substr(2, 9)}`,
              meaning: explanation.meaning,
              pos: explanation.pos,
              examples: explanation.examples || [],
              isCorrect: false,
              // Add similarity score - lower means more different (better distractor)
              similarity: calculateSimilarity(currentWord, word)
            });
          });
        }
      });
      
      // Sort distractors by similarity (prefer more challenging distractors)
      distractors.sort((a, b) => a.similarity - b.similarity);
      
      // Choose distractors using weighted selection for better distribution
      const distractorCount = Math.max(4 - correctOptions.length, 0);
      
      // Assign weights to distractors based on position in the sorted list
      // This prioritizes better distractors but still allows some randomness
      const weightedDistractors = distractors.map((distractor, idx) => ({
        ...distractor,
        weight: Math.max(0.3, 1.0 - (idx / distractors.length))
      }));
      
      // Use reservoir sampling instead of simple slice for better distribution
      const selectedDistractors = weightedReservoirSampling(
        weightedDistractors, 
        distractorCount
      );
      
      // Combine correct options with distractors and shuffle again
      const allOptions = shuffleArray([...correctOptions, ...selectedDistractors]);
      setOptions(allOptions);
      
      // Reset selected options
      setSelectedOptions([]);
      
      return allOptions;
    } catch (error) {
      console.error("Error generating options:", error);
      throw new Error("Error generating options. Please try again.");
    }
  };
  
  return {
    gameStartedRef,
    transitionRef,
    generateOptions,
  };
}; 