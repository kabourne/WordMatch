import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const SettingsModal = ({ settings, onSave, onClose }) => {
  const [localSettings, setLocalSettings] = useState({
    volume: settings.volume || 0.7,
    voiceSpeed: settings.voiceSpeed || 1,
    difficulty: settings.difficulty || 'normal',
    bgMusic: settings.bgMusic !== undefined ? settings.bgMusic : true,
    speechEnabled: settings.speechEnabled !== undefined ? settings.speechEnabled : true,
  });

  useEffect(() => {
    setLocalSettings({
      volume: settings.volume || 0.7,
      voiceSpeed: settings.voiceSpeed || 1,
      difficulty: settings.difficulty || 'normal',
      bgMusic: settings.bgMusic !== undefined ? settings.bgMusic : true,
      speechEnabled: settings.speechEnabled !== undefined ? settings.speechEnabled : true,
    });
  }, [settings]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLocalSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(localSettings);
  };

  const handleCancel = () => {
    setLocalSettings(settings);
    onClose();
  };

  return (
    <OverlayContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <SettingsContainer
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHeader>
          <Title>游戏设置</Title>
          <Subtitle>Game Settings</Subtitle>
        </ModalHeader>

        <SettingsForm onSubmit={handleSubmit}>
          <SettingGroup>
            <SettingLabel>音量 Volume</SettingLabel>
            <SliderContainer>
              <StyledRangeInput
                type="range"
                name="volume"
                min="0"
                max="1"
                step="0.1"
                value={localSettings.volume}
                onChange={handleInputChange}
              />
              <SliderValue>{Math.round(localSettings.volume * 100)}%</SliderValue>
            </SliderContainer>
          </SettingGroup>

          <SettingGroup>
            <SettingLabel>语音速度 Voice Speed</SettingLabel>
            <SliderContainer>
              <StyledRangeInput
                type="range"
                name="voiceSpeed"
                min="0.5"
                max="1.5"
                step="0.1"
                value={localSettings.voiceSpeed}
                onChange={handleInputChange}
              />
              <SliderValue>
                {localSettings.voiceSpeed < 1 ? '慢 Slow' : 
                 localSettings.voiceSpeed > 1 ? '快 Fast' : '中 Normal'}
              </SliderValue>
            </SliderContainer>
          </SettingGroup>

          <SettingGroup>
            <SettingLabel>默认难度 Default Difficulty</SettingLabel>
            <RadioButtonGroup>
              {[
                { value: 'easy', label: '简单 Easy' },
                { value: 'normal', label: '普通 Normal' },
                { value: 'hard', label: '困难 Hard' }
              ].map(option => (
                <RadioOption key={option.value}>
                  <RadioInput
                    type="radio"
                    name="difficulty"
                    value={option.value}
                    checked={localSettings.difficulty === option.value}
                    onChange={handleInputChange}
                    id={`difficulty-${option.value}`}
                  />
                  <RadioLabel 
                    htmlFor={`difficulty-${option.value}`}
                    $isActive={localSettings.difficulty === option.value}
                    $difficulty={option.value}
                  >
                    {option.label}
                  </RadioLabel>
                </RadioOption>
              ))}
            </RadioButtonGroup>
          </SettingGroup>

          <SettingGroup>
            <CheckboxContainer>
              <CheckboxInput
                type="checkbox"
                name="bgMusic"
                checked={localSettings.bgMusic}
                onChange={handleInputChange}
                id="bgMusic"
              />
              <CheckboxLabel htmlFor="bgMusic">
                背景音乐 Background Music
              </CheckboxLabel>
            </CheckboxContainer>
          </SettingGroup>

          <SettingGroup>
            <CheckboxContainer>
              <CheckboxInput
                type="checkbox"
                name="speechEnabled"
                checked={localSettings.speechEnabled}
                onChange={handleInputChange}
                id="speechEnabled"
              />
              <CheckboxLabel htmlFor="speechEnabled">
                自动语音 Auto Speech
              </CheckboxLabel>
            </CheckboxContainer>
          </SettingGroup>

          <ButtonsGroup>
            <SaveButton 
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              保存 Save
            </SaveButton>
            <CancelButton 
              type="button" 
              onClick={handleCancel}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              取消 Cancel
            </CancelButton>
          </ButtonsGroup>
        </SettingsForm>
      </SettingsContainer>
    </OverlayContainer>
  );
};

const OverlayContainer = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  backdrop-filter: blur(5px);
`;

const SettingsContainer = styled(motion.div)`
  background-color: white;
  padding: 2.5rem;
  border-radius: 20px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const Title = styled.h2`
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #2c3e50;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  color: #7f8c8d;
`;

const SettingsForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const SettingGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const SettingLabel = styled.label`
  font-size: 1rem;
  color: #34495e;
  font-weight: 500;
`;

const SliderContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const StyledRangeInput = styled.input`
  flex: 1;
  -webkit-appearance: none;
  height: 8px;
  border-radius: 4px;
  background: #ecf0f1;
  outline: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #3498db;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #3498db;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
`;

const SliderValue = styled.span`
  min-width: 80px;
  font-size: 0.9rem;
  color: #7f8c8d;
`;

const RadioButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
`;

const RadioOption = styled.div`
  flex: 1;
  min-width: 100px;
`;

const RadioInput = styled.input`
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
`;

const RadioLabel = styled.label`
  display: block;
  text-align: center;
  padding: 0.75rem;
  background-color: ${props => {
    if (!props.$isActive) return '#ecf0f1';
    
    switch(props.$difficulty) {
      case 'easy': return '#2ecc71';
      case 'normal': return '#f39c12';
      case 'hard': return '#e74c3c';
      default: return '#3498db';
    }
  }};
  color: ${props => props.$isActive ? 'white' : '#34495e'};
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  box-shadow: ${props => props.$isActive ? '0 2px 4px rgba(0, 0, 0, 0.2)' : 'none'};
  
  &:hover {
    background-color: ${props => {
      if (props.$isActive) return;
      
      switch(props.$difficulty) {
        case 'easy': return '#eafaf1';
        case 'normal': return '#fef5e7';
        case 'hard': return '#fdedec';
        default: return '#eaf2f8';
      }
    }};
  }
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const CheckboxInput = styled.input`
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  border: 2px solid #3498db;
  border-radius: 6px;
  background-color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
  
  &:checked {
    background-color: #3498db;
    
    &::after {
      content: '✓';
      font-size: 16px;
      color: white;
    }
  }
`;

const CheckboxLabel = styled.label`
  font-size: 1rem;
  color: #34495e;
  cursor: pointer;
`;

const ButtonsGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
`;

const SaveButton = styled(motion.button)`
  padding: 0.75rem 2rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const CancelButton = styled(motion.button)`
  padding: 0.75rem 2rem;
  background-color: #ecf0f1;
  color: #34495e;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
`;

export default SettingsModal; 