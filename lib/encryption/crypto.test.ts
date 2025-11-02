import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { encrypt, decrypt, validateEncryptionKey } from './crypto';

describe('Encryption Utilities', () => {
  const originalEnv = process.env.DATABASE_ENCRYPTION_KEY;

  beforeAll(() => {
    // Ensure encryption key is set for tests
    process.env.DATABASE_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  });

  afterAll(() => {
    // Restore original environment
    process.env.DATABASE_ENCRYPTION_KEY = originalEnv;
  });

  describe('validateEncryptionKey', () => {
    it('should validate a properly configured encryption key', () => {
      expect(() => validateEncryptionKey()).not.toThrow();
      expect(validateEncryptionKey()).toBe(true);
    });

    it('should throw error when encryption key is not set', () => {
      const key = process.env.DATABASE_ENCRYPTION_KEY;
      delete process.env.DATABASE_ENCRYPTION_KEY;
      
      expect(() => validateEncryptionKey()).toThrow('DATABASE_ENCRYPTION_KEY environment variable is not set');
      
      process.env.DATABASE_ENCRYPTION_KEY = key;
    });

    it('should throw error when encryption key has invalid length', () => {
      const key = process.env.DATABASE_ENCRYPTION_KEY;
      process.env.DATABASE_ENCRYPTION_KEY = '0123456789abcdef'; // Too short
      
      expect(() => validateEncryptionKey()).toThrow('DATABASE_ENCRYPTION_KEY must be 64 hexadecimal characters');
      
      process.env.DATABASE_ENCRYPTION_KEY = key;
    });

    it('should throw error when encryption key has invalid format', () => {
      const key = process.env.DATABASE_ENCRYPTION_KEY;
      process.env.DATABASE_ENCRYPTION_KEY = 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz'; // Invalid hex
      
      expect(() => validateEncryptionKey()).toThrow('DATABASE_ENCRYPTION_KEY must be 64 hexadecimal characters');
      
      process.env.DATABASE_ENCRYPTION_KEY = key;
    });
  });

  describe('encrypt', () => {
    it('should encrypt a simple string', () => {
      const plaintext = 'Hello, World!';
      const result = encrypt(plaintext);
      
      expect(result).toHaveProperty('encrypted');
      expect(result).toHaveProperty('iv');
      expect(result).toHaveProperty('tag');
      expect(result.encrypted).toBeTruthy();
      expect(result.iv).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(result.tag).toHaveLength(32); // 16 bytes = 32 hex chars
    });

    it('should generate different IVs for same plaintext', () => {
      const plaintext = 'Same text';
      const result1 = encrypt(plaintext);
      const result2 = encrypt(plaintext);
      
      expect(result1.iv).not.toBe(result2.iv);
      expect(result1.encrypted).not.toBe(result2.encrypted);
      expect(result1.tag).not.toBe(result2.tag);
    });

    it('should encrypt empty string and throw error', () => {
      expect(() => encrypt('')).toThrow('Input text cannot be empty');
    });

    it('should throw error for non-string input', () => {
      expect(() => encrypt(123 as any)).toThrow('Input must be a string');
      expect(() => encrypt(null as any)).toThrow('Input must be a string');
      expect(() => encrypt(undefined as any)).toThrow('Input must be a string');
    });

    it('should encrypt text with special characters', () => {
      const plaintext = 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      const result = encrypt(plaintext);
      
      expect(result.encrypted).toBeTruthy();
      expect(result.iv).toHaveLength(32);
      expect(result.tag).toHaveLength(32);
    });

    it('should encrypt text with unicode characters', () => {
      const plaintext = 'Unicode: 你好世界 🌍 مرحبا';
      const result = encrypt(plaintext);
      
      expect(result.encrypted).toBeTruthy();
      expect(result.iv).toHaveLength(32);
      expect(result.tag).toHaveLength(32);
    });

    it('should encrypt multiline text', () => {
      const plaintext = `Line 1
Line 2
Line 3`;
      const result = encrypt(plaintext);
      
      expect(result.encrypted).toBeTruthy();
      expect(result.iv).toHaveLength(32);
      expect(result.tag).toHaveLength(32);
    });
  });

  describe('decrypt', () => {
    it('should decrypt encrypted text correctly', () => {
      const plaintext = 'Hello, World!';
      const { encrypted, iv, tag } = encrypt(plaintext);
      const decrypted = decrypt(encrypted, iv, tag);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should throw error for empty encrypted text', () => {
      const { iv, tag } = encrypt('test');
      expect(() => decrypt('', iv, tag)).toThrow('Encrypted text cannot be empty');
    });

    it('should throw error for invalid encrypted text format', () => {
      const { iv, tag } = encrypt('test');
      expect(() => decrypt('not-hex-format', iv, tag)).toThrow('Encrypted text must be in hexadecimal format');
    });

    it('should throw error for invalid IV length', () => {
      const { encrypted, tag } = encrypt('test');
      expect(() => decrypt(encrypted, 'short', tag)).toThrow('IV must be 32 hexadecimal characters');
    });

    it('should throw error for invalid tag length', () => {
      const { encrypted, iv } = encrypt('test');
      expect(() => decrypt(encrypted, iv, 'short')).toThrow('Authentication tag must be 32 hexadecimal characters');
    });

    it('should throw error for non-string inputs', () => {
      const { encrypted, iv, tag } = encrypt('test');
      expect(() => decrypt(123 as any, iv, tag)).toThrow('All inputs must be strings');
      expect(() => decrypt(encrypted, 123 as any, tag)).toThrow('All inputs must be strings');
      expect(() => decrypt(encrypted, iv, 123 as any)).toThrow('All inputs must be strings');
    });

    it('should throw error when authentication tag is invalid (tampered data)', () => {
      const { encrypted, iv } = encrypt('test');
      const invalidTag = '00000000000000000000000000000000';
      
      expect(() => decrypt(encrypted, iv, invalidTag)).toThrow('Authentication failed');
    });

    it('should throw error when encrypted data is tampered', () => {
      const { encrypted, iv, tag } = encrypt('test');
      const tamperedEncrypted = encrypted.slice(0, -2) + 'ff';
      
      expect(() => decrypt(tamperedEncrypted, iv, tag)).toThrow('Authentication failed');
    });
  });

  describe('encrypt/decrypt round-trip', () => {
    it('should handle short text (< 16 bytes)', () => {
      const plaintext = 'Short';
      const { encrypted, iv, tag } = encrypt(plaintext);
      const decrypted = decrypt(encrypted, iv, tag);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should handle medium text (~ 100 bytes)', () => {
      const plaintext = 'This is a medium-length text that contains approximately one hundred bytes of data for testing.';
      const { encrypted, iv, tag } = encrypt(plaintext);
      const decrypted = decrypt(encrypted, iv, tag);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should handle large text (~ 1KB)', () => {
      const plaintext = 'A'.repeat(1024);
      const { encrypted, iv, tag } = encrypt(plaintext);
      const decrypted = decrypt(encrypted, iv, tag);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should handle very large text (~ 10KB)', () => {
      const plaintext = 'Lorem ipsum dolor sit amet. '.repeat(400); // ~10KB
      const { encrypted, iv, tag } = encrypt(plaintext);
      const decrypted = decrypt(encrypted, iv, tag);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should handle text with special characters', () => {
      const plaintext = 'Special: !@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      const { encrypted, iv, tag } = encrypt(plaintext);
      const decrypted = decrypt(encrypted, iv, tag);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should handle text with unicode characters', () => {
      const plaintext = 'Unicode: 你好世界 🌍 مرحبا العالم Привет мир';
      const { encrypted, iv, tag } = encrypt(plaintext);
      const decrypted = decrypt(encrypted, iv, tag);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should handle multiline text', () => {
      const plaintext = `First line
Second line with special chars: !@#$
Third line with unicode: 你好
Fourth line`;
      const { encrypted, iv, tag } = encrypt(plaintext);
      const decrypted = decrypt(encrypted, iv, tag);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should handle JSON data', () => {
      const jsonData = JSON.stringify({
        studentId: '123',
        sessionDate: '2024-01-01',
        notes: 'Counseling session notes with special chars: !@#$',
        topics: ['academic', 'personal', 'career']
      });
      const { encrypted, iv, tag } = encrypt(jsonData);
      const decrypted = decrypt(encrypted, iv, tag);
      
      expect(decrypted).toBe(jsonData);
      expect(JSON.parse(decrypted)).toEqual(JSON.parse(jsonData));
    });

    it('should handle HTML content', () => {
      const htmlContent = '<div class="content"><p>This is <strong>important</strong> content.</p></div>';
      const { encrypted, iv, tag } = encrypt(htmlContent);
      const decrypted = decrypt(encrypted, iv, tag);
      
      expect(decrypted).toBe(htmlContent);
    });

    it('should handle text with tabs and newlines', () => {
      const plaintext = 'Line 1\n\tIndented line\n\t\tDouble indented\nNormal line';
      const { encrypted, iv, tag } = encrypt(plaintext);
      const decrypted = decrypt(encrypted, iv, tag);
      
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('security properties', () => {
    it('should produce different ciphertext for same plaintext (due to random IV)', () => {
      const plaintext = 'Same plaintext';
      const result1 = encrypt(plaintext);
      const result2 = encrypt(plaintext);
      
      expect(result1.encrypted).not.toBe(result2.encrypted);
      expect(result1.iv).not.toBe(result2.iv);
      
      // But both should decrypt to same plaintext
      expect(decrypt(result1.encrypted, result1.iv, result1.tag)).toBe(plaintext);
      expect(decrypt(result2.encrypted, result2.iv, result2.tag)).toBe(plaintext);
    });

    it('should not allow decryption with wrong IV', () => {
      const plaintext = 'Secret message';
      const { encrypted, tag } = encrypt(plaintext);
      const wrongIv = '00000000000000000000000000000000';
      
      expect(() => decrypt(encrypted, wrongIv, tag)).toThrow();
    });

    it('should detect tampering with encrypted data', () => {
      const plaintext = 'Important data';
      const { encrypted, iv, tag } = encrypt(plaintext);
      
      // Tamper with encrypted data
      const tamperedEncrypted = encrypted.slice(0, -4) + 'ffff';
      
      expect(() => decrypt(tamperedEncrypted, iv, tag)).toThrow('Authentication failed');
    });

    it('should validate data integrity with authentication tag', () => {
      const plaintext = 'Authenticated message';
      const { encrypted, iv, tag } = encrypt(plaintext);
      
      // Correct tag should work
      expect(() => decrypt(encrypted, iv, tag)).not.toThrow();
      
      // Wrong tag should fail
      const wrongTag = tag.slice(0, -2) + 'ff';
      expect(() => decrypt(encrypted, iv, wrongTag)).toThrow();
    });
  });
});
