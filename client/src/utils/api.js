/**
 * API module for communicating with the WordMatch server
 */
import config from './config';

const API = {
  // Base URL for API requests
  API_BASE_URL: config.API_BASE_URL,

  /**
   * Fetch all available units from the server
   * @returns {Promise<Object>} Object mapping volumes to their units
   */
  async getAllUnits() {
    try {
      const response = await fetch(`${this.API_BASE_URL}/units`);
      
      if (!response.ok) {
        throw new Error('Unable to load available units');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching available units:', error);
      return {};
    }
  },

  /**
   * Get the public key for secure communication
   * @returns {Promise<string>} The server's public RSA key
   */
  async getPublicKey() {
    try {
      const response = await fetch(`${this.API_BASE_URL}/publicKey`);
      
      if (!response.ok) {
        throw new Error('Unable to fetch public key');
      }
      
      const data = await response.json();
      return data.publicKey;
    } catch (error) {
      console.error('Error fetching public key:', error);
      return null;
    }
  }
};

export default API; 