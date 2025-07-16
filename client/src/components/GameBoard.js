import React, { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import GameHeader from './GameHeader';
import GameOverModal from './GameOverModal';
import SpeechManager from '../utils/speechManager';

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
        // Read the meaning of the selected correct option immediately
        const speechEnabled = settings?.speechEnabled !== false;
        if (speechEnabled && SpeechManager.isAvailable()) {
          try {
            // Apply voice speed setting
            const voiceSpeed = settings?.voiceSpeed || 1.0;
            SpeechManager.setVoiceSpeed(voiceSpeed);
            
            // First stop any ongoing speech
            SpeechManager.stopSpeech();
            
            // Add a small delay before starting new speech to avoid interruptions
            setTimeout(() => {
              // Read the meaning of this specific option
              console.log("Reading meaning for selected option:", option.meaning);
              
              // Store the current option in a ref to help with handling last option
              const isLastOption = correctOptionsRemaining === 1;
              
              // Read the meaning with callback for last option
              if (isLastOption) {
                // We'll use the callback in the last option to drive the sequence
                // Meaning will be read within the section below after setting states
              } else {
                // For non-last options, read meaning immediately
                SpeechManager.playMeaning({
                  meaning: option.meaning,
                  pos: option.pos
                });
              }
            }, 100);
          } catch (error) {
            console.error("Speech error when reading option:", error);
          }
        }
        
        const newRemaining = correctOptionsRemaining - 1;
        setCorrectOptionsRemaining(newRemaining);
        
        // Check if all correct options have been selected
        if (newRemaining === 0) {
          setAllCorrectSelected(true);
          
          // All correct options are selected, show success feedback
          setIsCorrect(true);
          setShowFeedback(true);
          setTotalAnswered(prev => prev + 1);
          setScore(prev => prev + 100);
          setCorrectAnswers(prev => prev + 1);
          
          // Use callbacks to drive the sequence instead of timeouts
          
          // Prevent multiple executions with the transition ref
          if (transitionRef.current) return;
          transitionRef.current = true;
          
          // Step 1: Read the meaning of the last selected option
          const speechEnabled = settings?.speechEnabled !== false;
          
          // Execute the sequence after speech
          const executeSequence = () => {
            console.log("Starting transition to next word");
            
            // Step 2: Play the correct sound
            sounds.correct.play();
            
            // Step 3: After feedback delay, move to next word
            setTimeout(() => {
              setShowFeedback(false);
              const nextIndex = currentWordIndex + 1;
              
              if (nextIndex < words.length) {
                setCurrentWordIndex(nextIndex);
                setSelectedOptions([]);
                generateOptions(words, nextIndex);
              } else {
                // End the game when all words have been gone through
                handleGameOver();
              }
              
              // Step 4: Reset the transition flag
              setTimeout(() => {
                transitionRef.current = false;
              }, 500);
            }, FEEDBACK_DELAY);
          };
          
          // Use speech callback to drive the sequence
          if (speechEnabled && SpeechManager.isAvailable()) {
            try {
              // Safety fallback in case callback doesn't fire
              const safetyTimeout = setTimeout(() => {
                console.log("Safety fallback triggered");
                executeSequence();
              }, 5000); // 5-second safety timeout
              
              // Create a custom wrapper to clear the timeout if callback fires naturally
              const originalCallback = executeSequence;
              const safeCallback = () => {
                clearTimeout(safetyTimeout);
                originalCallback();
              };
              
              // First ensure any ongoing speech is stopped
              SpeechManager.stopSpeech();
              
              // Add a small delay before starting new speech to prevent interruptions
              setTimeout(() => {
                // Read the meaning with callback that triggers the next actions
                console.log("Reading final meaning with callback");
                SpeechManager.playMeaning({
                  meaning: option.meaning,
                  pos: option.pos
                }, safeCallback);
              }, 100);
            } catch (error) {
              console.error("Speech error in final option:", error);
              executeSequence();
            }
          } else {
            // If speech is not enabled, just execute the sequence directly
            executeSequence();
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