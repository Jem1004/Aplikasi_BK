// Global type definitions
// Re-export Prisma Role enum to ensure type consistency
export { Role } from '@prisma/client';

export enum AppointmentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  RESCHEDULED = 'RESCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum PermissionType {
  MASUK = 'MASUK',
  KELUAR = 'KELUAR'
}

export enum ViolationCategory {
  PELANGGARAN = 'PELANGGARAN',
  PRESTASI = 'PRESTASI'
}

export type ActionResponse<T = void> = {
  success: boolean
  data?: T
  error?: string
  errors?: Record<string, string[]>
}
