import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import MainMenu from './components/MainMenu';
import LevelSelect from './components/LevelSelect';
import GameBoard from './components/GameBoard';
import SettingsModal from './components/SettingsModal';
import PauseMenu from './components/PauseMenu';
import DiagnosticsPanel from './components/DiagnosticsPanel';
import useDiagnosticsTrigger from './hooks/useDiagnosticsTrigger';
import { loadVocabularyData } from './utils/dataLoader';
import SpeechManager from './utils/speechManager';

const SCREENS = {
  MAIN_MENU: 'MAIN_MENU',
  LEVEL_SELECT: 'LEVEL_SELECT',
  GAME: 'GAME',
};

function App() {
  // Game state
  const [currentScreen, setCurrentScreen] = useState(SCREENS.MAIN_MENU);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [gameSettings, setGameSettings] = useState({
    volume: 0.7,
    voiceSpeed: 1,
    difficulty: 'normal',
    bgMusic: true,
    speechEnabled: true,
  });
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [vocabularyData, setVocabularyData] = useState({});
  const [librariesLoaded, setLibrariesLoaded] = useState(false);
  
  // Diagnostics panel trigger (triple-click detection)
  const { isDiagnosticsPanelOpen, closeDiagnosticsPanel } = useDiagnosticsTrigger();

  // Check if libraries are loaded and initialize speechManager after DOM is ready
  useEffect(() => {
    // Set libraries as loaded immediately since we're using npm packages
    setLibrariesLoaded(true);
    
    // Initialize speechManager after DOM is fully loaded
    const initializeSpeechManager = () => {
      if (document.readyState === 'complete') {
        SpeechManager.init();
        console.log('SpeechManager initialized after DOM load');
      } else {
        // Wait for DOM to be fully loaded
        window.addEventListener('load', () => {
          SpeechManager.init();
          console.log('SpeechManager initialized after window load');
        });
      }
    };
    
    initializeSpeechManager();
  }, []);

  // Audio handling
  useEffect(() => {
    // In a real app, we would initialize the actual sound here
    console.log('Background music would start playing here if enabled:', gameSettings.bgMusic);
    return () => {
      // Clean up audio when component unmounts
      console.log('Clean up audio');
    };
  }, [gameSettings.bgMusic]);

  // Update voice speed in SpeechManager when it changes in settings
  useEffect(() => {
    if (gameSettings.voiceSpeed) {
      // Only set voice speed if SpeechManager is initialized
      try {
        SpeechManager.setVoiceSpeed(gameSettings.voiceSpeed);
      } catch (error) {
        console.log('SpeechManager not yet initialized, voice speed will be set later');
      }
    }
  }, [gameSettings.voiceSpeed]);

  const handleStartGame = () => {
    setCurrentScreen(SCREENS.LEVEL_SELECT);
  };

  const handleLevelSelect = async (level) => {
    // Load vocabulary structure (without content) before entering the game
    if (Object.keys(vocabularyData).length === 0) {
      try {
        const data = await loadVocabularyData();
        setVocabularyData(data);
      } catch (error) {
        console.error("Error loading vocabulary structure:", error);
      }
    }
    
    setSelectedLevel(level);
    setCurrentScreen(SCREENS.GAME);
  };

  const handleBackToMenu = () => {
    setCurrentScreen(SCREENS.MAIN_MENU);
    setSelectedLevel(null);
    setIsPaused(false);
    
    // Stop any ongoing speech
    try {
      SpeechManager.stopSpeech();
    } catch (error) {
      console.log('SpeechManager not yet initialized');
    }
  };

  const handlePause = () => {
    setIsPaused(true);
    
    // Pause speech when game is paused
    try {
      SpeechManager.stopSpeech();
    } catch (error) {
      console.log('SpeechManager not yet initialized');
    }
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleSettings = () => {
    setShowSettings(true);
    
    // Pause speech when opening settings
    try {
      SpeechManager.stopSpeech();
    } catch (error) {
      console.log('SpeechManager not yet initialized');
    }
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  const handleUpdateSettings = (newSettings) => {
    setGameSettings(prev => ({ ...prev, ...newSettings }));
    setShowSettings(false);
  };

  // Render the current screen
  const renderScreen = () => {
    switch (currentScreen) {
      case SCREENS.MAIN_MENU:
        return (
          <MainMenu 
            onStart={handleStartGame} 
            onSettings={handleSettings}
          />
        );
      case SCREENS.LEVEL_SELECT:
        return (
          <LevelSelect 
            onLevelSelect={handleLevelSelect} 
            onBack={handleBackToMenu}
            vocabularyData={vocabularyData}
          />
        );
      case SCREENS.GAME:
        return (
          <GameBoard 
            level={selectedLevel}
            settings={gameSettings}
            onPause={handlePause}
            onBackToMenu={handleBackToMenu}
            vocabularyData={vocabularyData}
          />
        );
      default:
        return <div>Loading...</div>;
    }
  };

  return (
    <AppContainer className="app-container">
      {!librariesLoaded ? (
        <LoadingMessage>
          <h2>Loading libraries...</h2>
          <p>Please wait while we set up the secure connection.</p>
        </LoadingMessage>
      ) : (
        <>
          {renderScreen()}
          
          {isPaused && (
            <PauseMenu 
              onResume={handleResume} 
              onSettings={handleSettings}
              onQuit={handleBackToMenu}
            />
          )}
          
          {showSettings && (
            <SettingsModal 
              settings={gameSettings}
              onSave={handleUpdateSettings}
              onClose={handleCloseSettings}
            />
          )}
          
          {isDiagnosticsPanelOpen && (
            <DiagnosticsPanel onClose={closeDiagnosticsPanel} />
          )}
        </>
      )}
    </AppContainer>
  );
}

const AppContainer = styled.div`
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const LoadingMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  color: #2c3e50;
  text-align: center;
  
  h2 {
    font-size: 2rem;
    margin-bottom: 1rem;
  }
  
  p {
    font-size: 1.2rem;
  }
`;

export default App; 