// User-facing error messages in Indonesian
export const ERROR_MESSAGES = {
  // Authentication errors
  UNAUTHORIZED: 'Anda tidak memiliki akses ke halaman ini',
  INVALID_CREDENTIALS: 'Email/username atau password salah',
  SESSION_EXPIRED: 'Sesi Anda telah berakhir. Silakan login kembali',
  INVALID_SESSION: 'Sesi tidak valid. Silakan login kembali',
  
  // Validation errors
  VALIDATION_FAILED: 'Data yang Anda masukkan tidak valid',
  REQUIRED_FIELD: 'Field ini harus diisi',
  INVALID_FORMAT: 'Format data tidak valid',
  
  // Database errors
  NOT_FOUND: 'Data tidak ditemukan',
  DUPLICATE_ENTRY: 'Data sudah ada dalam sistem',
  FOREIGN_KEY_CONSTRAINT: 'Data tidak dapat dihapus karena masih digunakan',
  UNIQUE_CONSTRAINT: 'Data dengan nilai ini sudah ada',
  
  // Server errors
  SERVER_ERROR: 'Terjadi kesalahan server. Silakan coba lagi',
  DATABASE_ERROR: 'Terjadi kesalahan database. Silakan coba lagi',
  NETWORK_ERROR: 'Koneksi internet bermasalah. Periksa koneksi Anda',
  
  // Security errors
  ENCRYPTION_ERROR: 'Terjadi kesalahan keamanan. Hubungi administrator',
  DECRYPTION_ERROR: 'Gagal membaca data terenkripsi',
  PERMISSION_DENIED: 'Anda tidak memiliki izin untuk melakukan aksi ini',
  
  // Business logic errors
  STUDENT_NOT_ASSIGNED: 'Siswa tidak di-assign ke Anda',
  COUNSELOR_NOT_FOUND: 'Guru BK tidak ditemukan',
  CLASS_NOT_FOUND: 'Kelas tidak ditemukan',
  ACADEMIC_YEAR_NOT_ACTIVE: 'Tahun ajaran tidak aktif',
  SLOT_NOT_AVAILABLE: 'Slot waktu tidak tersedia',
  APPOINTMENT_ALREADY_EXISTS: 'Janji temu sudah ada pada waktu tersebut',
  CANNOT_MODIFY_PAST_DATA: 'Tidak dapat mengubah data yang sudah lewat',
  
  // Journal-specific errors
  JOURNAL_ACCESS_DENIED: 'Hanya pembuat jurnal yang dapat mengakses',
  JOURNAL_NOT_FOUND: 'Jurnal tidak ditemukan',
  
  // User management errors
  USER_NOT_FOUND: 'Pengguna tidak ditemukan',
  USER_ALREADY_EXISTS: 'Pengguna dengan email/username ini sudah ada',
  CANNOT_DELETE_SELF: 'Anda tidak dapat menghapus akun sendiri',
  INVALID_ROLE: 'Role tidak valid',
  
  // Generic errors
  UNKNOWN_ERROR: 'Terjadi kesalahan yang tidak diketahui',
  OPERATION_FAILED: 'Operasi gagal. Silakan coba lagi',
} as const;

export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;
