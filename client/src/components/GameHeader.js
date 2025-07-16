import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

// Helper function to format units for display
const formatUnitDisplay = (units) => {
  if (!units || units.length === 0) return '';
  
  return units.map(unit => unit === 'Welcome_Unit' ? 'W' : unit).join(', ');
};

const GameHeader = ({ score, matchedPairs, totalPairs, onPause, units, volume }) => {
  // Calculate progress percentage
  const progressPercentage = totalPairs > 0 ? (matchedPairs / totalPairs) * 100 : 0;
  
  // Format units for display
  const unitsDisplay = formatUnitDisplay(units);

  return (
    <HeaderContainer>
      <StatsContainer>
        <StatBox>
          <StatLabel>分数 Score</StatLabel>
          <StatValue>{score.toLocaleString()}</StatValue>
        </StatBox>
        {volume && unitsDisplay && (
          <LevelInfo>
            V{volume} - {unitsDisplay}
          </LevelInfo>
        )}
      </StatsContainer>

      <ProgressContainer>
        <ProgressLabel>
          进度 Progress: {matchedPairs}/{totalPairs} 词组
        </ProgressLabel>
        <ProgressBarOuter>
          <ProgressBarInner 
            style={{ width: `${progressPercentage}%` }} 
            $percentage={progressPercentage}
          />
        </ProgressBarOuter>
      </ProgressContainer>

      <Controls>
        <ControlButton 
          onClick={onPause}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Pause Game"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
            <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
          </svg>
        </ControlButton>
      </Controls>
    </HeaderContainer>
  );
};

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  z-index: 10;
  position: relative;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const StatsContainer = styled.div`
  display: flex;
  gap: 1.5rem;
  align-items: center;
`;

const LevelInfo = styled.div`
  font-size: 0.9rem;
  color: #34495e;
  font-weight: 500;
  padding: 0.25rem 0.75rem;
  background-color: #edf2f7;
  border-radius: 4px;
`;

const StatBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  color: #7f8c8d;
  margin-bottom: 0.25rem;
`;

const StatValue = styled.div`
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
`;

const ProgressContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  max-width: 400px;
  margin: 0 1.5rem;
`;

const ProgressLabel = styled.div`
  font-size: 0.875rem;
  color: #34495e;
  text-align: center;
`;

const ProgressBarOuter = styled.div`
  width: 100%;
  height: 10px;
  background-color: #ecf0f1;
  border-radius: 5px;
  overflow: hidden;
`;

const ProgressBarInner = styled.div`
  height: 100%;
  border-radius: 5px;
  background-color: ${props => {
    // Change color based on progress percentage
    if (props.$percentage < 33) return '#e74c3c';
    if (props.$percentage < 66) return '#f39c12';
    return '#2ecc71';
  }};
  transition: width 0.3s ease;
`;

const Controls = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const ControlButton = styled(motion.button)`
  background-color: #3498db;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  border: none;
  cursor: pointer;
`;

export default GameHeader; 