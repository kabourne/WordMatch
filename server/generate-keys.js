const NodeRSA = require('node-rsa');
const fs = require('fs');

// Generate RSA key pair with PKCS#1v1.5 padding to match JSEncrypt
const rsaKey = new NodeRSA({b: 2048});
rsaKey.setOptions({
  environment: 'browser',
  encryptionScheme: 'pkcs1' // Use PKCS#1v1.5 padding instead of default OAEP
});

const publicKeyPEM = rsaKey.exportKey('public');
const privateKeyPEM = rsaKey.exportKey('private');

// Create .env file content
const envFileContent = `# RSA keys for encryption
# These keys were generated with generate-keys.js
# Do not share the private key!

RSA_PUBLIC_KEY="${publicKeyPEM.replace(/\n/g, '\\n')}"
RSA_PRIVATE_KEY="${privateKeyPEM.replace(/\n/g, '\\n')}"

# Server configuration
PORT=3000
NODE_ENV=development
`;

// Write to .env file
fs.writeFileSync('.env', envFileContent);
console.log('RSA keys generated successfully!');
console.log('Keys have been saved to .env file');
console.log('Make sure .env is listed in your .gitignore file to keep your keys secure'); 