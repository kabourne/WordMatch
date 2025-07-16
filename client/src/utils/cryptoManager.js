/**
 * Cryptography management module for secure API communication
 * Based on the WordMaster implementation
 */

import API from './api.js';
import CryptoJS from 'crypto-js';
import JSEncrypt from 'jsencrypt';

const CryptoManager = (() => {
    // Internal state
    let publicKey = null;
    let isInitialized = false;
    
    // Initialize the crypto manager
    async function init(serverPublicKey) {
        try {
            // Use provided key or fetch from server if not provided
            if (serverPublicKey) {
                publicKey = serverPublicKey;
            } else {
                // Fetch the server's public key
                const fetchedPublicKey = await API.getPublicKey();
                
                if (!fetchedPublicKey) {
                    throw new Error('Failed to fetch public key');
                }
                
                publicKey = fetchedPublicKey;
            }
            
            isInitialized = true;
            
            console.log('CryptoManager initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing CryptoManager:', error);
            return false;
        }
    }
    
    // Generate random AES key (32 bytes / 256 bits as hex string)
    function generateAesKey() {
        // Generate a 32-byte (256-bit) key
        const array = new Uint8Array(32);
        window.crypto.getRandomValues(array);
        // Convert to hex string for consistent format across platforms
        return Array.from(array)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
    
    // Encrypt AES key with RSA public key
    function encryptAesKey(aesKey) {
        if (!isInitialized || !publicKey) {
            throw new Error('CryptoManager not initialized');
        }
        
        try {
            // Create JSEncrypt instance for RSA encryption
            const jsEncrypt = new JSEncrypt();
            jsEncrypt.setPublicKey(publicKey);
            
            // Encrypt the AES key (JSEncrypt uses PKCS#1v1.5 padding by default)
            const encrypted = jsEncrypt.encrypt(aesKey);
            
            if (!encrypted) {
                throw new Error('Failed to encrypt AES key');
            }
            
            return encrypted;
        } catch (error) {
            throw new Error('Failed to encrypt AES key', error);
        }
    }
    
    // Decrypt data using AES key
    async function decryptData(encryptedData, iv, authTag, aesKey) {
        // Convert parameters to the right format for Web Crypto API
        const key = await importAesKey(aesKey);
        const ivBuffer = base64ToArrayBuffer(iv);
        const encryptedBuffer = base64ToArrayBuffer(encryptedData);
        const authTagBuffer = base64ToArrayBuffer(authTag);
        
        // Combine encrypted data and authentication tag as required by AES-GCM
        const combinedBuffer = concatArrayBuffers(encryptedBuffer, authTagBuffer);
        
        // Decrypt using Web Crypto API
        try {
            const decrypted = await window.crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: ivBuffer,
                    tagLength: 128 // 16 bytes auth tag
                },
                key,
                combinedBuffer
            );
            
            // Convert the decrypted ArrayBuffer to a string
            const decoder = new TextDecoder();
            const decryptedText = decoder.decode(decrypted);
            
            return decryptedText;
        } catch (error) {
            throw new Error('Failed to decrypt data');
        }
    }
    
    // Verify data integrity using hash
    function verifyDataIntegrity(decryptedData, expectedHash) {
        // Create SHA-256 hash from the decrypted data
        const calculatedHash = sha256(decryptedData);
        
        // Compare with the expected hash
        return calculatedHash === expectedHash;
    }
    
    // Helper function to calculate SHA-256 hash
    function sha256(data) {
        const hash = CryptoJS.SHA256(data);
        return CryptoJS.enc.Base64.stringify(hash);
    }
    
    // Helper function to import AES key into Web Crypto API
    async function importAesKey(hexKey) {
        // Convert hex key to ArrayBuffer
        const keyBuffer = hexToArrayBuffer(hexKey);
        
        // Import the key for use with AES-GCM
        return await window.crypto.subtle.importKey(
            'raw',
            keyBuffer,
            { name: 'AES-GCM' },
            false,
            ['decrypt']
        );
    }
    
    // Helper function to convert base64 to ArrayBuffer
    function base64ToArrayBuffer(base64) {
        const binaryString = window.atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }
    
    // Helper function to convert hex to ArrayBuffer
    function hexToArrayBuffer(hexString) {
        const bytes = new Uint8Array(hexString.length / 2);
        for (let i = 0; i < hexString.length; i += 2) {
            bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
        }
        return bytes.buffer;
    }
    
    // Helper function to concatenate ArrayBuffers
    function concatArrayBuffers(buffer1, buffer2) {
        const result = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
        result.set(new Uint8Array(buffer1), 0);
        result.set(new Uint8Array(buffer2), buffer1.byteLength);
        return result.buffer;
    }
    
    // Public API
    return {
        init,
        generateAesKey,
        encryptAesKey,
        decryptData,
        verifyDataIntegrity,
        isInitialized: () => isInitialized
    };
})();

export default CryptoManager; 