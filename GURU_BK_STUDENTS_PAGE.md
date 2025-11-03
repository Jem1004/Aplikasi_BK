# Halaman Siswa Binaan Guru BK

## Overview
Halaman `/guru-bk/students` adalah halaman baru yang dibuat untuk memberikan Guru BK akses lengkap ke daftar siswa binaan mereka dengan statistik dan quick actions.

## Alasan Pembuatan

### Problem
- ❌ Menu "Siswa" di sidebar mengarah ke `/guru-bk/students` yang tidak ada (404)
- ❌ Tidak ada halaman khusus untuk melihat overview siswa binaan
- ❌ Guru BK harus ke halaman violations untuk melihat daftar siswa
- ❌ Tidak ada statistik agregat siswa binaan

### Solution
✅ Halaman `/guru-bk/students` dengan fitur lengkap
✅ Halaman detail `/guru-bk/students/[studentId]` untuk profil lengkap
✅ Statistik dan quick actions
✅ Consistent dengan halaman lain

## Fitur Halaman

### 1. Halaman Utama (`/guru-bk/students`)

#### Header Section
- **Title**: "Siswa Binaan"
- **Description**: Kelola dan pantau siswa
- **Action Button**: "Catat Pelanggaran" → `/guru-bk/violations/new`

#### Statistics Cards (4 Cards)
1. **Total Siswa**
   - Icon: Users
   - Value: Jumlah total siswa binaan
   - Description: "Siswa binaan Anda"

2. **Dengan Pelanggaran**
   - Icon: Red dot indicator
   - Value: Jumlah siswa dengan poin positif
   - Description: Persentase dari total

3. **Dengan Prestasi**
   - Icon: Green dot indicator
   - Value: Jumlah siswa dengan poin negatif
   - Description: Persentase dari total

4. **Rata-rata Poin**
   - Icon: Blue dot indicator
   - Value: Average poin semua siswa
   - Description: Status (Perlu perhatian/Sangat baik/Normal)

#### Student List Section
- **Component**: `StudentList` (reused)
- **Features**:
  - Grid layout responsive
  - Student cards dengan foto/initial
  - Nama, NIS, Kelas
  - Total poin dengan badge
  - Click to detail
- **Empty State**:
  - Icon: Users
  - Message: "Belum Ada Siswa Binaan"
  - Description: Hubungi admin

### 2. Halaman Detail (`/guru-bk/students/[studentId]`)

#### Header
- **Back Button**: Kembali ke `/guru-bk/students`
- **Title**: "Detail Siswa"
- **Description**: Informasi lengkap dan riwayat

#### Profile Card
**Left Column:**
- Nama Lengkap (dengan icon User)
- NIS / NISN (dengan icon GraduationCap)
- Kelas (dengan icon GraduationCap)
- Tanggal Lahir (dengan icon Calendar)

**Right Column:**
- Email (dengan icon Phone)
- Nama Orang Tua (dengan icon User)
- Telepon Orang Tua (dengan icon Phone)
- Alamat (dengan icon MapPin)

#### Statistics Cards (4 Cards)
1. **Total Poin**
   - Icon: AlertCircle
   - Value: Total poin akumulasi
   - Status: Pelanggaran/Prestasi/Normal

2. **Pelanggaran**
   - Icon: Red dot
   - Value: Jumlah catatan pelanggaran
   - Description: "Total catatan"

3. **Jurnal**
   - Icon: FileText
   - Value: Jumlah sesi konseling
   - Description: "Sesi konseling"

4. **Izin**
   - Icon: FileCheck
   - Value: Jumlah surat izin
   - Description: "Surat izin"

#### Quick Actions Card
**Buttons:**
1. **Catat Pelanggaran** (Primary)
   - Link: `/guru-bk/violations/new?studentId={id}`
   - Icon: Plus

2. **Buat Jurnal** (Outline)
   - Link: `/guru-bk/journals/new?studentId={id}`
   - Icon: Plus

3. **Buat Izin** (Outline)
   - Link: `/guru-bk/permissions/new?studentId={id}`
   - Icon: Plus

#### Tabs Section

**Tab 1: Riwayat Pelanggaran**
- Component: `ViolationHistory`
- Shows: Semua catatan pelanggaran & prestasi
- Empty State: "Belum Ada Catatan"

**Tab 2: Ringkasan**
- Breakdown poin berdasarkan:
  - Total Poin (akumulasi keseluruhan)
  - Pelanggaran (catatan negatif)
  - Prestasi (catatan positif)
- Each item shows:
  - Category name
  - Count
  - Total points dengan badge

## Data Flow

### Main Page
```typescript
getMyStudents() 
  → Returns: StudentWithSummary[]
  → Includes: user, class, violations[]
  → Calculate: totalPoints per student
  → Display: Statistics + StudentList
```

### Detail Page
```typescript
// Get student data
prisma.student.findUnique()
  → Include: user, class, counselorAssignments

// Get violations
getStudentViolations(studentId)
  → Returns: Violation[] with details

// Get summary
getStudentViolationSummary(studentId)
  → Returns: { totalPoints, violationCount, prestationCount }

// Get counts
prisma.counselingJournal.count()
prisma.permission.count()
```

## Security

### Authorization Checks
1. **Session Check**: User must be logged in
2. **Role Check**: User must be GURU_BK
3. **Teacher ID Check**: Must have teacherId
4. **Assignment Check**: Student must be assigned to counselor

### Data Access
- Guru BK hanya bisa lihat siswa yang di-assign ke mereka
- Redirect ke `/unauthorized` jika tidak punya akses
- Redirect ke `/guru-bk/students` jika student not found

## UI/UX Features

### Responsive Design
- **Mobile**: Stack layout, full width cards
- **Tablet**: 2 columns for statistics
- **Desktop**: 4 columns for statistics, grid layout

### Visual Indicators
- **Color Coding**:
  - Red: Pelanggaran (positive points)
  - Green: Prestasi (negative points)
  - Blue: Neutral/Info
  - Gray: Default

- **Badges**:
  - Destructive: Pelanggaran
  - Default: Prestasi
  - Outline: Neutral

### Empty States
- Friendly icons (Users, AlertCircle)
- Clear messages
- Actionable suggestions

### Loading States
- Page uses `revalidate = 120` (2 minutes cache)
- Fast subsequent loads

## Integration Points

### Existing Components
- ✅ `StudentList` - Reused from violations page
- ✅ `ViolationHistory` - Reused from violations detail
- ✅ `Card` components - UI library
- ✅ `Badge` components - UI library
- ✅ `Tabs` components - UI library

### Existing Actions
- ✅ `getMyStudents()` - Get assigned students
- ✅ `getStudentViolations()` - Get violation history
- ✅ `getStudentViolationSummary()` - Get statistics

### Navigation
- ✅ Sidebar menu "Siswa" → `/guru-bk/students`
- ✅ Student card click → `/guru-bk/students/[studentId]`
- ✅ Quick actions → Other pages with pre-filled studentId

## File Structure

```
app/(dashboard)/guru-bk/students/
├── page.tsx                    # Main students list page
└── [studentId]/
    └── page.tsx                # Student detail page
```

## Benefits

### For Guru BK
1. **Central Hub**: Satu tempat untuk lihat semua siswa binaan
2. **Quick Overview**: Statistik sekilas tanpa drill down
3. **Fast Actions**: Quick access ke semua fitur
4. **Better Navigation**: Logical flow dari overview ke detail

### For System
1. **Consistency**: Semua role punya halaman students/users
2. **Reusability**: Menggunakan komponen yang sudah ada
3. **Performance**: Efficient queries dengan proper caching
4. **Maintainability**: Clean code structure

### For UX
1. **No 404 Errors**: Menu sidebar berfungsi dengan baik
2. **Clear Hierarchy**: Overview → Detail → Actions
3. **Visual Feedback**: Statistics dan indicators
4. **Responsive**: Works on all devices

## Future Enhancements

### Possible Additions
- [ ] Filter siswa by class
- [ ] Search siswa by name/NIS
- [ ] Sort by points/name/class
- [ ] Export data to Excel/PDF
- [ ] Bulk actions (assign, message)
- [ ] Student comparison view
- [ ] Trend charts (points over time)
- [ ] Alert system (high points threshold)

### Not Recommended
- ❌ Edit student profile (admin only)
- ❌ Delete students (admin only)
- ❌ Reassign students (admin only)

## Testing Checklist

### Functionality
- [ ] Page loads without errors
- [ ] Statistics calculate correctly
- [ ] Student list displays properly
- [ ] Click student card navigates to detail
- [ ] Detail page shows correct data
- [ ] Quick actions have correct links
- [ ] Tabs switch properly
- [ ] Empty states show when no data

### Authorization
- [ ] Non-Guru BK cannot access
- [ ] Guru BK only sees assigned students
- [ ] Unauthorized access redirects properly

### Responsive
- [ ] Mobile layout works
- [ ] Tablet layout works
- [ ] Desktop layout works
- [ ] Cards stack properly on small screens

### Performance
- [ ] Page loads in < 2 seconds
- [ ] Caching works (revalidate)
- [ ] No unnecessary re-renders

## Conclusion

Halaman Siswa Binaan adalah **essential feature** yang:
- ✅ Fixes navigation issue (404)
- ✅ Provides better UX for Guru BK
- ✅ Maintains consistency across roles
- ✅ Reuses existing components
- ✅ Follows best practices

Halaman ini melengkapi ecosystem Guru BK dan memberikan pengalaman yang lebih baik dalam mengelola siswa binaan.
