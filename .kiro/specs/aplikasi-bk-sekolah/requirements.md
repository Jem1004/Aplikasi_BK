# Requirements Document

## Introduction

Aplikasi Bimbingan Konseling (BK) Sekolah adalah aplikasi web full-stack (PWA) yang dirancang untuk mendigitalisasi layanan Bimbingan Konseling di sekolah. Sistem ini mendukung empat peran pengguna utama (Admin, Guru BK, Wali Kelas, dan Siswa) untuk mengelola pencatatan kasus, poin pelanggaran, perizinan, dan penjadwalan konseling dengan fokus pada keamanan, privasi, dan efisiensi operasional.

## Glossary

- **System**: Aplikasi Bimbingan Konseling (BK) Sekolah
- **Admin**: Pengguna dengan hak akses penuh untuk mengelola data master dan relasi sistem
- **Guru BK**: Guru Bimbingan Konseling yang melakukan layanan konseling dan pencatatan
- **Wali Kelas**: Guru yang memantau siswa di kelas tertentu
- **Siswa**: Pengguna akhir yang menerima layanan konseling
- **Jurnal Konseling Privat**: Catatan rahasia sesi konseling yang hanya dapat diakses oleh Guru BK pembuatnya
- **Poin Pelanggaran**: Sistem akumulasi poin berdasarkan pelanggaran atau prestasi siswa
- **Izin Masuk/Keluar**: Dokumen perizinan siswa untuk meninggalkan atau memasuki area sekolah
- **Janji Temu**: Booking konsultasi yang dibuat oleh siswa dengan Guru BK
- **Data Master**: Data referensi sistem seperti kelas, tahun ajaran, dan daftar poin pelanggaran
- **Mapping**: Proses penetapan relasi antara entitas (siswa ke Guru BK, Wali Kelas ke Kelas)

## Requirements

### Requirement 1: Autentikasi Pengguna

**User Story:** Sebagai pengguna sistem (Admin, Guru BK, Wali Kelas, atau Siswa), saya ingin dapat login dengan kredensial yang aman, sehingga saya dapat mengakses fitur sesuai peran saya.

#### Acceptance Criteria

1. WHEN a user submits valid credentials (email/username and password), THE System SHALL authenticate the user and create a secure session
2. WHEN a user submits invalid credentials, THE System SHALL reject the authentication attempt and display an error message
3. THE System SHALL enforce role-based access control for all authenticated users
4. WHEN a user logs out, THE System SHALL terminate the session and redirect to the login page
5. THE System SHALL maintain session security using token-based or session-based authentication

### Requirement 2: Manajemen Data Master oleh Admin

**User Story:** Sebagai Admin, saya ingin dapat mengelola data master sistem (akun pengguna, kelas, tahun ajaran, daftar poin pelanggaran), sehingga sistem memiliki data referensi yang akurat.

#### Acceptance Criteria

1. THE System SHALL allow Admin to create, read, update, and delete Guru BK accounts
2. THE System SHALL allow Admin to create, read, update, and delete Wali Kelas accounts
3. THE System SHALL allow Admin to create, read, update, and delete Siswa accounts
4. THE System SHALL allow Admin to create, read, update, and delete master data for Kelas (classes)
5. THE System SHALL allow Admin to create, read, update, and delete master data for Tahun Ajaran (academic years)
6. THE System SHALL allow Admin to create, read, update, and delete Daftar Poin Pelanggaran (violation types with point values)

### Requirement 3: Mapping Relasi oleh Admin

**User Story:** Sebagai Admin, saya ingin dapat menetapkan relasi antara siswa dengan Guru BK dan Wali Kelas dengan kelas, sehingga setiap pengguna memiliki akses data yang sesuai.

#### Acceptance Criteria

1. THE System SHALL allow Admin to assign one or more Siswa to a specific Guru BK
2. THE System SHALL allow Admin to assign a Wali Kelas to a specific Kelas
3. THE System SHALL allow Admin to update existing mappings between Siswa and Guru BK
4. THE System SHALL allow Admin to update existing mappings between Wali Kelas and Kelas
5. WHEN a mapping is created or updated, THE System SHALL validate that all referenced entities exist

### Requirement 4: Pencatatan Poin Pelanggaran/Prestasi

**User Story:** Sebagai Guru BK, saya ingin dapat mencatat poin pelanggaran atau prestasi untuk siswa yang di-mapping ke saya, sehingga riwayat perilaku siswa tercatat dengan akurat.

#### Acceptance Criteria

1. THE System SHALL display to Guru BK only the list of Siswa that have been mapped to them
2. WHEN Guru BK selects a Siswa and a violation type, THE System SHALL create a new violation record with automatic point accumulation
3. THE System SHALL allow Guru BK to read, update, and delete violation records they have created
4. THE System SHALL calculate and display the total accumulated points for each Siswa
5. THE System SHALL allow Wali Kelas to view (read-only) violation history for Siswa in their assigned Kelas
6. THE System SHALL allow Siswa to view (read-only) their own violation history

### Requirement 5: Jurnal Konseling Privat (Keamanan Kritis)

**User Story:** Sebagai Guru BK, saya ingin dapat mencatat sesi konseling privat dengan siswa dalam jurnal yang terenkripsi, sehingga kerahasiaan informasi konseling terjaga.

#### Acceptance Criteria

1. THE System SHALL provide a separate module for Guru BK to create counseling journal entries
2. THE System SHALL encrypt counseling journal data before storing it in the database
3. THE System SHALL allow only the Guru BK who created a journal entry to read that entry
4. THE System SHALL prevent all other users, including Admin, from accessing counseling journal entries
5. THE System SHALL allow Guru BK to update and delete their own counseling journal entries
6. WHEN Guru BK attempts to access a journal entry, THE System SHALL decrypt the data only if the user is the original creator

### Requirement 6: Sistem Izin Masuk/Keluar (In-Person)

**User Story:** Sebagai Guru BK, saya ingin dapat membuat dan mencetak izin masuk/keluar untuk siswa yang datang secara langsung, sehingga proses perizinan menjadi cepat dan terdokumentasi.

#### Acceptance Criteria

1. WHEN a Siswa arrives in person, THE System SHALL allow Guru BK to search and select the Siswa
2. THE System SHALL provide a form for Guru BK to input permission details (type, reason, time)
3. WHEN Guru BK submits the permission form, THE System SHALL save the data to the database
4. WHEN the permission data is saved, THE System SHALL trigger the browser print function (window.print()) with a formatted receipt layout
5. THE System SHALL store a complete log of all permission records with timestamps
6. THE System SHALL allow Wali Kelas to view (read-only) permission history for Siswa in their assigned Kelas
7. THE System SHALL allow Siswa to view (read-only) their own permission history

### Requirement 7: Booking Janji Temu Konseling

**User Story:** Sebagai Siswa, saya ingin dapat melihat jadwal kosong Guru BK dan membuat janji temu konseling secara online, sehingga saya dapat mengatur waktu konsultasi dengan mudah.

#### Acceptance Criteria

1. THE System SHALL display available time slots for Guru BK to Siswa users
2. THE System SHALL allow Siswa to create an appointment request by selecting a time slot and providing a brief reason
3. WHEN a Siswa creates an appointment request, THE System SHALL notify the assigned Guru BK
4. THE System SHALL allow Siswa to view their own appointment requests and their status
5. THE System SHALL allow Siswa to delete their pending appointment requests

### Requirement 8: Manajemen Janji Temu oleh Guru BK

**User Story:** Sebagai Guru BK, saya ingin dapat melihat dan mengelola permintaan janji temu dari siswa, sehingga saya dapat mengatur jadwal konseling dengan efisien.

#### Acceptance Criteria

1. THE System SHALL display all appointment requests for a Guru BK from their mapped Siswa
2. THE System SHALL allow Guru BK to approve an appointment request
3. THE System SHALL allow Guru BK to reject an appointment request with a reason
4. THE System SHALL allow Guru BK to reschedule an appointment request to a different time slot
5. WHEN Guru BK updates an appointment status, THE System SHALL notify the Siswa of the status change

### Requirement 9: Dashboard dan Profil Pengguna

**User Story:** Sebagai pengguna sistem, saya ingin dapat melihat dashboard yang relevan dengan peran saya dan mengakses profil pribadi, sehingga saya dapat dengan cepat mengakses informasi penting.

#### Acceptance Criteria

1. WHEN Admin logs in, THE System SHALL display an admin dashboard with statistics and quick access to management functions
2. WHEN Guru BK logs in, THE System SHALL display a dashboard with pending appointments, recent violations, and quick action buttons
3. WHEN Wali Kelas logs in, THE System SHALL display a dashboard with class statistics and recent student activities
4. WHEN Siswa logs in, THE System SHALL display a dashboard with their violation summary, upcoming appointments, and profile information
5. THE System SHALL allow all users to view and update their own profile information (excluding role changes)

### Requirement 10: Responsivitas dan Progressive Web App (PWA)

**User Story:** Sebagai pengguna mobile (terutama Siswa), saya ingin dapat mengakses aplikasi dengan lancar di perangkat mobile, sehingga saya dapat menggunakan layanan kapan saja.

#### Acceptance Criteria

1. THE System SHALL implement a mobile-first responsive design using Tailwind CSS
2. THE System SHALL function correctly on mobile devices with screen widths from 320px to 768px
3. THE System SHALL function correctly on desktop devices with screen widths above 768px
4. THE System SHALL implement PWA capabilities for offline access to cached data
5. THE System SHALL provide an installable experience on mobile devices

### Requirement 11: Keamanan dan Validasi Data

**User Story:** Sebagai Admin sistem, saya ingin memastikan bahwa semua data yang masuk ke sistem tervalidasi dan aman, sehingga integritas data terjaga.

#### Acceptance Criteria

1. THE System SHALL validate all user inputs on both client-side and server-side
2. THE System SHALL sanitize all user inputs to prevent SQL injection and XSS attacks
3. THE System SHALL enforce password complexity requirements (minimum 8 characters, mix of letters and numbers)
4. THE System SHALL hash all passwords before storing them in the database
5. THE System SHALL implement CSRF protection for all form submissions
6. THE System SHALL log all critical operations (create, update, delete) with user identification and timestamps
