const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');
const NodeRSA = require('node-rsa');
const crypto = require('crypto');
// Load environment variables
require('dotenv').config();
// Swagger documentation
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WordMatch API',
      version: '1.0.0',
      description: 'API for WordMatch vocabulary learning application',
    },
    servers: [
      {
        url: isProduction ? 'https://wordmatch.vercel.app' : `http://localhost:${PORT}`,
        description: isProduction ? 'Production server' : 'Development server',
      },
    ],
  },
  apis: [__filename], // Path to the API docs
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Initialize RSA key from environment variables
let rsaKey;
// Check if RSA keys are provided in environment variables
if (process.env.RSA_PRIVATE_KEY) {
  rsaKey = new NodeRSA(process.env.RSA_PRIVATE_KEY);
  // Make sure to set options after importing the key
  rsaKey.setOptions({
    environment: 'browser',
    encryptionScheme: 'pkcs1' // Use PKCS#1v1.5 padding instead of default OAEP
  });
  console.log('RSA keys loaded from environment variables');
} else {
  // Fallback to generating keys (not recommended for production)
  console.warn('WARNING: RSA keys not found in environment variables. Generating temporary keys.');
  console.warn('This is NOT secure for production. Run generate-keys.js and set up your .env file.');
  rsaKey = new NodeRSA({b: 2048});
  rsaKey.setOptions({
    environment: 'browser',
    encryptionScheme: 'pkcs1'
  });
}
// Export public key for client use
const publicKeyPEM = process.env.RSA_PUBLIC_KEY || rsaKey.exportKey('public');

// Enable CORS for all routes
app.use(cors());

// Middleware to parse JSON
app.use(express.json());

/**
 * @swagger
 * /api/publicKey:
 *   get:
 *     summary: Get public RSA key
 *     description: Returns the public RSA key used for encryption
 *     responses:
 *       200:
 *         description: Public key returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 publicKey:
 *                   type: string
 *                   description: Public RSA key in PEM format
 */
app.get('/api/publicKey', (req, res) => {
  res.json({ publicKey: publicKeyPEM });
});

/**
 * @swagger
 * /api/units:
 *   get:
 *     summary: Get all available volumes and units
 *     description: Returns a list of all available vocabulary volumes and units
 *     responses:
 *       200:
 *         description: Volumes and units returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: array
 *                 items:
 *                   type: string
 *       500:
 *         description: Server error while retrieving volumes and units
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
app.get('/api/units', async (req, res) => {
  try {
    const directoryPath = path.join(__dirname, 'vocabulary_json_array');
    const files = await fs.readdir(directoryPath);
    
    // Extract volumes and units from filenames
    const volumesAndUnits = {};
    
    files.forEach(file => {
      if (file.endsWith('.json')) {
        const match = file.match(/Volume(\d+)_(?:(Unit)_(\d+)|Welcome_Unit)\.json/);
        
        if (match) {
          const volume = match[1];
          const isWelcome = !match[2];
          const unit = isWelcome ? "welcome" : match[3];
          
          if (!volumesAndUnits[volume]) {
            volumesAndUnits[volume] = [];
          }
          
          volumesAndUnits[volume].push(unit);
        }
      }
    });
    
    res.json(volumesAndUnits);
  } catch (error) {
    console.error('Error reading directory:', error);
    res.status(500).json({ error: 'Failed to get volumes and units' });
  }
});

/**
 * @swagger
 * /api/secure/vocabulary/{volume}/{unit}:
 *   post:
 *     summary: Get vocabulary data for specific volume and unit
 *     description: Returns encrypted vocabulary data for a specific volume and unit
 *     parameters:
 *       - in: path
 *         name: volume
 *         required: true
 *         description: Volume number
 *         schema:
 *           type: string
 *       - in: path
 *         name: unit
 *         required: true
 *         description: Unit number or 'welcome'
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - encryptedAesKey
 *             properties:
 *               encryptedAesKey:
 *                 type: string
 *                 description: AES key encrypted with the server's RSA public key
 *     responses:
 *       200:
 *         description: Encrypted vocabulary data returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 encryptedData:
 *                   type: string
 *                   description: Vocabulary data encrypted with AES
 *                 iv:
 *                   type: string
 *                   description: Initialization vector for AES decryption
 *                 authTag:
 *                   type: string
 *                   description: Authentication tag for GCM mode
 *                 hash:
 *                   type: string
 *                   description: SHA-256 hash of the original data
 *       400:
 *         description: Missing or invalid encrypted AES key
 *       404:
 *         description: Requested volume/unit not found
 *       500:
 *         description: Server error
 */
app.post('/api/secure/vocabulary/:volume/:unit', async (req, res) => {
  try {
    const { volume, unit } = req.params;
    const { encryptedAesKey } = req.body;
    
    if (!encryptedAesKey) {
      return res.status(400).json({ error: 'Missing encrypted AES key' });
    }
    
    // Decrypt the AES key using RSA private key
    let aesKey;
    try {
      // Make sure we're handling the base64 encoding correctly
      aesKey = rsaKey.decrypt(encryptedAesKey, 'utf8');
      console.log('AES key successfully decrypted');
    } catch (error) {
      console.error('Error decrypting AES key:', error);
      return res.status(400).json({ error: 'Invalid encrypted AES key' });
    }
    
    const fileName = unit === 'welcome' 
      ? `Volume${volume}_Welcome_Unit.json` 
      : `Volume${volume}_Unit_${unit}.json`;
    
    const filePath = path.join(__dirname, 'vocabulary_json_array', fileName);
    
    try {
      const data = await fs.readFile(filePath, 'utf8');
      const vocabulary = JSON.parse(data);
      
      // Convert vocabulary data to string for encryption
      const vocabularyString = JSON.stringify(vocabulary);
      
      // Encrypt the data with the AES key
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(aesKey, 'hex'), iv);
      let encrypted = cipher.update(vocabularyString, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      const authTag = cipher.getAuthTag().toString('base64');
      
      // Create a hash of the original data for integrity verification
      const hash = crypto.createHash('sha256').update(vocabularyString).digest('base64');
      
      // Return encrypted data to client
      res.json({
        encryptedData: encrypted,
        iv: iv.toString('base64'),
        authTag,
        hash
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        res.status(404).json({ error: `Volume ${volume} Unit ${unit} not found` });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error reading vocabulary file:', error);
    res.status(500).json({ error: 'Failed to get vocabulary data' });
  }
});

/**
 * @swagger
 * /api/secure/vocabulary/{volume}/{unit}/count/{count}:
 *   post:
 *     summary: Get specific count of vocabulary data for volume and unit
 *     description: Returns encrypted vocabulary data with only the requested count of words
 *     parameters:
 *       - in: path
 *         name: volume
 *         required: true
 *         description: Volume number
 *         schema:
 *           type: string
 *       - in: path
 *         name: unit
 *         required: true
 *         description: Unit number or 'welcome'
 *         schema:
 *           type: string
 *       - in: path
 *         name: count
 *         required: true
 *         description: Number of words to return
 *         schema:
 *           type: integer
 *           minimum: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - encryptedAesKey
 *             properties:
 *               encryptedAesKey:
 *                 type: string
 *                 description: AES key encrypted with the server's RSA public key
 *     responses:
 *       200:
 *         description: Encrypted vocabulary data returned successfully
 *       400:
 *         description: Missing or invalid encrypted AES key
 *       404:
 *         description: Requested volume/unit not found
 *       500:
 *         description: Server error
 */
app.post('/api/secure/vocabulary/:volume/:unit/count/:count', async (req, res) => {
  try {
    const { volume, unit, count } = req.params;
    const wordCount = parseInt(count, 10);
    
    if (isNaN(wordCount) || wordCount < 1) {
      return res.status(400).json({ error: 'Invalid count parameter' });
    }
    
    const { encryptedAesKey } = req.body;
    
    if (!encryptedAesKey) {
      return res.status(400).json({ error: 'Missing encrypted AES key' });
    }
    
    // Decrypt the AES key using RSA private key
    let aesKey;
    try {
      aesKey = rsaKey.decrypt(encryptedAesKey, 'utf8');
      console.log('AES key successfully decrypted');
    } catch (error) {
      console.error('Error decrypting AES key:', error);
      return res.status(400).json({ error: 'Invalid encrypted AES key' });
    }
    
    const fileName = unit === 'welcome' 
      ? `Volume${volume}_Welcome_Unit.json` 
      : `Volume${volume}_Unit_${unit}.json`;
    
    const filePath = path.join(__dirname, 'vocabulary_json_array', fileName);
    
    try {
      const data = await fs.readFile(filePath, 'utf8');
      const allVocabulary = JSON.parse(data);
      
      // Randomly select only the requested number of words
      const shuffledVocabulary = shuffleArray(allVocabulary);
      const selectedVocabulary = shuffledVocabulary.slice(0, Math.min(wordCount, shuffledVocabulary.length));
      
      // Convert selected vocabulary data to string for encryption
      const vocabularyString = JSON.stringify(selectedVocabulary);
      
      // Encrypt the data with the AES key
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(aesKey, 'hex'), iv);
      let encrypted = cipher.update(vocabularyString, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      const authTag = cipher.getAuthTag().toString('base64');
      
      // Create a hash of the original data for integrity verification
      const hash = crypto.createHash('sha256').update(vocabularyString).digest('base64');
      
      // Return encrypted data to client
      res.json({
        encryptedData: encrypted,
        iv: iv.toString('base64'),
        authTag,
        hash
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        res.status(404).json({ error: `Volume ${volume} Unit ${unit} not found` });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error reading vocabulary file:', error);
    res.status(500).json({ error: 'Failed to get vocabulary data' });
  }
});

// Helper function to shuffle array
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Start the server if we're not in a serverless environment
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
  });
}

// Export the Express app for Vercel serverless deployment
module.exports = app; 