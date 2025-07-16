import styled from 'styled-components';
import { motion } from 'framer-motion';

// Styled components
export const GameBoardContainer = styled.div`
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

export const GameContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
`;

export const EnglishWordContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 3rem;
`;

export const EnglishWord = styled.h1`
  font-size: 3rem;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

export const SpeechAnimation = styled.span`
  display: inline-block;
  font-size: 1.5rem;
  animation: pulse 1s infinite;
  
  @keyframes pulse {
    0% {
      transform: scale(0.8);
      opacity: 0.5;
    }
    50% {
      transform: scale(1.2);
      opacity: 1;
    }
    100% {
      transform: scale(0.8);
      opacity: 0.5;
    }
  }
`;

export const PhoneticText = styled.div`
  font-size: 1.2rem;
  color: #7f8c8d;
`;

export const LoadingOptions = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 120px;
  font-size: 1.2rem;
  color: #3498db;
  animation: pulse 1.5s infinite;
  
  @keyframes pulse {
    0% {
      opacity: 0.5;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0.5;
    }
  }
`;

export const OptionsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 1.5rem;
  width: 100%;
  max-width: 800px;
`;

export const OptionButton = styled(motion.button)`
  padding: 1.5rem;
  border-radius: 12px;
  background-color: ${props => 
    props['data-correct'] ? '#2ecc71' : 
    props['data-incorrect'] ? '#e74c3c' : 
    props.selected ? '#3498db' : '#f8f9fa'
  };
  color: ${props => props.selected || props['data-correct'] || props['data-incorrect'] ? '#fff' : '#2c3e50'};
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  transition: all 0.2s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: translateY(1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

export const PartOfSpeech = styled.span`
  font-size: 0.9rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: inherit;
  opacity: 0.8;
`;

export const OptionText = styled.span`
  font-size: 1.2rem;
`;

export const FeedbackMessage = styled(motion.div)`
  position: absolute;
  bottom: 10%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 2rem;
  font-weight: bold;
  color: ${props => props['data-correct'] ? '#2ecc71' : '#e74c3c'};
`;

export const MultipleSelectMessage = styled.div`
  margin-bottom: 1rem;
  font-size: 1.2rem;
  color: #e67e22;
  font-weight: bold;
  text-align: center;
`;

export const RemainingMessage = styled.div`
  margin-top: 1.5rem;
  font-size: 1.1rem;
  color: #7f8c8d;
`;

export const LoadingMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  font-size: 1.5rem;
  color: #3498db;
  font-weight: 500;
`;

export const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 2rem;
  text-align: center;
`;

export const ErrorMessage = styled.div`
  font-size: 1.2rem;
  color: #e74c3c;
  margin-bottom: 2rem;
`;

export const RetryButton = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
`; 