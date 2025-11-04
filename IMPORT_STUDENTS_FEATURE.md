# Fitur Import Siswa - Excel/CSV

## Overview
Fitur import siswa memungkinkan admin untuk menambahkan banyak siswa sekaligus menggunakan file Excel (.xlsx, .xls) atau CSV (.csv). Ini sangat membantu saat awal tahun ajaran atau migrasi data.

## Fitur Utama

### 1. Upload File Excel/CSV
- Support format: .xlsx, .xls, .csv
- Max file size: 5MB
- Validasi format file
- Progress indicator saat upload

### 2. Template Download
- Template Excel siap pakai
- Contoh data yang benar
- Kolom yang sudah terformat
- Panduan pengisian

### 3. Validasi Data
- Email validation (format & unique)
- Username validation (min 3 char & unique)
- NIS validation (required & unique)
- NISN validation (optional)
- Class name validation (must exist)
- Date format validation (YYYY-MM-DD)

### 4. Batch Processing
- Process multiple students at once
- Transaction-based (all or nothing per student)
- Error handling per row
- Detailed error reporting

### 5. Result Summary
- Success count
- Failed count
- Error details per row
- Auto-redirect on success

## File Structure

```
app/
├── (dashboard)/admin/users/
│   ├── import/
│   │   └── page.tsx              # Import page
│   └── page.tsx                  # Updated with import button
├── api/admin/users/template/
│   └── route.ts                  # Template download API
components/
├── admin/
│   └── ImportStudentsForm.tsx    # Import form component
└── ui/
    └── progress.tsx              # Progress bar component
lib/
└── actions/admin/
    └── import-students.ts        # Server action for import
```

## Data Format

### Required Fields
| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| email | string | Email siswa | Valid email, unique |
| username | string | Username login | Min 3 char, unique |
| fullName | string | Nama lengkap | Required |
| nis | string | Nomor Induk Siswa | Required, unique |

### Optional Fields
| Field | Type | Description | Format |
|-------|------|-------------|--------|
| nisn | string | NISN | - |
| className | string | Nama kelas | Must exist in system |
| dateOfBirth | string | Tanggal lahir | YYYY-MM-DD |
| address | string | Alamat lengkap | - |
| parentName | string | Nama orang tua | - |
| parentPhone | string | Telepon orang tua | - |

## Template Excel

### Columns
```
| email | username | fullName | nis | nisn | className | dateOfBirth | address | parentName | parentPhone |
```

### Example Data
```
siswa1@example.com | siswa001 | Contoh Nama Siswa 1 | 2024001 | 0012345678 | 10 IPA 1 | 2008-05-15 | Jl. Contoh No. 123 | Nama Orang Tua | 081234567890
siswa2@example.com | siswa002 | Contoh Nama Siswa 2 | 2024002 | 0012345679 | 10 IPA 2 | 2008-06-20 | Jl. Contoh No. 124 | Nama Orang Tua | 081234567891
```

## User Flow

### 1. Access Import Page
```
Admin Users Page → Click "Import Siswa" → Import Page
```

### 2. Download Template
```
Import Page → Click "Download Template Excel" → Get template file
```

### 3. Fill Data
```
Open template → Fill student data → Save file
```

### 4. Upload File
```
Import Page → Choose file → Click "Upload dan Import" → Wait for processing
```

### 5. Review Results
```
See success/failed count → Review errors if any → Redirect to users page
```

## Implementation Details

### Server Action (`import-students.ts`)

**Process Flow:**
1. Check authorization (Admin only)
2. Validate file exists
3. Parse Excel/CSV using xlsx library
4. Validate each row data
5. Check for duplicates (email, username, NIS)
6. Verify class exists (if provided)
7. Parse date of birth
8. Create user and student in transaction
9. Return result summary

**Error Handling:**
- Row-level errors (continue processing)
- Validation errors (skip row)
- Duplicate errors (skip row)
- Database errors (skip row)
- File parsing errors (stop processing)

### Component (`ImportStudentsForm.tsx`)

**Features:**
- File input with validation
- File type check (.xlsx, .xls, .csv)
- File size check (max 5MB)
- Progress bar during upload
- Result display (success/failed)
- Error details list
- Auto-redirect on success

**States:**
- file: Selected file
- isUploading: Upload status
- progress: Upload progress (0-100)
- result: Import result summary

### API Route (`template/route.ts`)

**Features:**
- Generate Excel template
- Pre-filled with example data
- Formatted columns
- Download as attachment

**Security:**
- Admin authorization check
- Secure file generation

## Security Features

### 1. Authorization
- Only ADMIN role can access
- Session validation
- Role check on every request

### 2. Data Validation
- Zod schema validation
- Email format check
- Username length check
- NIS uniqueness check
- Class existence check

### 3. Password Security
- Default password: `siswa123`
- Hashed with bcrypt (12 rounds)
- Force password change on first login
- `mustChangePassword` flag set to true

### 4. Transaction Safety
- User and Student created in transaction
- Rollback on error
- Data consistency guaranteed

### 5. File Security
- File type validation
- File size limit (5MB)
- Buffer processing (no disk write)
- Memory cleanup after processing

## Error Messages

### File Errors
- "File tidak ditemukan"
- "File tidak valid atau corrupt"
- "File kosong atau tidak ada data"
- "Hanya file Excel (.xlsx, .xls) atau CSV (.csv) yang diperbolehkan"
- "Ukuran file maksimal 5MB"

### Validation Errors
- "Email tidak valid"
- "Username minimal 3 karakter"
- "Nama lengkap harus diisi"
- "NIS harus diisi"
- "Format tanggal lahir tidak valid (gunakan YYYY-MM-DD)"

### Duplicate Errors
- "Email {email} sudah terdaftar"
- "Username {username} sudah terdaftar"
- "NIS {nis} sudah terdaftar"

### Data Errors
- "Kelas {className} tidak ditemukan"

## UI/UX Features

### Import Page

**Header:**
- Back button to users page
- Title and description
- Clear navigation

**Instructions Card:**
- Step-by-step guide
- Numbered steps
- Download template button
- Visual hierarchy

**Upload Form:**
- File input with accept filter
- File info display (name, size)
- Progress bar during upload
- Upload button with loading state
- Reset button

**Result Display:**
- Success count (green alert)
- Failed count (red alert)
- Error details (expandable list)
- Auto-redirect message

**Format Information:**
- Field descriptions
- Required/optional indicators
- Format examples
- Important notes

### Visual Design

**Colors:**
- Success: Emerald (green)
- Error: Red (destructive)
- Info: Blue
- Warning: Yellow

**Icons:**
- Upload: Upload icon
- Download: Download icon
- Success: CheckCircle2
- Error: XCircle
- Info: AlertCircle
- File: FileSpreadsheet

**Layout:**
- Responsive grid
- Card-based sections
- Clear spacing
- Mobile-friendly

## Performance

### Optimization
- Batch processing (not one-by-one API calls)
- Transaction-based inserts
- Memory-efficient file parsing
- Progress feedback
- Async processing

### Limits
- Max file size: 5MB
- Recommended max rows: 1000
- Processing time: ~1-2 seconds per 100 rows

## Testing Checklist

### Functionality
- [ ] Download template works
- [ ] Upload Excel file works
- [ ] Upload CSV file works
- [ ] Validation catches errors
- [ ] Duplicate detection works
- [ ] Class validation works
- [ ] Date parsing works
- [ ] Transaction rollback works
- [ ] Success redirect works

### Security
- [ ] Non-admin cannot access
- [ ] File type validation works
- [ ] File size limit works
- [ ] SQL injection prevented
- [ ] XSS prevented

### UI/UX
- [ ] Progress bar shows
- [ ] Error messages clear
- [ ] Success message shows
- [ ] Mobile responsive
- [ ] File info displays
- [ ] Reset button works

### Edge Cases
- [ ] Empty file handled
- [ ] Corrupt file handled
- [ ] Missing columns handled
- [ ] Invalid data types handled
- [ ] Duplicate rows handled
- [ ] Large files handled

## Future Enhancements

### Possible Additions
- [ ] CSV export of existing students
- [ ] Import other user types (Guru BK, Wali Kelas)
- [ ] Bulk update (not just insert)
- [ ] Import validation preview (before actual import)
- [ ] Import history/logs
- [ ] Scheduled imports
- [ ] Email notifications on completion
- [ ] Import from Google Sheets
- [ ] Drag & drop file upload
- [ ] Multi-file upload

### Not Recommended
- ❌ Import without validation
- ❌ Auto-assign to classes without verification
- ❌ Import without duplicate check
- ❌ Direct database access

## Troubleshooting

### Common Issues

**Issue: "File tidak valid atau corrupt"**
- Solution: Ensure file is valid Excel/CSV format
- Check: File not password protected
- Check: File not corrupted

**Issue: "Kelas tidak ditemukan"**
- Solution: Create class first in master data
- Check: Class name matches exactly
- Check: Class is not deleted

**Issue: "Email/Username/NIS sudah terdaftar"**
- Solution: Check existing data
- Remove duplicates from import file
- Update existing records manually

**Issue: Upload stuck at 90%**
- Solution: Wait for processing to complete
- Check: Server not overloaded
- Check: Database connection stable

## Conclusion

Fitur import siswa adalah **essential tool** untuk admin yang:
- ✅ Saves time (bulk import vs manual entry)
- ✅ Reduces errors (template-based)
- ✅ Provides feedback (detailed errors)
- ✅ Maintains data integrity (validation)
- ✅ Secure and reliable (transaction-based)

Fitur ini sangat membantu terutama saat:
- Awal tahun ajaran baru
- Migrasi dari sistem lama
- Penerimaan siswa baru dalam jumlah banyak
- Update data siswa massal
