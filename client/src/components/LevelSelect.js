import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import API from '../utils/api';

const LevelSelect = ({ onLevelSelect, onBack, vocabularyData }) => {
  const [selectedVolume, setSelectedVolume] = useState(1);
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState('normal');
  const [availableUnits, setAvailableUnits] = useState([]);
  const [availableVolumes, setAvailableVolumes] = useState([1, 2, 3, 4, 5, 6, 7]);
  const [serverUnitsData, setServerUnitsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch available units from server when LevelSelect component is opened
  useEffect(() => {
    const fetchUnitsFromServer = async () => {
      try {
        setIsLoading(true);
        const unitsData = await API.getAllUnits();
        console.log("Server units data:", unitsData);
        
        if (Object.keys(unitsData).length > 0) {
          setServerUnitsData(unitsData);
          
          // Update available volumes based on server data
          const volumes = Object.keys(unitsData).map(vol => parseInt(vol)).sort((a, b) => a - b);
          if (volumes.length > 0) {
            setAvailableVolumes(volumes);
            // Select the first volume by default
            setSelectedVolume(volumes[0]);
          }
        }
      } catch (err) {
        console.error("Error fetching units:", err);
        setError("Failed to load unit data from server");
      } finally {
        setIsLoading(false);
      }
    };
    
    // Call fetchUnitsFromServer only when component mounts, as this is when the "选择关卡" page is opened
    fetchUnitsFromServer();
  }, []);
  
  useEffect(() => {
    console.log("VocabularyData:", vocabularyData);
  }, [vocabularyData]);
  
  // Update available units when volume changes
  useEffect(() => {
    setSelectedUnits([]);
    
    if (serverUnitsData && serverUnitsData[selectedVolume]) {
      // Server data is available, use it
      const units = [...serverUnitsData[selectedVolume]]
        .sort((a, b) => {
          // Sort units in numerical order, but keep 'welcome' at the beginning
          if (a === "welcome") return -1;
          if (b === "welcome") return 1;
          return parseInt(a) - parseInt(b);
        });
        
      console.log("Available units from server for volume", selectedVolume, ":", units);
      setAvailableUnits(units);
    } else if (vocabularyData && vocabularyData[selectedVolume]) {
      // Fall back to local vocabulary data if server data is not available
      const units = Object.keys(vocabularyData[selectedVolume])
        .filter(unit => {
          // Make sure the unit has words
          const unitData = vocabularyData[selectedVolume][unit];
          return unitData && unitData.length > 0;
        })
        .map(unit => unit)
        .sort((a, b) => {
          // Sort units in numerical order, but keep 'Welcome_Unit' at the beginning
          if (a === 'Welcome_Unit') return -1;
          if (b === 'Welcome_Unit') return 1;
          return parseInt(a) - parseInt(b);
        });
      
      console.log("Available units from local data for volume", selectedVolume, ":", units);
      setAvailableUnits(units);
    } else {
      setAvailableUnits([]);
    }
  }, [selectedVolume, vocabularyData, serverUnitsData]);

  const handleUnitToggle = (unit) => {
    setSelectedUnits(prevSelected => {
      // Check if the unit is already selected
      const isSelected = prevSelected.some(u => u.toString() === unit.toString());
      
      if (isSelected) {
        // Remove the unit if already selected
        return prevSelected.filter(u => u.toString() !== unit.toString());
      } else {
        // Add the unit if not already selected
        return [...prevSelected, unit];
      }
    });
  };

  const handleStartGame = () => {
    // Don't start if no units are selected
    if (selectedUnits.length === 0) {
      return;
    }
    
    onLevelSelect({
      volume: selectedVolume,
      units: selectedUnits,
      difficulty: selectedDifficulty
    });
  };

  // Convert server format "welcome" to client format "Welcome_Unit"
  const formatUnitDisplay = (unit) => {
    if (unit === "welcome" || unit === "Welcome_Unit") return 'Welcome';
    return unit;
  };
  
  return (
    <Container
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Header>
        <BackButton 
          onClick={onBack}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          ← 返回
        </BackButton>
        <Title>选择关卡</Title>
      </Header>

      {isLoading ? (
        <LoadingMessage>Loading unit information...</LoadingMessage>
      ) : error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : (
        <SelectionArea>
          <SelectionGroup>
            <SelectionLabel>选择册数 Volume</SelectionLabel>
            <ButtonGroup>
              {availableVolumes.map(volume => (
                <SelectButton 
                  key={volume}
                  selected={selectedVolume === volume}
                  onClick={() => setSelectedVolume(volume)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {volume}
                </SelectButton>
              ))}
            </ButtonGroup>
          </SelectionGroup>

          <SelectionGroup>
            <SelectionLabel>选择单元 Unit (可多选)</SelectionLabel>
            <ButtonGroup>
              {availableUnits.length > 0 ? (
                availableUnits.map(unit => (
                  <SelectButton 
                    key={unit}
                    selected={selectedUnits.some(u => u.toString() === unit.toString())}
                    onClick={() => handleUnitToggle(unit)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {formatUnitDisplay(unit)}
                  </SelectButton>
                ))
              ) : (
                <NoUnitsMessage>No units available for this volume</NoUnitsMessage>
              )}
            </ButtonGroup>
          </SelectionGroup>

          <SelectionGroup>
            <SelectionLabel>选择难度 Difficulty</SelectionLabel>
            <ButtonGroup>
              {[
                { id: 'easy', label: '简单 Easy' },
                { id: 'normal', label: '普通 Normal' },
                { id: 'hard', label: '困难 Hard' }
              ].map(diff => (
                <DifficultyButton 
                  key={diff.id}
                  selected={selectedDifficulty === diff.id}
                  difficulty={diff.id}
                  onClick={() => setSelectedDifficulty(diff.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {diff.label}
                </DifficultyButton>
              ))}
            </ButtonGroup>
          </SelectionGroup>
        </SelectionArea>
      )}

      <StartButton 
        onClick={handleStartGame}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={selectedUnits.length === 0}
      >
        开始游戏 Start Game
      </StartButton>

      <LevelInfo>
        <InfoTitle>关卡信息</InfoTitle>
        <InfoText>
          册数: <InfoHighlight>Volume {selectedVolume}</InfoHighlight><br />
          单元: <InfoHighlight>
            {selectedUnits.length === 0 
              ? '未选择' 
              : selectedUnits.map(unit => formatUnitDisplay(unit)).join(', ')}
          </InfoHighlight><br />
          难度: <InfoHighlight>
            {selectedDifficulty === 'easy' ? '简单 Easy' : 
             selectedDifficulty === 'normal' ? '普通 Normal' : '困难 Hard'}
          </InfoHighlight><br />
          单词数量: <InfoHighlight>
            {selectedUnits.length === 0 ? '0' : 
              `约 ${selectedUnits.length * 
                (selectedDifficulty === 'easy' ? 8 : 
                 selectedDifficulty === 'normal' ? 12 : 16)} 对`}
          </InfoHighlight>
        </InfoText>
      </LevelInfo>
    </Container>
  );
};

const Container = styled(motion.div)`
  display: flex;
  flex-direction: column;
  padding: 2rem;
  height: 100%;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
  position: relative;
`;

const BackButton = styled(motion.button)`
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #2c3e50;
  cursor: pointer;
  position: absolute;
  left: 0;
  padding: 0.5rem 1rem;
`;

const Title = styled.h2`
  font-size: 2rem;
  font-weight: 600;
  text-align: center;
  width: 100%;
  color: #2c3e50;
`;

const LoadingMessage = styled.div`
  text-align: center;
  font-size: 1.2rem;
  color: #3498db;
  margin: 2rem 0;
`;

const ErrorMessage = styled.div`
  text-align: center;
  font-size: 1.2rem;
  color: #e74c3c;
  margin: 2rem 0;
  padding: 1rem;
  background-color: #ffeaea;
  border-radius: 8px;
`;

const SelectionArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-bottom: 2rem;
`;

const SelectionGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SelectionLabel = styled.h3`
  font-size: 1.2rem;
  font-weight: 500;
  color: #34495e;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const SelectButton = styled(motion.button)`
  background-color: ${props => props.selected ? '#3498db' : '#ecf0f1'};
  color: ${props => props.selected ? '#ffffff' : '#2c3e50'};
  border: 2px solid ${props => props.selected ? '#2980b9' : '#bdc3c7'};
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  min-width: 60px;
  text-align: center;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.selected ? '#2980b9' : '#95a5a6'};
  }
`;

const NoUnitsMessage = styled.div`
  color: #7f8c8d;
  font-style: italic;
  padding: 0.5rem 0;
`;

const DifficultyButton = styled(SelectButton)`
  background-color: ${props => {
    if (!props.selected) return '#ecf0f1';
    switch(props.difficulty) {
      case 'easy': return '#2ecc71';
      case 'normal': return '#3498db';
      case 'hard': return '#e74c3c';
      default: return '#3498db';
    }
  }};
  border-color: ${props => {
    if (!props.selected) return '#bdc3c7';
    switch(props.difficulty) {
      case 'easy': return '#27ae60';
      case 'normal': return '#2980b9';
      case 'hard': return '#c0392b';
      default: return '#2980b9';
    }
  }};
`;

const StartButton = styled(motion.button)`
  background-color: ${props => props.disabled ? '#95a5a6' : '#2ecc71'};
  color: white;
  border: none;
  border-radius: 12px;
  padding: 1rem;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  width: 100%;
  max-width: 300px;
  margin: 1rem auto;
  box-shadow: ${props => props.disabled ? 'none' : '0 4px 6px rgba(0, 0, 0, 0.1)'};
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.disabled ? '#95a5a6' : '#27ae60'};
  }
`;

const LevelInfo = styled.div`
  background-color: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 1rem;
  border: 1px solid #e9ecef;
`;

const InfoTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #2c3e50;
`;

const InfoText = styled.div`
  font-size: 1rem;
  line-height: 1.6;
  color: #34495e;
`;

const InfoHighlight = styled.span`
  color: #3498db;
  font-weight: 500;
`;

export default LevelSelect; 