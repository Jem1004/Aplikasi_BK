/**
 * Tests for file upload utilities
 * Requirements: 3.3, 3.4
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  validateFile,
  generateUniqueFilename,
  saveFile,
  deleteFile,
  replaceFile,
  ensureUploadDir,
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
} from '../file-upload';
import { existsSync } from 'fs';
import { join } from 'path';
import { unlink, rmdir } from 'fs/promises';

describe('File Upload Utilities', () => {
  const testUploadDir = 'uploads/test';
  const testFilePath = join(process.cwd(), 'public', testUploadDir);

  // Clean up test files after each test
  afterEach(async () => {
    try {
      // Remove test files if they exist
      const files = ['test-logo-*.png', 'test-logo-*.jpg'];
      // Note: In a real test, we'd clean up specific files created during tests
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('validateFile', () => {
    it('should validate a valid PNG file', () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const result = validateFile(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate a valid JPEG file', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = validateFile(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid file type', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File harus berformat');
    });

    it('should reject file exceeding size limit', () => {
      // Create a file larger than 2MB
      const largeContent = new Array(3 * 1024 * 1024).fill('a').join('');
      const file = new File([largeContent], 'large.png', { type: 'image/png' });
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Ukuran file maksimal');
    });

    it('should accept file at size limit', () => {
      // Create a file exactly at 2MB
      const content = new Array(2 * 1024 * 1024).fill('a').join('');
      const file = new File([content], 'exact.png', { type: 'image/png' });
      const result = validateFile(file);
      expect(result.valid).toBe(true);
    });

    it('should handle custom allowed types', () => {
      const file = new File(['test'], 'test.gif', { type: 'image/gif' });
      const result = validateFile(file, ['image/gif']);
      expect(result.valid).toBe(true);
    });

    it('should handle custom max size', () => {
      const content = new Array(1024).fill('a').join('');
      const file = new File([content], 'test.png', { type: 'image/png' });
      const result = validateFile(file, ALLOWED_IMAGE_TYPES, 512);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Ukuran file maksimal');
    });
  });

  describe('generateUniqueFilename', () => {
    it('should generate unique filename with timestamp', async () => {
      const filename1 = generateUniqueFilename('test.png', 'logo');
      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 2));
      const filename2 = generateUniqueFilename('test.png', 'logo');
      
      expect(filename1).toMatch(/^logo-\d+\.png$/);
      expect(filename2).toMatch(/^logo-\d+\.png$/);
      // Filenames should be different due to timestamp
      expect(filename1).not.toBe(filename2);
    });

    it('should use default prefix if not provided', () => {
      const filename = generateUniqueFilename('test.jpg');
      expect(filename).toMatch(/^file-\d+\.jpg$/);
    });

    it('should extract correct extension', () => {
      const filename = generateUniqueFilename('image.jpeg', 'photo');
      expect(filename).toMatch(/^photo-\d+\.jpeg$/);
    });

    it('should handle files without extension', () => {
      const filename = generateUniqueFilename('noext', 'file');
      // When no extension is found, it uses 'noext' as the extension
      expect(filename).toMatch(/^file-\d+\.noext$/);
    });
  });

  describe('ensureUploadDir', () => {
    it('should create directory if it does not exist', async () => {
      const testDir = 'uploads/test-new-dir';
      const fullPath = join(process.cwd(), 'public', testDir);
      
      await ensureUploadDir(testDir);
      
      expect(existsSync(fullPath)).toBe(true);
      
      // Cleanup
      try {
        await rmdir(fullPath);
      } catch (error) {
        // Ignore
      }
    });
  });

  describe('File operations constants', () => {
    it('should have correct allowed image types', () => {
      expect(ALLOWED_IMAGE_TYPES).toEqual([
        'image/png',
        'image/jpeg',
        'image/jpg',
      ]);
    });

    it('should have correct max file size (2MB)', () => {
      expect(MAX_FILE_SIZE).toBe(2 * 1024 * 1024);
    });
  });
});
