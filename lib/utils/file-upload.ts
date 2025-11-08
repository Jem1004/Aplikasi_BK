/**
 * File Upload Utilities
 * Requirements: 3.3, 3.4
 * 
 * Provides helper functions for file upload operations including:
 * - File validation (type, size)
 * - Saving files with unique names
 * - Deleting old files
 */

import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * Allowed image file types for upload
 */
export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

/**
 * Maximum file size (4MB)
 */
export const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB in bytes

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate file type and size
 * Requirements: 3.1, 3.2
 * 
 * @param file - File to validate
 * @param allowedTypes - Array of allowed MIME types (default: ALLOWED_IMAGE_TYPES)
 * @param maxSize - Maximum file size in bytes (default: MAX_FILE_SIZE)
 * @returns Validation result with error message if invalid
 */
export function validateFile(
  file: File,
  allowedTypes: string[] = ALLOWED_IMAGE_TYPES,
  maxSize: number = MAX_FILE_SIZE
): FileValidationResult {
  // Check if file exists
  if (!file) {
    return {
      valid: false,
      error: 'File tidak ditemukan',
    };
  }

  // Validate file type
  if (!allowedTypes.includes(file.type)) {
    const typesList = allowedTypes
      .map((type) => type.replace('image/', '').toUpperCase())
      .join(', ');
    return {
      valid: false,
      error: `File harus berformat ${typesList}`,
    };
  }

  // Validate file size
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `Ukuran file maksimal ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}

/**
 * Generate unique filename with timestamp
 * 
 * @param originalFilename - Original filename
 * @param prefix - Prefix for the filename (default: 'file')
 * @returns Unique filename with format: {prefix}-{timestamp}.{extension}
 */
export function generateUniqueFilename(
  originalFilename: string,
  prefix: string = 'file'
): string {
  const timestamp = Date.now();
  const extension = originalFilename.split('.').pop() || 'jpg';
  return `${prefix}-${timestamp}.${extension}`;
}

/**
 * Save file to specified directory with unique name
 * Requirements: 3.3
 * 
 * @param file - File to save
 * @param uploadDir - Directory path relative to public folder (e.g., 'uploads/school')
 * @param prefix - Prefix for the filename (default: 'file')
 * @returns Object with filepath and public URL path
 */
export async function saveFile(
  file: File,
  uploadDir: string,
  prefix: string = 'file'
): Promise<{ filepath: string; publicPath: string }> {
  // Generate unique filename
  const filename = generateUniqueFilename(file.name, prefix);
  
  // Construct full directory path
  const fullUploadDir = join(process.cwd(), 'public', uploadDir);
  
  // Create directory if it doesn't exist
  await mkdir(fullUploadDir, { recursive: true });
  
  // Construct file paths
  const filepath = join(fullUploadDir, filename);
  const publicPath = `/${uploadDir}/${filename}`;
  
  // Convert file to buffer and save
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(filepath, buffer);
  
  return { filepath, publicPath };
}

/**
 * Delete file from filesystem
 * Requirements: 3.4
 * 
 * @param publicPath - Public path to the file (e.g., '/uploads/school/logo.png')
 * @returns True if file was deleted, false if file doesn't exist
 * @throws Error if deletion fails
 */
export async function deleteFile(publicPath: string): Promise<boolean> {
  if (!publicPath) {
    return false;
  }
  
  const filepath = join(process.cwd(), 'public', publicPath);
  
  // Check if file exists
  if (!existsSync(filepath)) {
    return false;
  }
  
  // Delete the file
  await unlink(filepath);
  return true;
}

/**
 * Replace existing file with new file
 * Deletes old file and saves new file
 * Requirements: 3.3, 3.4
 * 
 * @param newFile - New file to save
 * @param oldPublicPath - Public path to old file to delete (can be null)
 * @param uploadDir - Directory path relative to public folder
 * @param prefix - Prefix for the filename
 * @returns Object with filepath and public URL path of new file
 */
export async function replaceFile(
  newFile: File,
  oldPublicPath: string | null,
  uploadDir: string,
  prefix: string = 'file'
): Promise<{ filepath: string; publicPath: string }> {
  // Save new file first
  const result = await saveFile(newFile, uploadDir, prefix);
  
  // Delete old file if it exists (don't fail if deletion fails)
  if (oldPublicPath) {
    try {
      await deleteFile(oldPublicPath);
    } catch (error) {
      console.error('Failed to delete old file:', error);
      // Continue anyway - new file is already saved
    }
  }
  
  return result;
}

/**
 * Ensure upload directory exists
 * 
 * @param uploadDir - Directory path relative to public folder
 */
export async function ensureUploadDir(uploadDir: string): Promise<void> {
  const fullUploadDir = join(process.cwd(), 'public', uploadDir);
  await mkdir(fullUploadDir, { recursive: true });
}
