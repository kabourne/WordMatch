import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const PauseMenu = ({ onResume, onSettings, onQuit }) => {
  return (
    <OverlayContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <MenuContainer
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <MenuHeader>
          <Title>游戏暂停</Title>
          <Subtitle>Game Paused</Subtitle>
        </MenuHeader>
        
        <ButtonsContainer>
          <MenuButton 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onResume}
            $primary
          >
            继续游戏 <span>Continue</span>
          </MenuButton>
          
          <MenuButton 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSettings}
          >
            设置 <span>Settings</span>
          </MenuButton>
          
          <MenuButton 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onQuit}
            $warning
          >
            退出 <span>Quit</span>
          </MenuButton>
        </ButtonsContainer>
        
        <Footer>
          点击外部区域继续游戏
          <FooterEn>Click outside to resume</FooterEn>
        </Footer>
      </MenuContainer>
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

const MenuContainer = styled(motion.div)`
  background-color: white;
  padding: 2.5rem;
  border-radius: 20px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const MenuHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const Title = styled.h2`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #2c3e50;
`;

const Subtitle = styled.p`
  font-size: 1.25rem;
  color: #7f8c8d;
`;

const ButtonsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
`;

const MenuButton = styled(motion.button)`
  padding: 1rem;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 1.25rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  
  background-color: ${props => {
    if (props.$primary) return '#3498db';
    if (props.$warning) return '#e74c3c';
    return '#ecf0f1';
  }};
  
  color: ${props => {
    if (props.$primary || props.$warning) return 'white';
    return '#2c3e50';
  }};
  
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  
  span {
    font-size: 0.9rem;
    opacity: 0.8;
    margin-top: 0.25rem;
  }
`;

const Footer = styled.div`
  margin-top: 2rem;
  text-align: center;
  font-size: 0.9rem;
  color: #7f8c8d;
`;

const FooterEn = styled.span`
  display: block;
  font-size: 0.8rem;
  margin-top: 0.25rem;
  opacity: 0.8;
`;

export default PauseMenu; 