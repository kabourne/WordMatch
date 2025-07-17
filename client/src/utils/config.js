/**
 * Configuration settings for WordMatch client
 */

const config = {
  // API Base URL - defaults to localhost for development
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api',
  
  // Volumes and units available in the game (as fallback if API fails)
  VOLUMES: [1, 2, 3, 4, 5, 6, 7],
  UNITS: ['Welcome_Unit', 1, 2, 3, 4, 5]
};

export default config; 