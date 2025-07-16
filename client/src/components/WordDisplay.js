import React from 'react';
import { EnglishWordContainer, EnglishWord, PhoneticText, SpeechAnimation } from './GameBoard.styles';

/**
 * Component for displaying the current word
 */
const WordDisplay = ({ word, showOptions }) => {
  return (
    <EnglishWordContainer>
      <EnglishWord>
        {word?.english || "Loading..."}
        {!showOptions && <SpeechAnimation>🔊</SpeechAnimation>}
      </EnglishWord>
      {word?.phonetic && (
        <PhoneticText>/{word.phonetic.replace(/^\//g, "").replace(/\/$/g, "")}/</PhoneticText>
      )}
    </EnglishWordContainer>
  );
};

export default WordDisplay; 