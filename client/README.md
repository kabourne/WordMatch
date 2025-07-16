# 单词消消乐 (Word Matching Game)

A fun and educational word matching game built with React that helps users learn English-Chinese vocabulary pairs.

## Features

- Match English words with their Chinese translations
- Multiple difficulty levels (Easy, Normal, Hard)
- Vocabulary organized by textbook volumes and units
- Interactive card animations
- Score tracking and timing
- Smart collision detection for cards
- Error punishment mechanism that provides learning opportunities
- Settings to adjust volume, voice speed, and more
- Responsive design that works on multiple devices

## Getting Started

### Prerequisites

- Node.js (v14.x or higher)
- npm or yarn

### Installation

1. Clone the repository
```
git clone <repository-url>
cd WordMatch
```

2. Install dependencies
```
npm install
# or
yarn install
```

3. Start the development server
```
npm start
# or
yarn start
```

4. Open your browser and navigate to `http://localhost:3000`

## How to Play

1. From the main menu, click "Start Game"
2. Select a volume, unit, and difficulty level
3. Click on cards to select them:
   - First, click on either an English or Chinese word
   - Then, find and click on its matching translation
4. If you match correctly:
   - The cards will disappear with an animation
   - You'll earn points
5. If you make an incorrect match:
   - The cards will shake and reset
   - After 3 errors, the game will provide a hint
6. Complete the level by matching all word pairs

## Project Structure

- `src/components/` - React components for the game
- `src/utils/` - Utility functions and data loading
- `public/` - Static assets and HTML template

## Technologies Used

- React
- Styled Components
- Framer Motion (for animations)
- Howler.js (for audio)
- Secure API communication with RSA/AES encryption

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Educational resources and vocabulary data
- React and its ecosystem of libraries
- Contributors and testers 