# File Upload Utilities

## Overview

This module provides reusable file upload utilities for the application, specifically designed for handling school logo uploads but can be used for other file upload needs.

## Requirements Covered

- **3.3**: Save file dengan unique name
- **3.4**: Delete old file

## Files Created

### 1. `lib/utils/file-upload.ts`

Main utility module with the following functions:

#### `validateFile(file, allowedTypes?, maxSize?)`
Validates file type and size before upload.

**Parameters:**
- `file`: File object to validate
- `allowedTypes`: Array of allowed MIME types (default: PNG, JPG, JPEG)
- `maxSize`: Maximum file size in bytes (default: 2MB)

**Returns:** `{ valid: boolean, error?: string }`

**Example:**
```typescript
const validation = validateFile(file);
if (!validation.valid) {
  return createErrorResponse(validation.error);
}
```

#### `generateUniqueFilename(originalFilename, prefix?)`
Generates unique filename with timestamp.

**Parameters:**
- `originalFilename`: Original filename with extension
- `prefix`: Prefix for the filename (default: 'file')

**Returns:** String in format `{prefix}-{timestamp}.{extension}`

**Example:**
```typescript
const filename = generateUniqueFilename('logo.png', 'school-logo');
// Returns: school-logo-1699012345678.png
```

#### `saveFile(file, uploadDir, prefix?)`
Saves file to specified directory with unique name.

**Parameters:**
- `file`: File object to save
- `uploadDir`: Directory path relative to public folder (e.g., 'uploads/school')
- `prefix`: Prefix for the filename (default: 'file')

**Returns:** `{ filepath: string, publicPath: string }`

**Example:**
```typescript
const { publicPath } = await saveFile(file, 'uploads/school', 'school-logo');
// publicPath: /uploads/school/school-logo-1699012345678.png
```

#### `deleteFile(publicPath)`
Deletes file from filesystem.

**Parameters:**
- `publicPath`: Public path to the file (e.g., '/uploads/school/logo.png')

**Returns:** `boolean` - true if deleted, false if file doesn't exist

**Example:**
```typescript
const deleted = await deleteFile('/uploads/school/old-logo.png');
if (!deleted) {
  console.log('File not found or already deleted');
}
```

#### `replaceFile(newFile, oldPublicPath, uploadDir, prefix?)`
Replaces existing file with new file (saves new, deletes old).

**Parameters:**
- `newFile`: New file to save
- `oldPublicPath`: Public path to old file (can be null)
- `uploadDir`: Directory path relative to public folder
- `prefix`: Prefix for the filename

**Returns:** `{ filepath: string, publicPath: string }`

**Example:**
```typescript
const { publicPath } = await replaceFile(
  newFile,
  oldLogoPath,
  'uploads/school',
  'school-logo'
);
```

#### `ensureUploadDir(uploadDir)`
Creates upload directory if it doesn't exist.

**Parameters:**
- `uploadDir`: Directory path relative to public folder

**Example:**
```typescript
await ensureUploadDir('uploads/school');
```

### 2. `public/uploads/school/.gitkeep`

Ensures the upload directory is tracked by git.

### 3. `lib/utils/__tests__/file-upload.test.ts`

Comprehensive test suite covering:
- File validation (type, size)
- Unique filename generation
- Directory creation
- Constants verification

**Test Results:** ✅ 14/14 tests passing

## Integration

The utilities are integrated into `lib/actions/admin/school-info.ts`:

### Before (Inline Implementation)
```typescript
// Validate file type
const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
if (!allowedTypes.includes(file.type)) {
  return createErrorResponse('File harus berformat PNG, JPG, atau JPEG');
}

// Validate file size
const maxSize = 2 * 1024 * 1024;
if (file.size > maxSize) {
  return createErrorResponse('Ukuran file maksimal 2MB');
}

// Generate unique filename and save
const timestamp = Date.now();
const extension = file.name.split('.').pop();
const filename = `school-logo-${timestamp}.${extension}`;
// ... more code
```

### After (Using Utilities)
```typescript
// Validate file
const validation = validateFile(file);
if (!validation.valid) {
  return createErrorResponse(validation.error!);
}

// Save and replace old file
const { publicPath: logoPath } = await replaceFile(
  file,
  schoolInfo.logoPath,
  'uploads/school',
  'school-logo'
);
```

## Benefits

1. **Reusability**: Can be used for other file upload features
2. **Maintainability**: Centralized file handling logic
3. **Testability**: Isolated functions easy to test
4. **Consistency**: Same validation and naming across the app
5. **Error Handling**: Graceful handling of edge cases

## Constants

```typescript
ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg']
MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
```

## File Naming Convention

Format: `{prefix}-{timestamp}.{extension}`

Examples:
- `school-logo-1699012345678.png`
- `school-logo-1699012456789.jpg`

## Directory Structure

```
public/
  uploads/
    school/
      .gitkeep
      school-logo-1699012345678.png
      school-logo-1699012456789.jpg
```

## Security Considerations

1. ✅ File type validation (whitelist approach)
2. ✅ File size validation (2MB limit)
3. ✅ Unique filename generation (prevents overwrites)
4. ✅ Server-side validation (not just client-side)
5. ✅ Graceful error handling

## Future Enhancements

- Image optimization/compression on upload
- Support for more file types (PDF, etc.)
- Thumbnail generation
- Cloud storage integration (S3, etc.)
- Virus scanning
- Image dimension validation
