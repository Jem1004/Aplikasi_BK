# Rencana Fitur: Informasi Sekolah & Kartu Izin Format Struk

## 📋 Overview

Dokumen ini menjelaskan rencana penambahan fitur untuk mengelola informasi sekolah di master data dan mengubah format kartu izin siswa dari surat formal menjadi format struk thermal printer yang lebih praktis.

## 🎯 Tujuan

1. **Manajemen Informasi Sekolah Terpusat**
   - Admin dapat mengelola informasi sekolah (nama, alamat, kontak, kepala sekolah, logo)
   - Informasi dapat digunakan di berbagai dokumen sistem
   - Menghilangkan hardcode informasi sekolah di kode

2. **Kartu Izin Format Struk**
   - Mengubah dari format surat A4 menjadi format struk 80mm
   - Lebih praktis dan mudah dibawa siswa
   - Dapat dicetak dengan thermal printer
   - Lebih hemat kertas dan tinta

## 📊 Perbandingan Format

### Format Lama (Surat A4)
```
┌─────────────────────────────────────────┐
│                                         │
│  [Kop Surat dengan info hardcode]      │
│                                         │
│         SURAT IZIN SISWA                │
│                                         │
│  Yang bertanda tangan di bawah ini...   │
│                                         │
│  Nama: ...                              │
│  Jabatan: ...                           │
│                                         │
│  [Banyak teks formal]                   │
│                                         │
│  [Tanda tangan]                         │
│                                         │
│                                         │
└─────────────────────────────────────────┘
Ukuran: A4 (210mm x 297mm)
```

### Format Baru (Struk 80mm)
```
┌────────────────────────────┐
│      [LOGO SEKOLAH]        │
│                            │
│   SMA NEGERI 1 JAKARTA     │
│  Jl. Sudirman No. 123      │
│    Telp: 021-1234567       │
│                            │
├────────────────────────────┤
│                            │
│    KARTU IZIN SISWA        │
│    No: PRM/2024/001        │
│                            │
├────────────────────────────┤
│                            │
│ Nama   : Ahmad Fauzi       │
│ NIS    : 12345             │
│ Kelas  : X IPA 1           │
│                            │
│ Jenis  : Sakit             │
│ Tanggal: 03 Nov 2024       │
│ Waktu  : 07:00 - 12:00     │
│                            │
│ Alasan:                    │
│ Sakit demam                │
│                            │
├────────────────────────────┤
│                            │
│ Guru BK: Ibu Siti          │
│                            │
│ [TTD Digital]              │
│                            │
└────────────────────────────┘
Ukuran: 80mm x auto
```

## ✨ Fitur Utama

### 1. Master Data - Informasi Sekolah

**Halaman Baru**: `/admin/master-data/school-info`

**Field yang Dapat Dikelola**:
- ✅ Nama Sekolah (wajib)
- ✅ Alamat Lengkap (wajib)
- ✅ Nomor Telepon (wajib)
- ✅ Email (wajib)
- ✅ Website (opsional)
- ✅ Nama Kepala Sekolah (wajib)
- ✅ NIP Kepala Sekolah (wajib, 18 digit)
- ✅ Logo Sekolah (opsional, max 2MB, PNG/JPG)

**Fitur**:
- Form dengan validasi lengkap
- Upload logo dengan preview
- Auto-save ke database
- Audit logging untuk setiap perubahan
- Responsive design (desktop & mobile)

### 2. Kartu Izin Format Struk

**Perubahan pada**: `/guru-bk/permissions`

**Fitur Baru**:
- Layout 80mm width (thermal printer standard)
- Menampilkan logo sekolah (jika ada)
- Informasi sekolah dari database (bukan hardcode)
- Format compact dan mudah dibaca
- Print preview sebelum cetak
- CSS optimized untuk thermal printer

**Keunggulan**:
- ✅ Lebih praktis dibawa siswa
- ✅ Hemat kertas (ukuran lebih kecil)
- ✅ Cepat dicetak dengan thermal printer
- ✅ Informasi tetap lengkap tapi ringkas
- ✅ Terlihat lebih modern

## 🗄️ Database Schema

### Tabel Baru: `school_info`

```sql
CREATE TABLE school_info (
  id              TEXT PRIMARY KEY,
  name            VARCHAR(200) NOT NULL,
  address         VARCHAR(500) NOT NULL,
  phone           VARCHAR(20) NOT NULL,
  email           VARCHAR(100) NOT NULL,
  website         VARCHAR(100),
  principal_name  VARCHAR(100) NOT NULL,
  principal_nip   VARCHAR(18) NOT NULL,
  logo_path       VARCHAR(255),
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);
```

**Catatan**: Hanya ada 1 record (single school info)

## 🔐 Keamanan & Validasi

### Validasi Input
- Nama sekolah: 5-200 karakter
- Alamat: 10-500 karakter
- Telepon: Format Indonesia (021-xxx atau 08xxx)
- Email: Format email valid
- Website: Format URL valid (opsional)
- NIP: Tepat 18 digit angka

### Keamanan File Upload
- Tipe file: PNG, JPG, JPEG only
- Ukuran max: 2MB
- Filename sanitization
- Stored in: `public/uploads/school/`

### Authorization
- Hanya ADMIN yang bisa mengelola school info
- Semua role bisa membaca (untuk print)
- Audit log untuk semua perubahan

## 📱 Responsive Design

### Desktop (≥1024px)
- Form 2 kolom
- Logo preview besar
- Full width layout

### Tablet (768px - 1023px)
- Form 2 kolom (portrait: 1 kolom)
- Logo preview medium
- Adjusted spacing

### Mobile (≤767px)
- Form 1 kolom
- Logo preview small
- Touch-friendly buttons (44x44px min)
- Stack layout

## 🖨️ Print Specifications

### Thermal Printer Support
- Width: 80mm (302px @ 96dpi)
- Font: Monospace/Sans-serif
- Font size: 10-12pt
- Line height: 1.4
- Margin: 8px

### Print CSS
```css
@media print {
  @page {
    size: 80mm auto;
    margin: 0;
  }
  /* Optimized for thermal printer */
}
```

## 🔄 Backward Compatibility

### Fallback Mechanism
- Jika school info belum diisi → gunakan placeholder text
- Existing permission data tidak berubah
- Old print view masih accessible (deprecated)
- No breaking changes

### Migration Path
1. Deploy fitur baru
2. Admin mengisi school info
3. Test print dengan format baru
4. Gradual adoption
5. Deprecate old format (optional)

## 📝 Implementation Tasks

### Phase 1: Database & Validation (1-2 jam)
- [ ] Tambah model SchoolInfo ke Prisma
- [ ] Buat migration
- [ ] Buat validation schema

### Phase 2: Backend Actions (2-3 jam)
- [ ] CRUD actions untuk school info
- [ ] File upload utilities
- [ ] Audit logging

### Phase 3: Admin UI (3-4 jam)
- [ ] SchoolInfoForm component
- [ ] Admin page
- [ ] Update navigation menu

### Phase 4: Receipt Integration (2-3 jam)
- [ ] Update permission actions
- [ ] PermissionReceiptView component
- [ ] Update permission page

### Phase 5: Seed Data (30 menit)
- [ ] Default school info data

### Phase 6: Testing (3-4 jam) - Optional
- [ ] Unit tests
- [ ] Integration tests
- [ ] Component tests

**Total Estimasi**: 8-12 jam (core) atau 11-16 jam (dengan testing)

## 🎨 UI/UX Mockup

### Admin - School Info Form
```
┌─────────────────────────────────────────────────┐
│  Master Data > Informasi Sekolah                │
├─────────────────────────────────────────────────┤
│                                                 │
│  [Logo Preview]                                 │
│  [Upload Logo Button]                           │
│                                                 │
│  Nama Sekolah *                                 │
│  [________________________]                     │
│                                                 │
│  Alamat Lengkap *                               │
│  [________________________]                     │
│  [________________________]                     │
│                                                 │
│  Nomor Telepon *        Email *                 │
│  [____________]         [____________]          │
│                                                 │
│  Website                                        │
│  [________________________]                     │
│                                                 │
│  Nama Kepala Sekolah *  NIP Kepala Sekolah *    │
│  [____________]         [____________]          │
│                                                 │
│  [Batal]  [Simpan]                              │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Guru BK - Print Preview
```
┌─────────────────────────────────────────────────┐
│  Preview Kartu Izin              [X] [Print]    │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌────────────────────────────┐                │
│  │      [LOGO SEKOLAH]        │                │
│  │                            │                │
│  │   SMA NEGERI 1 JAKARTA     │                │
│  │  Jl. Sudirman No. 123      │                │
│  │    Telp: 021-1234567       │                │
│  │                            │                │
│  ├────────────────────────────┤                │
│  │                            │                │
│  │    KARTU IZIN SISWA        │                │
│  │    No: PRM/2024/001        │                │
│  │                            │                │
│  │  [Detail siswa & izin...]  │                │
│  │                            │                │
│  └────────────────────────────┘                │
│                                                 │
│  [Tutup]  [Cetak]                               │
│                                                 │
└─────────────────────────────────────────────────┘
```

## 🚀 Benefits

### Untuk Sekolah
- ✅ Informasi terpusat dan mudah diupdate
- ✅ Konsistensi informasi di semua dokumen
- ✅ Hemat kertas dan tinta
- ✅ Proses lebih cepat

### Untuk Guru BK
- ✅ Tidak perlu edit hardcode
- ✅ Print lebih cepat
- ✅ Format lebih praktis
- ✅ Mudah digunakan

### Untuk Siswa
- ✅ Kartu lebih praktis dibawa
- ✅ Tidak mudah rusak/lipat
- ✅ Terlihat lebih profesional
- ✅ Mudah disimpan

## 📚 Documentation

Spec lengkap tersedia di:
- **Requirements**: `.kiro/specs/informasi-sekolah-dan-kartu-izin/requirements.md`
- **Design**: `.kiro/specs/informasi-sekolah-dan-kartu-izin/design.md`
- **Tasks**: `.kiro/specs/informasi-sekolah-dan-kartu-izin/tasks.md`

## 🎯 Next Steps

1. **Review spec ini** - Pastikan semua requirement sesuai kebutuhan
2. **Approve design** - Konfirmasi desain UI/UX dan database schema
3. **Review tasks** - Cek task list dan estimasi waktu
4. **Start implementation** - Mulai dari Phase 1 (Database & Validation)

## ❓ FAQ

**Q: Apakah format lama masih bisa digunakan?**
A: Ya, format lama masih accessible untuk backward compatibility.

**Q: Bagaimana jika school info belum diisi?**
A: Sistem akan menggunakan placeholder text sebagai fallback.

**Q: Apakah bisa support multiple sekolah?**
A: Saat ini hanya single school. Multiple school bisa jadi future enhancement.

**Q: Printer apa yang didukung?**
A: Thermal printer 80mm standard. Bisa juga print ke PDF atau printer biasa.

**Q: Apakah logo wajib?**
A: Tidak, logo opsional. Kartu tetap bisa dicetak tanpa logo.

---

**Status**: 📝 Spec Ready - Menunggu approval untuk implementasi  
**Created**: November 3, 2024  
**Estimated Effort**: 8-16 jam  
**Priority**: Medium-High
