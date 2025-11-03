

# Implementation Plan

## Overview

Implementasi fitur informasi sekolah di master data dan redesign kartu izin menjadi format struk thermal printer.

## Tasks

- [x] 1. Database schema dan migration untuk SchoolInfo
  - Tambahkan model SchoolInfo ke prisma/schema.prisma
  - Buat migration file untuk tabel school_info
  - Jalankan migration: `npx prisma migrate dev`
  - Generate Prisma client: `npx prisma generate`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Validation schema untuk school info
  - Buat file lib/validations/school-info.ts
  - Implementasi schoolInfoSchema dengan Zod
  - Validasi untuk: name, address, phone, email, website, principalName, principalNip
  - Implementasi logoUploadSchema untuk validasi file upload
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 3.1, 3.2_

- [x] 3. Server actions untuk school info management
  - Buat file lib/actions/admin/school-info.ts
  - Implementasi getSchoolInfo() - get single school info
  - Implementasi upsertSchoolInfo() - create or update school info
  - Implementasi uploadSchoolLogo() - upload logo file
  - Implementasi deleteSchoolLogo() - delete logo file
  - Tambahkan authorization check (ADMIN only)
  - Tambahkan audit logging untuk semua operasi
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.3, 3.4, 3.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 4. File upload utilities
  - Buat folder public/uploads/school/ untuk menyimpan logo
  - Implementasi helper function untuk save file dengan unique name
  - Implementasi helper function untuk delete old file
  - Implementasi file validation (type, size)
  - _Requirements: 3.3, 3.4_

- [x] 5. SchoolInfoForm component
  - Buat file components/admin/SchoolInfoForm.tsx
  - Implementasi form dengan react-hook-form + Zod resolver
  - Field: name, address, phone, email, website, principalName, principalNip
  - Implementasi logo upload dengan preview
  - Implementasi loading states dan error handling
  - Implementasi success notification dengan toast
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1-2.7, 3.1, 3.2, 3.5, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 6. Admin page untuk school info
  - Buat file app/(dashboard)/admin/master-data/school-info/page.tsx
  - Fetch school info data dengan getSchoolInfo()
  - Render SchoolInfoForm dengan initialData
  - Implementasi authorization check (ADMIN only)
  - Tambahkan breadcrumb navigation
  - _Requirements: 1.1, 1.5_

- [x] 7. Update master data navigation
  - Update components/shared/Sidebar.tsx
  - Tambahkan menu item "Informasi Sekolah" di bawah Master Data
  - Tambahkan icon yang sesuai (Building2 atau School)
  - Hanya tampilkan untuk role ADMIN
  - _Requirements: 1.1_

- [x] 8. Update permission actions untuk include school info
  - Update lib/actions/guru-bk/permissions.ts
  - Modify getPermissionPrintData() untuk include school info
  - Fetch school info dari database
  - Tambahkan schoolInfo ke return type PermissionPrintData
  - Handle case ketika school info belum diisi (return null)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 10.1, 10.4_

- [x] 9. PermissionReceiptView component (format struk)
  - Buat file components/guru-bk/PermissionReceiptView.tsx
  - Implementasi layout 80mm width untuk thermal printer
  - Display logo sekolah di bagian atas (jika ada)
  - Display nama sekolah, alamat, telepon secara ringkas
  - Display informasi siswa: nama, NIS, kelas
  - Display jenis izin, tanggal, waktu, alasan
  - Display nomor izin dan nama Guru BK
  - Implementasi CSS untuk print media query
  - Implementasi print preview dengan tombol cetak
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.1, 5.2, 5.3, 5.4, 5.5, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 10. Update permission page untuk gunakan receipt format
  - Update app/(dashboard)/guru-bk/permissions/page.tsx
  - Ganti PermissionPrintView dengan PermissionReceiptView
  - Pastikan school info di-pass ke component
  - Tambahkan warning jika school info belum diisi
  - _Requirements: 6.1, 6.2, 10.2, 10.3_

- [x] 11. Seed data untuk school info
  - Update prisma/seed.ts
  - Tambahkan default school info data
  - Gunakan data placeholder yang realistis
  - _Requirements: 10.1_

- [ ]* 12. Unit tests untuk validation
  - Buat file lib/validations/__tests__/school-info.test.ts
  - Test valid school info data
  - Test invalid phone format
  - Test invalid email format
  - Test invalid NIP format (bukan 18 digit)
  - Test logo file size validation
  - Test logo file type validation
  - _Requirements: 2.1-2.7, 3.1, 3.2_

- [ ]* 13. Integration tests untuk school info actions
  - Buat file lib/actions/admin/__tests__/school-info.test.ts
  - Test getSchoolInfo() - return null jika belum ada
  - Test upsertSchoolInfo() - create new school info
  - Test upsertSchoolInfo() - update existing school info
  - Test authorization (non-ADMIN tidak bisa akses)
  - Test audit logging untuk create dan update
  - _Requirements: 1.1-1.5, 7.1, 7.2, 7.4, 7.5_

- [ ]* 14. Component tests untuk SchoolInfoForm
  - Test form validation errors
  - Test successful form submission
  - Test logo upload functionality
  - Test logo preview display
  - Test responsive layout
  - _Requirements: 1.1-1.5, 2.1-2.7, 3.1, 3.2, 3.5, 8.1-8.5_

- [ ]* 15. Integration tests untuk permission receipt
  - Test print permission dengan school info
  - Test print permission tanpa school info (fallback)
  - Test school info ditampilkan dengan benar di receipt
  - Test logo ditampilkan jika ada
  - _Requirements: 4.1-4.7, 6.1-6.5, 10.1, 10.4_

## Notes

- Tasks 1-11 adalah core implementation yang harus diselesaikan
- Tasks 12-15 adalah optional testing tasks (marked with *)
- Setiap task harus di-test secara manual sebelum melanjutkan ke task berikutnya
- Logo upload menggunakan FormData dan disimpan di public/uploads/school/
- Format struk menggunakan width 80mm untuk kompatibilitas dengan thermal printer
- School info adalah single record (hanya satu data untuk satu sekolah)
- Backward compatibility dijaga dengan fallback ke placeholder text jika school info belum diisi

## Implementation Order

1. **Phase 1**: Database & Validation (Tasks 1-2)
2. **Phase 2**: Backend Actions (Tasks 3-4)
3. **Phase 3**: Admin UI (Tasks 5-7)
4. **Phase 4**: Receipt Integration (Tasks 8-10)
5. **Phase 5**: Seed Data (Task 11)
6. **Phase 6**: Testing (Tasks 12-15) - Optional

## Estimated Timeline

- Phase 1: 1-2 hours
- Phase 2: 2-3 hours
- Phase 3: 3-4 hours
- Phase 4: 2-3 hours
- Phase 5: 30 minutes
- Phase 6: 3-4 hours (optional)

**Total**: 8-12 hours untuk core implementation (tanpa testing)
**Total dengan testing**: 11-16 hours

## Success Criteria

- ✅ Admin dapat mengelola informasi sekolah di master data
- ✅ Admin dapat upload dan preview logo sekolah
- ✅ Kartu izin menggunakan format struk 80mm
- ✅ Kartu izin menampilkan informasi sekolah dari database
- ✅ Kartu izin dapat dicetak dengan thermal printer
- ✅ Sistem tetap berfungsi jika school info belum diisi (fallback)
- ✅ Semua perubahan school info tercatat di audit log
- ✅ Form responsive dan dapat diakses dari mobile
