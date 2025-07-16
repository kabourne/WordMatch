import React from 'react';
import { 
  OptionsContainer, 
  OptionButton, 
  PartOfSpeech, 
  OptionText,
  MultipleSelectMessage,
  RemainingMessage,
  LoadingOptions
} from './GameBoard.styles';

/**
 * Component for displaying answer options
 */
const OptionsPanel = ({ 
  showOptions, 
  options, 
  selectedOptions, 
  onOptionSelect, 
  showFeedback,
  correctOptionsRemaining
}) => {
  if (!showOptions) {
    return (
      <LoadingOptions>
        <div>Reading the word...</div>
      </LoadingOptions>
    );
  }

  const multipleCorrectOptions = options.filter(o => o.isCorrect).length > 1;
  
  return (
    <>
      {multipleCorrectOptions && (
        <MultipleSelectMessage>
          This word has multiple meanings. Select ALL correct meanings!
        </MultipleSelectMessage>
      )}

      <OptionsContainer>
        {options.map((option) => (
          <OptionButton
            key={option.id}
            onClick={() => onOptionSelect(option)}
            selected={selectedOptions.some(selected => selected.id === option.id)}
            data-correct={option.isCorrect && selectedOptions.some(selected => selected.id === option.id) && showFeedback}
            data-incorrect={!option.isCorrect && selectedOptions.some(selected => selected.id === option.id) && showFeedback}
            animate={
              showFeedback && selectedOptions.some(selected => selected.id === option.id)
                ? {
                    scale: [1, 1.05, 1],
                    transition: { duration: 0.3 }
                  }
                : {}
            }
          >
            <PartOfSpeech>{option.pos}</PartOfSpeech>
            <OptionText>{option.meaning}</OptionText>
          </OptionButton>
        ))}
      </OptionsContainer>

      {!showFeedback && correctOptionsRemaining > 0 && multipleCorrectOptions && (
        <RemainingMessage>
          {correctOptionsRemaining} correct {correctOptionsRemaining === 1 ? 'meaning' : 'meanings'} left to select
        </RemainingMessage>
      )}
    </>
  );
};

export default OptionsPanel; 