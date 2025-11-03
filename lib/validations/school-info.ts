import { z } from 'zod';

/**
 * Validation schema for school information
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 */
export const schoolInfoSchema = z.object({
  name: z.string()
    .min(5, 'Nama sekolah minimal 5 karakter')
    .max(200, 'Nama sekolah maksimal 200 karakter'),
  
  address: z.string()
    .min(10, 'Alamat minimal 10 karakter')
    .max(500, 'Alamat maksimal 500 karakter'),
  
  phone: z.string()
    .regex(
      /^(\+62|62|0)[0-9]{9,12}$/,
      'Format nomor telepon tidak valid (contoh: 021-1234567 atau 08123456789)'
    ),
  
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

/**
 * Validation schema for logo file upload
 * Requirements: 3.1, 3.2
 */
export const logoUploadSchema = z.object({
  file: z.instanceof(File)
    .refine(
      (file) => file.size <= 2 * 1024 * 1024,
      'Ukuran file maksimal 2MB'
    )
    .refine(
      (file) => ['image/png', 'image/jpeg', 'image/jpg'].includes(file.type),
      'File harus berformat PNG, JPG, atau JPEG'
    ),
});

/**
 * Type inference for school info form data
 */
export type SchoolInfoFormData = z.infer<typeof schoolInfoSchema>;

/**
 * Type inference for logo upload data
 */
export type LogoUploadData = z.infer<typeof logoUploadSchema>;
