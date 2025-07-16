import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

// Helper function to format units for display
const formatUnitsDisplay = (units) => {
  if (!units || units.length === 0) return '';
  
  return units.map(unit => unit === 'Welcome_Unit' ? 'W' : unit).join(', ');
};

const GameOverModal = ({ score, correctAnswers, totalAttempted, onRestart, onBackToMenu, level }) => {
  // Calculate star rating based on correct answers ratio
  const calculateStars = () => {
    const accuracy = totalAttempted > 0 ? (correctAnswers / totalAttempted) : 0;
    
    if (accuracy >= 0.9 && correctAnswers >= 10) return 3; // Excellent performance
    if (accuracy >= 0.7 && correctAnswers >= 5) return 2; // Good performance
    return 1; // Average performance
  };

  const stars = calculateStars();
  const accuracy = totalAttempted > 0 ? Math.round((correctAnswers / totalAttempted) * 100) : 0;
  
  // Format level information for display
  const volume = level?.volume || '';
  const units = level?.units || (level?.unit ? [level.unit] : []);
  const difficulty = level?.difficulty || '';
  const unitsDisplay = formatUnitsDisplay(units);

  return (
    <ModalOverlay
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <ModalContent
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <ModalHeader>
          <VictoryTitle>游戏结束!</VictoryTitle>
          <VictorySubtitle>来看看你的表现如何</VictorySubtitle>
        </ModalHeader>

        {volume && unitsDisplay && (
          <LevelInfo>
            Volume {volume} - Unit {unitsDisplay}
            <DifficultyBadge difficulty={difficulty}>
              {difficulty === 'easy' ? '简单' : 
               difficulty === 'normal' ? '普通' : '困难'}
            </DifficultyBadge>
          </LevelInfo>
        )}

        <StarsContainer>
          {[1, 2, 3].map((i) => (
            <Star 
              key={i} 
              $active={i <= stars}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                rotate: i <= stars ? [0, 15, -15, 0] : 0 
              }}
              transition={{ 
                delay: 0.3 + (i * 0.2), 
                duration: 0.5,
                type: 'spring' 
              }}
            >
              ★
            </Star>
          ))}
        </StarsContainer>

        <StatsContainer>
          <StatItem>
            <StatLabel>得分</StatLabel>
            <StatValue>{score.toLocaleString()}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>正确词汇</StatLabel>
            <StatValue>{correctAnswers}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>准确率</StatLabel>
            <StatValue>{accuracy}%</StatValue>
          </StatItem>
        </StatsContainer>

        <ButtonsContainer>
          <ActionButton 
            $variant="primary"
            onClick={onRestart}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            再玩一次 Play Again
          </ActionButton>
          <ActionButton 
            $variant="secondary"
            onClick={onBackToMenu}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            返回菜单 Back to Menu
          </ActionButton>
        </ButtonsContainer>

        <MotivationalText>
          {stars === 3 ? '太棒了！你是词汇达人！' : 
           stars === 2 ? '不错！继续练习可以更好！' : 
           '加油！多多练习就能提高！'}
        </MotivationalText>
      </ModalContent>
    </ModalOverlay>
  );
};

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
`;

const ModalContent = styled(motion.div)`
  background: white;
  border-radius: 20px;
  padding: 2.5rem;
  width: 90%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
`;

const VictoryTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 0.5rem;
`;

const VictorySubtitle = styled.p`
  font-size: 1.2rem;
  color: #7f8c8d;
`;

const LevelInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding: 0.5rem 1rem;
  background-color: #f8fafc;
  border-radius: 8px;
  font-size: 1rem;
  color: #2c3e50;
`;

const DifficultyBadge = styled.span`
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  color: white;
  background-color: ${props => {
    switch(props.difficulty) {
      case 'easy': return '#2ecc71';
      case 'normal': return '#f39c12';
      case 'hard': return '#e74c3c';
      default: return '#3498db';
    }
  }};
`;

const StarsContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const Star = styled(motion.div)`
  font-size: 3rem;
  color: ${props => props.$active ? '#f1c40f' : '#ecf0f1'};
  text-shadow: ${props => props.$active ? '0 0 10px rgba(241, 196, 15, 0.5)' : 'none'};
`;

const StatsContainer = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-around;
  margin-bottom: 2rem;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const StatLabel = styled.p`
  font-size: 0.9rem;
  color: #7f8c8d;
  margin-bottom: 0.25rem;
`;

const StatValue = styled.p`
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const ActionButton = styled(motion.button)`
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  font-size: 1rem;
  border: none;
  
  background-color: ${props => props.$variant === 'primary' ? '#3498db' : '#ecf0f1'};
  color: ${props => props.$variant === 'primary' ? 'white' : '#34495e'};
  box-shadow: ${props => props.$variant === 'primary' ? 
    '0 4px 6px rgba(52, 152, 219, 0.3)' : 
    '0 4px 6px rgba(0, 0, 0, 0.1)'
  };
`;

const MotivationalText = styled.p`
  font-size: 1.1rem;
  color: #2c3e50;
  text-align: center;
  font-weight: 500;
`;

export default GameOverModal; 