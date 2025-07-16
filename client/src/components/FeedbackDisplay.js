import React from 'react';
import { FeedbackMessage } from './GameBoard.styles';

/**
 * Component for displaying feedback after an answer
 */
const FeedbackDisplay = ({ showFeedback, isCorrect }) => {
  if (!showFeedback) {
    return null;
  }

  return (
    <FeedbackMessage 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      data-correct={isCorrect}
    >
      {isCorrect ? "正确！" : "错误！"}
    </FeedbackMessage>
  );
};

export default FeedbackDisplay; 