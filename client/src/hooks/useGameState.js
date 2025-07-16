import { useState } from 'react';

// Word counts for different difficulty levels
export const DIFFICULTY_WORD_COUNTS = {
  easy: 8,
  normal: 12,
  hard: 16
};

/**
 * Custom hook for managing game state
 */
export const useGameState = () => {
  // Game state
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [words, setWords] = useState([]);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [correctOptionsRemaining, setCorrectOptionsRemaining] = useState(0);
  const [allCorrectSelected, setAllCorrectSelected] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [gameUnits, setGameUnits] = useState([]);
  
  // Reset game state
  const resetGameState = () => {
    setCurrentWordIndex(0);
    setScore(0);
    setIsGameOver(false);
    setSelectedOptions([]);
    setShowFeedback(false);
    setTotalAnswered(0);
    setCorrectAnswers(0);
    setShowOptions(false);
    setAllCorrectSelected(false);
  };
  
  return {
    // State
    currentWordIndex,
    setCurrentWordIndex,
    words,
    setWords,
    options,
    setOptions,
    score,
    setScore,
    isGameOver,
    setIsGameOver,
    isLoading,
    setIsLoading,
    error,
    setError,
    selectedOptions,
    setSelectedOptions,
    showFeedback,
    setShowFeedback,
    isCorrect,
    setIsCorrect,
    totalAnswered,
    setTotalAnswered,
    correctAnswers,
    setCorrectAnswers,
    correctOptionsRemaining,
    setCorrectOptionsRemaining,
    allCorrectSelected,
    setAllCorrectSelected,
    showOptions,
    setShowOptions,
    gameUnits,
    setGameUnits,
    
    // Methods
    resetGameState
  };
}; 