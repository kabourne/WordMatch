import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const Card = ({ 
  id, 
  content, 
  type, 
  isSelected,
  isCorrect,
  onClick,
  pos
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(id);
    }
  };

  return (
    <CardContainer
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      $isSelected={isSelected}
      $isCorrect={isSelected && isCorrect}
      $isIncorrect={isSelected && !isCorrect}
      $type={type}
      onClick={handleClick}
    >
      {pos && <PartOfSpeech>{pos}</PartOfSpeech>}
      <CardContent>
        {content}
      </CardContent>
    </CardContainer>
  );
};

const CardContainer = styled(motion.div)`
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 1.5rem;
  user-select: none;
  cursor: pointer;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin: 0.5rem;
  width: 100%;
  transition: all 0.2s ease;
  
  /* Card colors based on state */
  background-color: ${props => {
    if (props.$isCorrect) return '#2ecc71';
    if (props.$isIncorrect) return '#e74c3c';
    if (props.$isSelected) return '#3498db';
    return props.$type === 'english' ? '#ffffff' : '#f8f9fa';
  }};
  
  color: ${props => {
    if (props.$isCorrect || props.$isIncorrect || props.$isSelected) return '#ffffff';
    return props.$type === 'english' ? '#2c3e50' : '#34495e';
  }};
`;

const PartOfSpeech = styled.span`
  font-size: 0.9rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  align-self: flex-start;
`;

const CardContent = styled.div`
  text-align: center;
  font-size: 1.2rem;
  font-weight: 500;
  line-height: 1.4;
`;

export default Card; 