# Fitur Admin Reset Password

## Overview
Fitur ini memungkinkan administrator untuk mereset password user lain ke password default berdasarkan role mereka. User yang password-nya direset akan dipaksa untuk mengganti password saat login pertama kali.

## Fitur Utama

### 1. Admin Reset Password
- Admin dapat mereset password user lain dari halaman User Management
- Password direset ke default berdasarkan role:
  - Admin: `admin123`
  - Guru BK: `gurubk123`
  - Wali Kelas: `walikelas123`
  - Siswa: `siswa123`
- User akan dipaksa ganti password saat login pertama

### 2. Force Password Change
- Setelah password direset, field `mustChangePassword` di-set ke `true`
- Middleware akan redirect user ke halaman settings/profile
- User tidak bisa mengakses fitur lain sebelum ganti password
- Alert ditampilkan di halaman settings untuk mengingatkan user

### 3. Security Features
- Admin tidak bisa reset password sendiri (harus pakai change password)
- Audit logging untuk setiap reset password
- Password di-hash dengan bcrypt (12 rounds)
- Flag `mustChangePassword` otomatis clear setelah user ganti password

## Implementasi

### Database Schema
```prisma
model User {
  // ... fields lain
  mustChangePassword Boolean @default(false) @map("must_change_password")
}
```

### Server Actions
- `resetUserPassword(userId)` - Reset password ke default
- `setUserPassword(userId, newPassword)` - Set custom password (future use)

### UI Components
- `ResetPasswordDialog` - Dialog untuk reset password dengan konfirmasi
- Alert di settings pages untuk user yang harus ganti password

### Middleware
- Cek `mustChangePassword` flag di session
- Redirect ke settings page jika true
- Allow akses ke settings page untuk ganti password

## Cara Penggunaan

### Untuk Admin:
1. Buka halaman **Admin > Manajemen Pengguna**
2. Klik tombol **Reset Password** pada user yang ingin direset
3. Konfirmasi reset password
4. Copy password baru yang ditampilkan
5. Berikan password tersebut kepada user

### Untuk User yang Password-nya Direset:
1. Login dengan password default yang diberikan admin
2. Akan otomatis diarahkan ke halaman Settings/Profile
3. Lihat alert peringatan untuk ganti password
4. Isi form **Ubah Password**:
   - Password saat ini: password default dari admin
   - Password baru: password baru yang diinginkan
   - Konfirmasi password: ulangi password baru
5. Klik **Ubah Password**
6. Setelah berhasil, bisa mengakses semua fitur

## File yang Dimodifikasi/Dibuat

### Database
- `prisma/schema.prisma` - Tambah field `mustChangePassword`
- Migration: `20251103141040_add_must_change_password_field`

### Server Actions
- `lib/actions/admin/reset-password.ts` - NEW
- `lib/actions/auth.ts` - Update untuk clear `mustChangePassword` flag

### Components
- `components/admin/ResetPasswordDialog.tsx` - NEW
- `components/admin/UserManagementTable.tsx` - Tambah reset password button

### Auth & Middleware
- `lib/auth/auth.config.ts` - Include `mustChangePassword` di session
- `types/next-auth.d.ts` - Tambah type untuk `mustChangePassword`
- `middleware.ts` - Redirect logic untuk force password change

### Pages
- `app/(dashboard)/admin/settings/page.tsx` - Tambah alert
- `app/(dashboard)/guru-bk/settings/page.tsx` - Tambah alert
- `app/(dashboard)/wali-kelas/settings/page.tsx` - Tambah alert
- `app/(dashboard)/siswa/profile/page.tsx` - Tambah alert

### Audit
- `lib/audit/audit-logger.ts` - Tambah `USER_PASSWORD_RESET` action

## Testing

### Manual Testing Steps:
1. Login sebagai admin
2. Buka User Management
3. Reset password user test
4. Logout
5. Login sebagai user test dengan password default
6. Verify redirect ke settings
7. Verify alert muncul
8. Ganti password
9. Verify bisa akses fitur lain

## Security Considerations
- Password default hanya ditampilkan sekali setelah reset
- Admin harus copy dan berikan ke user secara aman
- Password di-hash sebelum disimpan
- Audit trail untuk tracking siapa yang reset password siapa
- User dipaksa ganti password setelah reset

## Future Enhancements
- Email notification saat password direset
- Temporary password dengan expiry time
- Password history untuk prevent reuse
- Self-service forgot password flow
