import React, { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import GameHeader from './GameHeader';
import GameOverModal from './GameOverModal';
import SpeechManager from '../utils/speechManager';
import Sequencer from '../utils/sequencer';
import { playSoundAsync } from '../hooks/useSounds';

// Custom hooks
import { useGameState } from '../hooks/useGameState';
import { useGameLogic } from '../hooks/useGameLogic';
import { useSounds } from '../hooks/useSounds';
import { useGameInitializer } from '../hooks/useGameInitializer';

// Extracted components
import WordDisplay from './WordDisplay';
import OptionsPanel from './OptionsPanel';
import FeedbackDisplay from './FeedbackDisplay';
import GameStateDisplay from './GameStateDisplay';

// Styles
import { GameBoardContainer, GameContent } from './GameBoard.styles';

// Constants
const FEEDBACK_DELAY = 1000; // Delay for showing feedback in ms

const GameBoard = ({ level, settings, onPause, onBackToMenu, vocabularyData }) => {
  // Get state and methods from custom hooks
  const gameState = useGameState();
  const { 
    currentWordIndex, setCurrentWordIndex,
    words,
    options, 
    score, setScore,
    isGameOver, setIsGameOver,
    isLoading, 
    error, 
    selectedOptions, setSelectedOptions,
    showFeedback, setShowFeedback,
    isCorrect, setIsCorrect,
    totalAnswered, setTotalAnswered,
    correctAnswers, setCorrectAnswers,
    correctOptionsRemaining, setCorrectOptionsRemaining,
    setAllCorrectSelected,
    showOptions, setShowOptions,
    gameUnits,
    resetGameState
  } = gameState;
  
  const { gameStartedRef, transitionRef, generateOptions } = useGameLogic(gameState);
  const sounds = useSounds(settings);
  
  const sequencer = new Sequencer();

  // Initialize game
  useGameInitializer(level, vocabularyData, generateOptions, gameState, gameStartedRef);

  // When a new word is displayed, read it and then show options
  useEffect(() => {
    if (isLoading || !words.length || words.length <= currentWordIndex) return;
    
    const currentWord = words[currentWordIndex];
    
    // Respect speech settings
    const speechEnabled = settings?.speechEnabled !== false; // Default to true if not specified
    
    // Always start with options hidden
    setShowOptions(false);
    
    // First, ensure any ongoing speech is stopped
    SpeechManager.stopSpeech();
    
    // Add a small delay before starting the new speech to prevent interruptions
    const speechTimeout = setTimeout(() => {
      // Check if speech synthesis is available and enabled
      if (speechEnabled && SpeechManager.isAvailable()) {
        // Apply voice speed setting
        const voiceSpeed = settings?.voiceSpeed || 1.0;
        SpeechManager.setVoiceSpeed(voiceSpeed);
        
        // Read word and spelling, then show options when complete
        // Pass the entire word object so syllable information can be used
        SpeechManager.playWordWithSpelling(currentWord, () => {
          if (gameStartedRef.current) {
            setShowOptions(true);
          }
        });
      } else {
        // If speech not available or disabled, show options immediately
        setShowOptions(true);
      }
    }, 150); // Small delay to allow previous speech to fully stop
    
    return () => {
      // Clear timeout and stop any speech when component unmounts or word changes
      clearTimeout(speechTimeout);
      SpeechManager.stopSpeech();
    };
  }, [currentWordIndex, words, isLoading, settings?.speechEnabled, settings?.voiceSpeed, gameStartedRef, setShowOptions]);

  // Handle option selection
  const handleOptionSelect = (option) => {
    if (showFeedback) return; // Prevent selection during feedback
    
    // If the option is incorrect, show immediate error feedback
    if (!option.isCorrect) {
      setSelectedOptions([...selectedOptions, option]);
      setIsCorrect(false);
      setShowFeedback(true);
      setTotalAnswered(prev => prev + 1);
      sounds.incorrect.play();
      
      // After delay, clear selections and let the user try again
      setTimeout(() => {
        setShowFeedback(false);
        setSelectedOptions([]);
        setAllCorrectSelected(false);
        setCorrectOptionsRemaining(options.filter(o => o.isCorrect).length);
      }, FEEDBACK_DELAY);
      
      return;
    }
    
    if (selectedOptions.some(selected => selected.id === option.id)) {
      // If option is already selected, unselect it
      setSelectedOptions(selectedOptions.filter(selected => selected.id !== option.id));
      // If it was correct, increase the counter
      if (option.isCorrect) {
        setCorrectOptionsRemaining(prev => prev + 1);
      }
    } else {
      // Add option to selected options
      setSelectedOptions([...selectedOptions, option]);
      
      // If it's correct, decrease the counter
      if (option.isCorrect) {
        const speechEnabled = settings?.speechEnabled !== false;
        const newRemaining = correctOptionsRemaining - 1;
        setCorrectOptionsRemaining(newRemaining);
        if (newRemaining === 0) {
          setAllCorrectSelected(true);
          setIsCorrect(true);
          setShowFeedback(true);
          setTotalAnswered(prev => prev + 1);
          setScore(prev => prev + 100);
          setCorrectAnswers(prev => prev + 1);
          if (transitionRef.current) return;
          transitionRef.current = true;
          // Use the sequencer for the correct answer sequence
          sequencer.add(async () => {
            if (speechEnabled && SpeechManager.isAvailable()) {
              const voiceSpeed = settings?.voiceSpeed || 1.0;
              SpeechManager.setVoiceSpeed(voiceSpeed);
              SpeechManager.stopSpeech();
              await SpeechManager.playMeaningAsync({ meaning: option.meaning, pos: option.pos });
            }
          });
          sequencer.add(async () => {
            await playSoundAsync(sounds.correct);
          });
          sequencer.add(async () => {
            await new Promise((resolve) => setTimeout(resolve, FEEDBACK_DELAY));
            setShowFeedback(false);
            const nextIndex = currentWordIndex + 1;
            if (nextIndex < words.length) {
              setCurrentWordIndex(nextIndex);
              setSelectedOptions([]);
              generateOptions(words, nextIndex);
            } else {
              handleGameOver();
            }
            setTimeout(() => {
              transitionRef.current = false;
            }, 500);
          });
        } else {
          // For non-last correct options, just play meaning if enabled
          if (speechEnabled && SpeechManager.isAvailable()) {
            const voiceSpeed = settings?.voiceSpeed || 1.0;
            SpeechManager.setVoiceSpeed(voiceSpeed);
            SpeechManager.stopSpeech();
            setTimeout(() => {
              SpeechManager.playMeaning({ meaning: option.meaning, pos: option.pos });
            }, 100);
          }
        }
      }
    }
  };

  // Handle game over
  const handleGameOver = () => {
    setIsGameOver(true);
    sounds.victory.play();
  };

  // Handle game restart
  const handleRestart = () => {
    // Reset game state
    resetGameState();
    
    // Re-initialize the game with the same level
    if (words.length > 0) {
      generateOptions(words, 0);
    }
  };

  // Display loading or error state if needed
  if (isLoading || error) {
    return (
      <GameStateDisplay 
        isLoading={isLoading} 
        error={error} 
        onBackToMenu={onBackToMenu} 
      />
    );
  }

  // Get the current word
  const currentWord = words[currentWordIndex] || {};
  
  return (
    <GameBoardContainer>
      <GameHeader 
        score={score}
        matchedPairs={correctAnswers}
        totalPairs={words.length}
        onPause={onPause}
        units={gameUnits}
        volume={level?.volume}
      />
      
      <GameContent>
        <WordDisplay word={currentWord} showOptions={showOptions} />

        <OptionsPanel 
          showOptions={showOptions}
          options={options}
          selectedOptions={selectedOptions}
          onOptionSelect={handleOptionSelect}
          showFeedback={showFeedback}
          correctOptionsRemaining={correctOptionsRemaining}
        />

        <FeedbackDisplay 
          showFeedback={showFeedback}
          isCorrect={isCorrect}
        />
      </GameContent>
      
      <AnimatePresence>
        {isGameOver && (
          <GameOverModal 
            score={score}
            correctAnswers={correctAnswers}
            totalAttempted={totalAnswered}
            onRestart={handleRestart}
            onBackToMenu={onBackToMenu}
            level={level}
          />
        )}
      </AnimatePresence>
    </GameBoardContainer>
  );
};

export default GameBoard; 