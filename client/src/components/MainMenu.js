import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const MainMenu = ({ onStart, onSettings }) => {
  return (
    <MenuContainer>
      <LogoContainer
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Title>单词消消乐</Title>
        <Subtitle>Word Matching</Subtitle>
      </LogoContainer>
      
      <ButtonsContainer>
        <MenuButton 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={onStart}
        >
          开始游戏 <span>Start Game</span>
        </MenuButton>
        
        <MenuButton 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={onSettings}
        >
          设置 <span>Settings</span>
        </MenuButton>
      </ButtonsContainer>
      
      <Footer>
        <p>© 2023 单词消消乐 | Word Matching</p>
        <p>教育类休闲消除游戏</p>
      </Footer>
    </MenuContainer>
  );
};

const MenuContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  padding: 2rem;
  position: relative;
`;

const LogoContainer = styled(motion.div)`
  text-align: center;
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  font-size: 4rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
`;

const Subtitle = styled.h2`
  font-size: 2rem;
  font-weight: 400;
  color: #7f8c8d;
`;

const ButtonsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 400px;
`;

const MenuButton = styled(motion.button)`
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 1rem 2rem;
  font-size: 1.5rem;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  
  span {
    font-size: 1rem;
    opacity: 0.8;
    margin-top: 0.25rem;
  }
`;

const Footer = styled.div`
  position: absolute;
  bottom: 1rem;
  text-align: center;
  color: #95a5a6;
  font-size: 0.875rem;
  line-height: 1.5;
`;

export default MainMenu; 