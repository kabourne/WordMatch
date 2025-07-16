import React from 'react';
import { LoadingMessage, ErrorContainer, ErrorMessage, RetryButton } from './GameBoard.styles';

/**
 * Component for displaying loading and error states
 */
const GameStateDisplay = ({ isLoading, error, onBackToMenu }) => {
  if (isLoading) {
    return (
      <LoadingMessage>加载中...Loading...</LoadingMessage>
    );
  }
  
  if (error) {
    return (
      <ErrorContainer>
        <ErrorMessage>{error}</ErrorMessage>
        <RetryButton onClick={onBackToMenu}>
          返回菜单 Back to Menu
        </RetryButton>
      </ErrorContainer>
    );
  }

  return null;
};

export default GameStateDisplay; 