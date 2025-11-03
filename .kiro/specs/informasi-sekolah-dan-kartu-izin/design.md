# Design Document

## Overview

Fitur ini menambahkan manajemen informasi sekolah di master data dan mengubah format kartu izin dari surat formal menjadi format struk thermal printer (80mm). Desain ini memastikan informasi sekolah dapat dikelola secara terpusat dan digunakan di berbagai dokumen sistem.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin Dashboard                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Master Data Menu                                       │ │
│  │  - Academic Years                                       │ │
│  │  - Classes                                              │ │
│  │  - Violation Types                                      │ │
│  │  - School Information (NEW)  ◄─────────────────────────┼─┤
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              School Info Management Module                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  - CRUD Operations                                      │ │
│  │  - Logo Upload                                          │ │
│  │  - Validation                                           │ │
│  │  - Audit Logging                                        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  SchoolInfo Table                                       │ │
│  │  - id, name, address, phone, email, website            │ │
│  │  - principalName, principalNip, logoPath               │ │
│  │  - createdAt, updatedAt                                │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Permission Card Module (Updated)                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Receipt Format Component                               │ │
│  │  - 80mm width layout                                    │ │
│  │  - School info integration                              │ │
│  │  - Thermal printer optimized                            │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Database Schema

#### SchoolInfo Model (New)

```prisma
model SchoolInfo {
  id            String   @id @default(cuid())
  name          String   @db.VarChar(200)
  address       String   @db.VarChar(500)
  phone         String   @db.VarChar(20)
  email         String   @db.VarChar(100)
  website       String?  @db.VarChar(100)
  principalName String   @db.VarChar(100)
  principalNip  String   @db.VarChar(18)
  logoPath      String?  @db.VarChar(255)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("school_info")
}
```

### 2. API Actions

#### School Info Actions (`lib/actions/admin/school-info.ts`)

```typescript
// Get school info (single record)
export async function getSchoolInfo(): Promise<ActionResult<SchoolInfo>>

// Create or update school info
export async function upsertSchoolInfo(
  data: SchoolInfoFormData
): Promise<ActionResult<SchoolInfo>>

// Upload school logo
export async function uploadSchoolLogo(
  formData: FormData
): Promise<ActionResult<{ logoPath: string }>>

// Delete school logo
export async function deleteSchoolLogo(): Promise<ActionResult<void>>
```



### 3. UI Components

#### SchoolInfoForm Component

```typescript
// components/admin/SchoolInfoForm.tsx
interface SchoolInfoFormProps {
  initialData?: SchoolInfo | null;
}

// Features:
// - Form with all school info fields
// - Logo upload with preview
// - Validation with react-hook-form + zod
// - Loading states
// - Success/error notifications
```

#### PermissionReceiptView Component (New)

```typescript
// components/guru-bk/PermissionReceiptView.tsx
interface PermissionReceiptViewProps {
  printData: PermissionPrintData & { schoolInfo: SchoolInfo | null };
  onClose: () => void;
}

// Features:
// - 80mm width layout
// - School logo display
// - Compact information display
// - Thermal printer CSS
// - Print preview
```

### 4. Page Routes

#### Admin School Info Page

```
Route: /admin/master-data/school-info
Component: app/(dashboard)/admin/master-data/school-info/page.tsx
Access: ADMIN only
```

## Data Models

### SchoolInfo Type

```typescript
type SchoolInfo = {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string | null;
  principalName: string;
  principalNip: string;
  logoPath: string | null;
  createdAt: Date;
  updatedAt: Date;
};
```

### SchoolInfoFormData Type

```typescript
type SchoolInfoFormData = {
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  principalName: string;
  principalNip: string;
};
```

### Updated PermissionPrintData Type

```typescript
type PermissionPrintData = {
  // Existing fields...
  id: string;
  permissionNumber: string;
  studentName: string;
  nis: string;
  className: string;
  permissionType: string;
  date: string;
  startTime: string;
  endTime: string | null;
  destination: string | null;
  reason: string;
  issuedBy: string;
  issuedAt: string;
  
  // New field
  schoolInfo: SchoolInfo | null;
};
```

## Validation Schema

### School Info Validation

```typescript
// lib/validations/school-info.ts
import { z } from 'zod';

export const schoolInfoSchema = z.object({
  name: z.string()
    .min(5, 'Nama sekolah minimal 5 karakter')
    .max(200, 'Nama sekolah maksimal 200 karakter'),
  
  address: z.string()
    .min(10, 'Alamat minimal 10 karakter')
    .max(500, 'Alamat maksimal 500 karakter'),
  
  phone: z.string()
    .regex(/^(\+62|62|0)[0-9]{9,12}$/, 'Format nomor telepon tidak valid'),
  
  email: z.string()
    .email('Format email tidak valid')
    .max(100, 'Email maksimal 100 karakter'),
  
  website: z.string()
    .url('Format website tidak valid')
    .max(100, 'Website maksimal 100 karakter')
    .optional()
    .or(z.literal('')),
  
  principalName: z.string()
    .min(3, 'Nama kepala sekolah minimal 3 karakter')
    .max(100, 'Nama kepala sekolah maksimal 100 karakter'),
  
  principalNip: z.string()
    .regex(/^[0-9]{18}$/, 'NIP harus 18 digit angka'),
});

export const logoUploadSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 2 * 1024 * 1024, 'Ukuran file maksimal 2MB')
    .refine(
      (file) => ['image/png', 'image/jpeg', 'image/jpg'].includes(file.type),
      'File harus berformat PNG, JPG, atau JPEG'
    ),
});
```

## File Upload Strategy

### Logo Upload Flow

1. User selects image file
2. Client validates file size and type
3. File uploaded via FormData to API
4. Server validates file again
5. File saved to `public/uploads/school/` with unique name
6. Path saved to database
7. Old logo deleted if exists

### File Naming Convention

```
Format: school-logo-{timestamp}.{ext}
Example: school-logo-1699012345678.png
```

### Storage Structure

```
public/
  uploads/
    school/
      school-logo-1699012345678.png
      school-logo-1699012456789.jpg
```

## Receipt Format Design

### Layout Specifications

```
┌────────────────────────────────────┐
│         [LOGO SEKOLAH]             │  ← 60x60px, centered
│                                    │
│      SMA NEGERI 1 JAKARTA          │  ← Bold, 14pt
│   Jl. Sudirman No. 123, Jakarta    │  ← 10pt
│      Telp: 021-1234567             │  ← 10pt
│                                    │
├────────────────────────────────────┤  ← Dashed line
│                                    │
│         KARTU IZIN SISWA           │  ← Bold, 12pt
│      No: PRM/2024/001              │  ← 10pt
│                                    │
├────────────────────────────────────┤
│                                    │
│ Nama    : Ahmad Fauzi              │  ← 10pt
│ NIS     : 12345                    │
│ Kelas   : X IPA 1                  │
│                                    │
│ Jenis   : Sakit                    │
│ Tanggal : 03 Nov 2024              │
│ Waktu   : 07:00 - 12:00            │
│                                    │
│ Alasan:                            │
│ Sakit demam dan perlu istirahat    │
│                                    │
├────────────────────────────────────┤
│                                    │
│ Guru BK: Ibu Siti Nurhaliza        │  ← 10pt
│                                    │
│ [Tanda Tangan Digital]             │
│                                    │
├────────────────────────────────────┤
│                                    │
│ Dicetak: 03 Nov 2024 08:30         │  ← 8pt, gray
│ Ref: clx1234567890                 │
│                                    │
└────────────────────────────────────┘

Width: 80mm (302px @ 96dpi)
Font: Monospace or Sans-serif
Line height: 1.4
Padding: 8px
```

### CSS for Thermal Printer

```css
@media print {
  @page {
    size: 80mm auto;
    margin: 0;
  }
  
  body {
    width: 80mm;
    font-family: 'Courier New', monospace;
    font-size: 10pt;
    line-height: 1.4;
  }
  
  .receipt-container {
    width: 80mm;
    padding: 8px;
  }
  
  .receipt-logo {
    width: 60px;
    height: 60px;
    margin: 0 auto;
  }
  
  .receipt-header {
    text-align: center;
    font-weight: bold;
  }
  
  .receipt-divider {
    border-top: 1px dashed #000;
    margin: 8px 0;
  }
  
  .receipt-field {
    display: flex;
    gap: 8px;
  }
  
  .receipt-label {
    min-width: 60px;
    font-weight: bold;
  }
}
```

## Error Handling

### School Info Errors

```typescript
// Custom error types
class SchoolInfoNotFoundError extends Error {
  constructor() {
    super('Informasi sekolah belum diatur. Silakan hubungi administrator.');
  }
}

class LogoUploadError extends Error {
  constructor(message: string) {
    super(`Gagal mengunggah logo: ${message}`);
  }
}

// Error handling in actions
try {
  const schoolInfo = await getSchoolInfo();
  if (!schoolInfo) {
    throw new SchoolInfoNotFoundError();
  }
} catch (error) {
  return {
    success: false,
    error: error.message,
  };
}
```

## Testing Strategy

### Unit Tests

1. Validation schema tests
   - Valid school info data
   - Invalid phone format
   - Invalid email format
   - Invalid NIP format
   - Logo file size validation
   - Logo file type validation

2. Action tests
   - Get school info
   - Create school info
   - Update school info
   - Upload logo
   - Delete logo

### Integration Tests

1. School info CRUD flow
   - Create new school info
   - Read school info
   - Update school info
   - Verify audit logs

2. Logo upload flow
   - Upload new logo
   - Replace existing logo
   - Delete logo
   - Verify file system

3. Permission card integration
   - Print card with school info
   - Print card without school info (fallback)
   - Verify school info in print data

### Component Tests

1. SchoolInfoForm
   - Form validation
   - Submit success
   - Submit error
   - Logo upload
   - Logo preview

2. PermissionReceiptView
   - Render with school info
   - Render without school info
   - Print functionality
   - Responsive layout

## Security Considerations

### File Upload Security

1. File type validation (whitelist: PNG, JPG, JPEG)
2. File size limit (2MB max)
3. Sanitize filename
4. Store outside web root if possible
5. Serve with proper Content-Type headers

### Access Control

1. Only ADMIN can manage school info
2. Only ADMIN can upload/delete logo
3. All roles can read school info (for printing)
4. Audit all changes to school info

### Data Validation

1. Server-side validation for all inputs
2. SQL injection prevention (Prisma ORM)
3. XSS prevention (sanitize outputs)
4. CSRF protection (NextAuth)

## Migration Strategy

### Database Migration

```prisma
// prisma/migrations/xxx_add_school_info/migration.sql
CREATE TABLE "school_info" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" VARCHAR(200) NOT NULL,
  "address" VARCHAR(500) NOT NULL,
  "phone" VARCHAR(20) NOT NULL,
  "email" VARCHAR(100) NOT NULL,
  "website" VARCHAR(100),
  "principal_name" VARCHAR(100) NOT NULL,
  "principal_nip" VARCHAR(18) NOT NULL,
  "logo_path" VARCHAR(255),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL
);
```

### Code Migration

1. Add SchoolInfo model to Prisma schema
2. Run migration: `npx prisma migrate dev`
3. Create school-info actions
4. Create school-info validation
5. Create SchoolInfoForm component
6. Create admin page for school info
7. Update PermissionPrintView component
8. Update permission actions to include school info
9. Add menu item to master data
10. Test all flows

### Data Seeding

```typescript
// prisma/seed.ts - Add default school info
const schoolInfo = await prisma.schoolInfo.create({
  data: {
    name: 'SMA Negeri 1 Jakarta',
    address: 'Jl. Sudirman No. 123, Jakarta Pusat, DKI Jakarta 10110',
    phone: '021-1234567',
    email: 'info@sman1jakarta.sch.id',
    website: 'https://www.sman1jakarta.sch.id',
    principalName: 'Dr. Ahmad Suryadi, M.Pd',
    principalNip: '196501011990031001',
  },
});
```

## Performance Considerations

1. Cache school info in memory (single record)
2. Optimize logo image size (compress on upload)
3. Use Next.js Image component for logo display
4. Lazy load logo in print preview
5. Minimize print CSS for faster rendering

## Accessibility

1. Form labels with proper for attributes
2. Error messages with aria-live
3. Logo upload with keyboard support
4. Print preview with keyboard navigation
5. High contrast for receipt text

## Backward Compatibility

1. Permission card works without school info (fallback to placeholder)
2. Existing permission data unchanged
3. Old print view still accessible (deprecated)
4. Gradual migration to new receipt format
5. No breaking changes to API

## Future Enhancements

1. Multiple school branches support
2. QR code on receipt for verification
3. Digital signature for Guru BK
4. SMS notification with receipt link
5. Receipt history and reprint
6. Custom receipt templates
7. Multi-language support
8. Export school info to PDF
