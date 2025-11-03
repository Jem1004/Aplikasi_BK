# Requirements Document

## Introduction

Fitur ini menambahkan kemampuan untuk mengelola informasi sekolah di master data dan mengubah format kartu izin siswa dari format surat formal menjadi format struk belanja yang lebih compact dan praktis. Informasi sekolah akan digunakan di berbagai dokumen termasuk kartu izin.

## Glossary

- **System**: Aplikasi Bimbingan Konseling (BK) Sekolah
- **School_Info**: Data informasi sekolah yang tersimpan di database
- **Permission_Card**: Kartu izin siswa dalam format struk
- **Admin**: Pengguna dengan role ADMIN yang dapat mengelola informasi sekolah
- **Guru_BK**: Guru Bimbingan Konseling yang mencetak kartu izin
- **Receipt_Format**: Format struk belanja (58mm atau 80mm width)

## Requirements

### Requirement 1: Manajemen Informasi Sekolah

**User Story:** Sebagai Admin, saya ingin mengelola informasi sekolah di master data, sehingga informasi tersebut dapat digunakan di berbagai dokumen sistem.

#### Acceptance Criteria

1. WHEN Admin mengakses halaman master data, THE System SHALL menampilkan menu "Informasi Sekolah"
2. WHEN Admin membuka halaman informasi sekolah, THE System SHALL menampilkan form dengan field: nama sekolah, alamat, nomor telepon, email, website, nama kepala sekolah, NIP kepala sekolah, dan logo sekolah (opsional)
3. WHEN Admin menyimpan informasi sekolah, THE System SHALL memvalidasi bahwa semua field wajib terisi
4. WHEN informasi sekolah berhasil disimpan, THE System SHALL menyimpan data ke database dan menampilkan notifikasi sukses
5. WHERE informasi sekolah sudah ada, THE System SHALL menampilkan form dalam mode edit dengan data yang sudah tersimpan

### Requirement 2: Validasi Data Informasi Sekolah

**User Story:** Sebagai Admin, saya ingin sistem memvalidasi data informasi sekolah, sehingga data yang tersimpan akurat dan lengkap.

#### Acceptance Criteria

1. WHEN Admin mengisi nama sekolah, THE System SHALL memvalidasi bahwa nama sekolah minimal 5 karakter dan maksimal 200 karakter
2. WHEN Admin mengisi alamat, THE System SHALL memvalidasi bahwa alamat minimal 10 karakter dan maksimal 500 karakter
3. WHEN Admin mengisi nomor telepon, THE System SHALL memvalidasi format nomor telepon Indonesia (contoh: 021-1234567 atau 08123456789)
4. WHEN Admin mengisi email, THE System SHALL memvalidasi format email yang valid
5. WHEN Admin mengisi website, THE System SHALL memvalidasi format URL yang valid (opsional)
6. WHEN Admin mengisi NIP kepala sekolah, THE System SHALL memvalidasi bahwa NIP terdiri dari 18 digit angka
7. IF validasi gagal, THEN THE System SHALL menampilkan pesan error yang spesifik untuk setiap field

### Requirement 3: Upload Logo Sekolah

**User Story:** Sebagai Admin, saya ingin mengunggah logo sekolah, sehingga logo dapat ditampilkan di kartu izin dan dokumen lainnya.

#### Acceptance Criteria

1. WHEN Admin mengunggah logo sekolah, THE System SHALL memvalidasi bahwa file adalah gambar (PNG, JPG, JPEG)
2. WHEN Admin mengunggah logo sekolah, THE System SHALL memvalidasi bahwa ukuran file maksimal 2MB
3. WHEN logo berhasil diunggah, THE System SHALL menyimpan file di folder public/uploads/school
4. WHEN logo berhasil diunggah, THE System SHALL menyimpan path logo di database
5. WHERE logo sudah ada, THE System SHALL menampilkan preview logo dan opsi untuk menggantinya

### Requirement 4: Kartu Izin Format Struk

**User Story:** Sebagai Guru BK, saya ingin mencetak kartu izin dalam format struk, sehingga kartu lebih praktis dan mudah dibawa siswa.

#### Acceptance Criteria

1. WHEN Guru BK mencetak kartu izin, THE System SHALL menggunakan format struk dengan lebar 80mm
2. WHEN kartu izin dicetak, THE System SHALL menampilkan logo sekolah di bagian atas (jika tersedia)
3. WHEN kartu izin dicetak, THE System SHALL menampilkan nama sekolah dan alamat secara ringkas
4. WHEN kartu izin dicetak, THE System SHALL menampilkan informasi siswa: nama, NIS, kelas
5. WHEN kartu izin dicetak, THE System SHALL menampilkan jenis izin, tanggal, waktu, dan alasan secara ringkas
6. WHEN kartu izin dicetak, THE System SHALL menampilkan nomor izin dan QR code untuk verifikasi (opsional)
7. WHEN kartu izin dicetak, THE System SHALL menampilkan nama dan tanda tangan Guru BK

### Requirement 5: Desain Kartu Izin yang Compact

**User Story:** Sebagai Guru BK, saya ingin kartu izin memiliki desain yang simple dan compact, sehingga mudah dicetak dengan printer thermal.

#### Acceptance Criteria

1. WHEN kartu izin ditampilkan, THE System SHALL menggunakan font size yang sesuai untuk printer thermal (10-12pt)
2. WHEN kartu izin ditampilkan, THE System SHALL menggunakan layout single column tanpa tabel kompleks
3. WHEN kartu izin ditampilkan, THE System SHALL menampilkan informasi dengan format key-value yang ringkas
4. WHEN kartu izin ditampilkan, THE System SHALL menggunakan garis pemisah sederhana (dashed line)
5. WHEN kartu izin dicetak, THE System SHALL menghasilkan output yang sesuai dengan printer thermal 80mm

### Requirement 6: Integrasi Informasi Sekolah ke Kartu Izin

**User Story:** Sebagai Guru BK, saya ingin kartu izin otomatis menggunakan informasi sekolah dari master data, sehingga tidak perlu hardcode informasi sekolah.

#### Acceptance Criteria

1. WHEN Guru BK mencetak kartu izin, THE System SHALL mengambil informasi sekolah dari database
2. IF informasi sekolah belum diisi, THEN THE System SHALL menampilkan pesan peringatan kepada Guru BK
3. WHEN informasi sekolah ditampilkan di kartu izin, THE System SHALL menampilkan nama sekolah, alamat, dan nomor telepon
4. WHERE logo sekolah tersedia, THE System SHALL menampilkan logo di bagian atas kartu izin
5. WHEN informasi sekolah diupdate oleh Admin, THE System SHALL otomatis menggunakan informasi terbaru di kartu izin berikutnya

### Requirement 7: Audit Log untuk Informasi Sekolah

**User Story:** Sebagai Admin, saya ingin sistem mencatat setiap perubahan informasi sekolah, sehingga ada jejak audit untuk perubahan data penting.

#### Acceptance Criteria

1. WHEN Admin membuat informasi sekolah pertama kali, THE System SHALL mencatat event "SCHOOL_INFO_CREATED" di audit log
2. WHEN Admin mengupdate informasi sekolah, THE System SHALL mencatat event "SCHOOL_INFO_UPDATED" di audit log dengan detail perubahan
3. WHEN Admin mengunggah logo sekolah, THE System SHALL mencatat event "SCHOOL_LOGO_UPLOADED" di audit log
4. WHEN audit log dicatat, THE System SHALL menyimpan user ID, timestamp, dan detail perubahan
5. WHEN Admin melihat audit log, THE System SHALL menampilkan riwayat perubahan informasi sekolah

### Requirement 8: Responsive Design untuk Form Informasi Sekolah

**User Story:** Sebagai Admin, saya ingin form informasi sekolah dapat diakses dari berbagai perangkat, sehingga saya dapat mengelola data dari desktop atau mobile.

#### Acceptance Criteria

1. WHEN Admin mengakses form dari desktop, THE System SHALL menampilkan layout 2 kolom untuk field-field
2. WHEN Admin mengakses form dari mobile, THE System SHALL menampilkan layout 1 kolom dengan field yang stack
3. WHEN Admin mengakses form dari tablet, THE System SHALL menyesuaikan layout berdasarkan orientasi
4. WHEN form ditampilkan, THE System SHALL memastikan semua field dapat diakses dengan touch target minimal 44x44px
5. WHEN preview logo ditampilkan, THE System SHALL menyesuaikan ukuran gambar dengan viewport

### Requirement 9: Print Preview untuk Kartu Izin

**User Story:** Sebagai Guru BK, saya ingin melihat preview kartu izin sebelum mencetak, sehingga saya dapat memastikan semua informasi sudah benar.

#### Acceptance Criteria

1. WHEN Guru BK klik tombol cetak, THE System SHALL menampilkan preview kartu izin dalam format struk
2. WHEN preview ditampilkan, THE System SHALL menampilkan kartu izin dengan ukuran sebenarnya (80mm width)
3. WHEN preview ditampilkan, THE System SHALL menyediakan tombol "Cetak" dan "Tutup"
4. WHEN Guru BK klik tombol cetak di preview, THE System SHALL membuka dialog print browser
5. WHEN dialog print dibuka, THE System SHALL menggunakan CSS print media query untuk format struk

### Requirement 10: Backward Compatibility

**User Story:** Sebagai Developer, saya ingin memastikan fitur baru tidak merusak fitur yang sudah ada, sehingga sistem tetap stabil.

#### Acceptance Criteria

1. WHEN informasi sekolah belum diisi, THE System SHALL tetap dapat mencetak kartu izin dengan placeholder text
2. WHEN migrasi database dijalankan, THE System SHALL menambahkan tabel school_info tanpa menghapus data yang ada
3. WHEN kartu izin format baru digunakan, THE System SHALL tetap menyimpan data permission dengan struktur yang sama
4. WHEN API permission dipanggil, THE System SHALL menambahkan field school_info tanpa breaking existing response
5. WHEN komponen lama masih digunakan, THE System SHALL tetap berfungsi normal hingga diganti dengan komponen baru
