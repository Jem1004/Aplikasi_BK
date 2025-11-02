import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits for GCM
const TAG_LENGTH = 16; // 128 bits authentication tag

/**
 * Get the encryption key from environment variable
 * @throws {Error} If DATABASE_ENCRYPTION_KEY is not set or invalid
 */
function getEncryptionKey(): Buffer {
  const keyHex = process.env.DATABASE_ENCRYPTION_KEY;
  
  if (!keyHex) {
    throw new Error('DATABASE_ENCRYPTION_KEY environment variable is not set');
  }
  
  // Validate hex format and length (64 hex chars = 32 bytes for AES-256)
  if (!/^[0-9a-fA-F]{64}$/.test(keyHex)) {
    throw new Error('DATABASE_ENCRYPTION_KEY must be 64 hexadecimal characters (32 bytes)');
  }
  
  return Buffer.from(keyHex, 'hex');
}

/**
 * Encrypt text using AES-256-GCM
 * @param text - Plain text to encrypt
 * @returns Object containing encrypted data, IV, and authentication tag
 * @throws {Error} If encryption fails or input is invalid
 */
export function encrypt(text: string): {
  encrypted: string;
  iv: string;
  tag: string;
} {
  try {
    // Validate input
    if (typeof text !== 'string') {
      throw new Error('Input must be a string');
    }
    
    if (text.length === 0) {
      throw new Error('Input text cannot be empty');
    }
    
    // Get encryption key
    const key = getEncryptionKey();
    
    // Generate random IV for this encryption
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get authentication tag
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
    throw new Error('Encryption failed: Unknown error');
  }
}

/**
 * Decrypt text using AES-256-GCM
 * @param encrypted - Encrypted text in hex format
 * @param iv - Initialization vector in hex format
 * @param tag - Authentication tag in hex format
 * @returns Decrypted plain text
 * @throws {Error} If decryption fails, authentication fails, or inputs are invalid
 */
export function decrypt(encrypted: string, iv: string, tag: string): string {
  try {
    // Validate inputs
    if (typeof encrypted !== 'string' || typeof iv !== 'string' || typeof tag !== 'string') {
      throw new Error('All inputs must be strings');
    }
    
    if (encrypted.length === 0) {
      throw new Error('Encrypted text cannot be empty');
    }
    
    // Validate hex format
    if (!/^[0-9a-fA-F]+$/.test(encrypted)) {
      throw new Error('Encrypted text must be in hexadecimal format');
    }
    
    if (!/^[0-9a-fA-F]{32}$/.test(iv)) {
      throw new Error('IV must be 32 hexadecimal characters (16 bytes)');
    }
    
    if (!/^[0-9a-fA-F]{32}$/.test(tag)) {
      throw new Error('Authentication tag must be 32 hexadecimal characters (16 bytes)');
    }
    
    // Get encryption key
    const key = getEncryptionKey();
    
    // Create decipher
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(iv, 'hex')
    );
    
    // Set authentication tag
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    // Decrypt the text
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    if (error instanceof Error) {
      // Check if it's an authentication failure
      if (error.message.includes('Unsupported state or unable to authenticate data')) {
        throw new Error('Decryption failed: Authentication failed - data may have been tampered with');
      }
      throw new Error(`Decryption failed: ${error.message}`);
    }
    throw new Error('Decryption failed: Unknown error');
  }
}

/**
 * Validate that encryption key is properly configured
 * @returns true if key is valid
 * @throws {Error} If key is not configured or invalid
 */
export function validateEncryptionKey(): boolean {
  getEncryptionKey();
  return true;
}
