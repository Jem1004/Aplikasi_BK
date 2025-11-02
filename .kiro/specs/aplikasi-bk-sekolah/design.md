# Design Document

## Overview

Aplikasi Bimbingan Konseling (BK) Sekolah adalah aplikasi web full-stack berbasis Next.js 15 dengan App Router yang mengimplementasikan Progressive Web App (PWA). Sistem ini dirancang dengan arsitektur modern menggunakan Server Components, Server Actions, dan TypeScript untuk type safety. Database PostgreSQL digunakan untuk persistensi data dengan enkripsi khusus untuk jurnal konseling privat.

### Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL 16
- **ORM**: Prisma (untuk type-safe database access)
- **Authentication**: NextAuth.js v5 (Auth.js)
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **Encryption**: Node.js crypto module (AES-256-GCM)
- **Development Environment**: Docker Desktop (PostgreSQL container)
- **PWA**: next-pwa plugin

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  (React Server Components + Client Components)              │
│  - Role-based UI rendering                                   │
│  - Shadcn/ui components                                      │
│  - Tailwind CSS styling                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     Next.js App Router                       │
│  - Server Components (data fetching)                         │
│  - Server Actions (mutations)                                │
│  - Middleware (auth & role checking)                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                      │
│  - Service functions                                         │
│  - Encryption/Decryption utilities                           │
│  - Validation schemas (Zod)                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Data Access Layer                       │
│  - Prisma Client                                             │
│  - Database queries                                          │
│  - Transaction management                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   PostgreSQL Database                        │
│  - Normalized schema                                         │
│  - Encrypted counseling journals                             │
│  - Indexes for performance                                   │
└─────────────────────────────────────────────────────────────┘
```


### Directory Structure

```
aplikasi-bk-sekolah/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── admin/
│   │   │   │   ├── users/
│   │   │   │   ├── master-data/
│   │   │   │   ├── mappings/
│   │   │   │   └── page.tsx
│   │   │   ├── guru-bk/
│   │   │   │   ├── violations/
│   │   │   │   ├── journals/
│   │   │   │   ├── permissions/
│   │   │   │   ├── appointments/
│   │   │   │   └── page.tsx
│   │   │   ├── wali-kelas/
│   │   │   │   ├── students/
│   │   │   │   └── page.tsx
│   │   │   ├── siswa/
│   │   │   │   ├── profile/
│   │   │   │   ├── violations/
│   │   │   │   ├── appointments/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── [...nextauth]/
│   │   │           └── route.ts
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/ (shadcn/ui components)
│   │   ├── admin/
│   │   ├── guru-bk/
│   │   ├── wali-kelas/
│   │   ├── siswa/
│   │   └── shared/
│   ├── lib/
│   │   ├── actions/ (Server Actions)
│   │   ├── db/
│   │   │   └── prisma.ts
│   │   ├── auth/
│   │   │   └── auth.config.ts
│   │   ├── encryption/
│   │   │   └── crypto.ts
│   │   ├── validations/
│   │   └── utils.ts
│   ├── types/
│   │   └── index.ts
│   └── middleware.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
│   ├── manifest.json
│   └── icons/
├── docker-compose.yml
├── .env.local
├── next.config.js
├── tailwind.config.ts
└── package.json
```

## Components and Interfaces

### Authentication System

**NextAuth.js v5 Configuration**

- **Providers**: Credentials provider dengan email/username dan password
- **Session Strategy**: JWT-based sessions
- **Callbacks**: 
  - `jwt`: Menambahkan role dan userId ke token
  - `session`: Menyertakan role dan userId dalam session object
- **Pages**: Custom login page di `/login`

**Middleware Protection**

```typescript
// middleware.ts
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const userRole = req.auth?.user?.role;
  
  // Role-based route protection
  if (pathname.startsWith('/admin') && userRole !== 'ADMIN') {
    return Response.redirect(new URL('/unauthorized', req.url));
  }
  // ... similar checks for other roles
});
```


### Role-Based Access Control (RBAC)

**Role Enum**
```typescript
enum Role {
  ADMIN = 'ADMIN',
  GURU_BK = 'GURU_BK',
  WALI_KELAS = 'WALI_KELAS',
  SISWA = 'SISWA'
}
```

**Permission Matrix**

| Resource | Admin | Guru BK | Wali Kelas | Siswa |
|----------|-------|---------|------------|-------|
| Users | CRUD | - | - | Read (self) |
| Master Data | CRUD | Read | Read | Read |
| Mappings | CU | Read | Read | - |
| Violations | Read | CRUD | Read | Read (self) |
| Journals | - | CRUD (own) | - | - |
| Permissions | Read | CR | Read | Read (self) |
| Appointments | Read | RU | - | CRD (own) |

## Data Models

### Database Schema (PostgreSQL)

**Core Principles:**
- UUID primary keys untuk semua tabel
- Timestamps (created_at, updated_at) pada semua tabel
- Soft deletes dengan deleted_at untuk audit trail
- Foreign keys dengan ON DELETE CASCADE/RESTRICT sesuai business logic
- Indexes pada foreign keys dan kolom yang sering di-query

### Prisma Schema Overview

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  GURU_BK
  WALI_KELAS
  SISWA
}

enum AppointmentStatus {
  PENDING
  APPROVED
  REJECTED
  RESCHEDULED
  COMPLETED
  CANCELLED
}

enum PermissionType {
  MASUK
  KELUAR
}

enum ViolationType {
  PELANGGARAN
  PRESTASI
}
```


### Detailed Table Schemas

#### 1. Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'GURU_BK', 'WALI_KELAS', 'SISWA')),
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
```

#### 2. Academic Years Table
```sql
CREATE TABLE academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT check_dates CHECK (end_date > start_date)
);

CREATE INDEX idx_academic_years_active ON academic_years(is_active);
```

#### 3. Classes Table
```sql
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  grade_level INTEGER NOT NULL CHECK (grade_level BETWEEN 1 AND 12),
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(name, academic_year_id)
);

CREATE INDEX idx_classes_academic_year ON classes(academic_year_id);
CREATE INDEX idx_classes_grade_level ON classes(grade_level);
```

#### 4. Teachers Table
```sql
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nip VARCHAR(50) UNIQUE,
  specialization VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_teachers_user_id ON teachers(user_id);
```

#### 5. Students Table
```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nis VARCHAR(50) UNIQUE NOT NULL,
  nisn VARCHAR(50) UNIQUE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  date_of_birth DATE,
  address TEXT,
  parent_name VARCHAR(255),
  parent_phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_class_id ON students(class_id);
CREATE INDEX idx_students_nis ON students(nis);
```


#### 6. Class Homeroom Teachers (Wali Kelas Mapping)
```sql
CREATE TABLE class_homeroom_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(class_id, academic_year_id)
);

CREATE INDEX idx_homeroom_class ON class_homeroom_teachers(class_id);
CREATE INDEX idx_homeroom_teacher ON class_homeroom_teachers(teacher_id);
```

#### 7. Student Counselor Assignments (Siswa to Guru BK Mapping)
```sql
CREATE TABLE student_counselor_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  counselor_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assignments_student ON student_counselor_assignments(student_id);
CREATE INDEX idx_assignments_counselor ON student_counselor_assignments(counselor_id);
CREATE INDEX idx_assignments_academic_year ON student_counselor_assignments(academic_year_id);
```

#### 8. Violation Types Table
```sql
CREATE TABLE violation_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  points INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('PELANGGARAN', 'PRESTASI')),
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_violation_types_code ON violation_types(code);
CREATE INDEX idx_violation_types_type ON violation_types(type);
CREATE INDEX idx_violation_types_active ON violation_types(is_active);
```

#### 9. Violations Table
```sql
CREATE TABLE violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  violation_type_id UUID NOT NULL REFERENCES violation_types(id) ON DELETE RESTRICT,
  recorded_by UUID NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
  incident_date DATE NOT NULL,
  description TEXT,
  points INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_violations_student ON violations(student_id);
CREATE INDEX idx_violations_type ON violations(violation_type_id);
CREATE INDEX idx_violations_recorded_by ON violations(recorded_by);
CREATE INDEX idx_violations_incident_date ON violations(incident_date);
CREATE INDEX idx_violations_deleted_at ON violations(deleted_at);
```


#### 10. Counseling Journals Table (ENCRYPTED)
```sql
CREATE TABLE counseling_journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  counselor_id UUID NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
  session_date TIMESTAMP WITH TIME ZONE NOT NULL,
  encrypted_content TEXT NOT NULL,
  encryption_iv VARCHAR(32) NOT NULL,
  encryption_tag VARCHAR(32) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_journals_student ON counseling_journals(student_id);
CREATE INDEX idx_journals_counselor ON counseling_journals(counselor_id);
CREATE INDEX idx_journals_session_date ON counseling_journals(session_date);
CREATE INDEX idx_journals_deleted_at ON counseling_journals(deleted_at);

-- Security: Row Level Security (RLS) policy
-- Only the counselor who created the journal can access it
```

**Encryption Strategy for Counseling Journals:**

1. **Algorithm**: AES-256-GCM (Galois/Counter Mode)
2. **Key Management**: 
   - Master encryption key stored in environment variable (DATABASE_ENCRYPTION_KEY)
   - Per-record Initialization Vector (IV) stored in `encryption_iv` column
   - Authentication tag stored in `encryption_tag` column for integrity verification
3. **Encryption Process**:
   - Generate random IV for each journal entry
   - Encrypt content using AES-256-GCM with master key and IV
   - Store encrypted content, IV, and authentication tag
4. **Access Control**:
   - Application-level check: Only counselor_id matching session user can decrypt
   - Database-level: PostgreSQL Row Level Security (RLS) as additional layer
5. **Key Rotation**: Plan for future key rotation with versioning

```typescript
// lib/encryption/crypto.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.DATABASE_ENCRYPTION_KEY!, 'hex');

export function encrypt(text: string): {
  encrypted: string;
  iv: string;
  tag: string;
} {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
}

export function decrypt(encrypted: string, iv: string, tag: string): string {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```


#### 11. Permissions (Izin Masuk/Keluar) Table
```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  issued_by UUID NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
  permission_type VARCHAR(10) NOT NULL CHECK (permission_type IN ('MASUK', 'KELUAR')),
  reason TEXT NOT NULL,
  permission_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  destination VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_permissions_student ON permissions(student_id);
CREATE INDEX idx_permissions_issued_by ON permissions(issued_by);
CREATE INDEX idx_permissions_date ON permissions(permission_date);
CREATE INDEX idx_permissions_type ON permissions(permission_type);
```

#### 12. Appointments Table
```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  counselor_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' 
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED')),
  reason TEXT NOT NULL,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT check_appointment_times CHECK (end_time > start_time)
);

CREATE INDEX idx_appointments_student ON appointments(student_id);
CREATE INDEX idx_appointments_counselor ON appointments(counselor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_deleted_at ON appointments(deleted_at);
```

#### 13. Audit Logs Table
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

### Database Relationships Diagram

```
users (1) ──< (1) teachers
users (1) ──< (1) students

academic_years (1) ──< (*) classes
classes (1) ──< (*) students

classes (1) ──< (1) class_homeroom_teachers >── (1) teachers
students (*) ──< (*) student_counselor_assignments >── (*) teachers

violation_types (1) ──< (*) violations
students (1) ──< (*) violations
teachers (1) ──< (*) violations [recorded_by]

students (1) ──< (*) counseling_journals
teachers (1) ──< (*) counseling_journals [counselor_id]

students (1) ──< (*) permissions
teachers (1) ──< (*) permissions [issued_by]

students (1) ──< (*) appointments
teachers (1) ──< (*) appointments [counselor_id]
```


## Server Actions Design

Server Actions dikelompokkan berdasarkan domain dan disimpan di `src/lib/actions/`. Setiap action menggunakan Zod untuk validasi input dan mengembalikan type-safe response.

### Response Type Pattern

```typescript
type ActionResponse<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>; // Field-level validation errors
};
```

### 1. Authentication Actions (`src/lib/actions/auth.ts`)

```typescript
export async function signIn(
  formData: FormData
): Promise<ActionResponse<{ redirectUrl: string }>>

export async function signOut(): Promise<ActionResponse>

export async function changePassword(
  formData: FormData
): Promise<ActionResponse>
```

### 2. Admin - User Management Actions (`src/lib/actions/admin/users.ts`)

```typescript
export async function createUser(
  formData: FormData
): Promise<ActionResponse<{ userId: string }>>

export async function updateUser(
  userId: string,
  formData: FormData
): Promise<ActionResponse>

export async function deleteUser(
  userId: string
): Promise<ActionResponse>

export async function getUsers(
  filters?: { role?: Role; search?: string }
): Promise<ActionResponse<User[]>>

export async function getUserById(
  userId: string
): Promise<ActionResponse<User>>
```

### 3. Admin - Master Data Actions (`src/lib/actions/admin/master-data.ts`)

```typescript
// Academic Years
export async function createAcademicYear(
  formData: FormData
): Promise<ActionResponse<{ id: string }>>

export async function updateAcademicYear(
  id: string,
  formData: FormData
): Promise<ActionResponse>

export async function deleteAcademicYear(
  id: string
): Promise<ActionResponse>

export async function setActiveAcademicYear(
  id: string
): Promise<ActionResponse>

// Classes
export async function createClass(
  formData: FormData
): Promise<ActionResponse<{ id: string }>>

export async function updateClass(
  id: string,
  formData: FormData
): Promise<ActionResponse>

export async function deleteClass(
  id: string
): Promise<ActionResponse>

// Violation Types
export async function createViolationType(
  formData: FormData
): Promise<ActionResponse<{ id: string }>>

export async function updateViolationType(
  id: string,
  formData: FormData
): Promise<ActionResponse>

export async function deleteViolationType(
  id: string
): Promise<ActionResponse>
```


### 4. Admin - Mapping Actions (`src/lib/actions/admin/mappings.ts`)

```typescript
export async function assignStudentToCounselor(
  formData: FormData
): Promise<ActionResponse>

export async function removeStudentFromCounselor(
  assignmentId: string
): Promise<ActionResponse>

export async function assignHomeroomTeacher(
  formData: FormData
): Promise<ActionResponse>

export async function removeHomeroomTeacher(
  assignmentId: string
): Promise<ActionResponse>

export async function getStudentCounselorAssignments(
  filters?: { counselorId?: string; studentId?: string }
): Promise<ActionResponse<Assignment[]>>
```

### 5. Guru BK - Violation Actions (`src/lib/actions/guru-bk/violations.ts`)

```typescript
export async function createViolation(
  formData: FormData
): Promise<ActionResponse<{ id: string }>>

export async function updateViolation(
  id: string,
  formData: FormData
): Promise<ActionResponse>

export async function deleteViolation(
  id: string
): Promise<ActionResponse>

export async function getStudentViolations(
  studentId: string
): Promise<ActionResponse<ViolationWithDetails[]>>

export async function getMyStudents(): Promise<ActionResponse<Student[]>>

export async function getStudentViolationSummary(
  studentId: string
): Promise<ActionResponse<{
  totalPoints: number;
  violationCount: number;
  prestationCount: number;
}>>
```

### 6. Guru BK - Counseling Journal Actions (`src/lib/actions/guru-bk/journals.ts`)

```typescript
export async function createCounselingJournal(
  formData: FormData
): Promise<ActionResponse<{ id: string }>>

export async function updateCounselingJournal(
  id: string,
  formData: FormData
): Promise<ActionResponse>

export async function deleteCounselingJournal(
  id: string
): Promise<ActionResponse>

export async function getMyCounselingJournals(
  filters?: { studentId?: string; dateFrom?: string; dateTo?: string }
): Promise<ActionResponse<CounselingJournal[]>>

export async function getCounselingJournalById(
  id: string
): Promise<ActionResponse<CounselingJournal>>

// Note: All journal actions include counselor verification
// Only the counselor who created the journal can access it
```


### 7. Guru BK - Permission Actions (`src/lib/actions/guru-bk/permissions.ts`)

```typescript
export async function createPermission(
  formData: FormData
): Promise<ActionResponse<{ id: string; printData: PermissionPrintData }>>

export async function getPermissions(
  filters?: { studentId?: string; dateFrom?: string; dateTo?: string }
): Promise<ActionResponse<Permission[]>>

export async function getPermissionById(
  id: string
): Promise<ActionResponse<Permission>>

// Print data includes formatted permission slip for window.print()
type PermissionPrintData = {
  studentName: string;
  nis: string;
  className: string;
  permissionType: string;
  reason: string;
  date: string;
  time: string;
  issuedBy: string;
  permissionNumber: string;
};
```

### 8. Guru BK - Appointment Actions (`src/lib/actions/guru-bk/appointments.ts`)

```typescript
export async function getMyAppointments(
  filters?: { status?: AppointmentStatus; dateFrom?: string; dateTo?: string }
): Promise<ActionResponse<AppointmentWithStudent[]>>

export async function approveAppointment(
  id: string
): Promise<ActionResponse>

export async function rejectAppointment(
  id: string,
  reason: string
): Promise<ActionResponse>

export async function rescheduleAppointment(
  id: string,
  formData: FormData
): Promise<ActionResponse>

export async function completeAppointment(
  id: string
): Promise<ActionResponse>

export async function getAvailableSlots(
  counselorId: string,
  date: string
): Promise<ActionResponse<TimeSlot[]>>
```

### 9. Wali Kelas Actions (`src/lib/actions/wali-kelas/students.ts`)

```typescript
export async function getMyClassStudents(): Promise<ActionResponse<Student[]>>

export async function getStudentViolationHistory(
  studentId: string
): Promise<ActionResponse<ViolationWithDetails[]>>

export async function getStudentPermissionHistory(
  studentId: string
): Promise<ActionResponse<Permission[]>>

export async function getClassStatistics(): Promise<ActionResponse<{
  totalStudents: number;
  totalViolations: number;
  totalPrestations: number;
  averagePoints: number;
}>>
```


### 10. Siswa Actions (`src/lib/actions/siswa/profile.ts`)

```typescript
export async function getMyProfile(): Promise<ActionResponse<StudentProfile>>

export async function updateMyProfile(
  formData: FormData
): Promise<ActionResponse>

export async function getMyViolations(): Promise<ActionResponse<ViolationWithDetails[]>>

export async function getMyViolationSummary(): Promise<ActionResponse<{
  totalPoints: number;
  violationCount: number;
  prestationCount: number;
}>>

export async function getMyPermissions(): Promise<ActionResponse<Permission[]>>
```

### 11. Siswa - Appointment Actions (`src/lib/actions/siswa/appointments.ts`)

```typescript
export async function createAppointment(
  formData: FormData
): Promise<ActionResponse<{ id: string }>>

export async function cancelAppointment(
  id: string
): Promise<ActionResponse>

export async function getMyAppointments(
  filters?: { status?: AppointmentStatus }
): Promise<ActionResponse<AppointmentWithCounselor[]>>

export async function getMyCounselor(): Promise<ActionResponse<Teacher>>

export async function getCounselorAvailableSlots(
  date: string
): Promise<ActionResponse<TimeSlot[]>>
```

## UI Components Design

### Component Organization

Components diorganisir berdasarkan:
1. **ui/**: Shadcn/ui base components (Button, Input, Dialog, etc.)
2. **shared/**: Reusable components across roles (Navbar, Sidebar, etc.)
3. **admin/**, **guru-bk/**, **wali-kelas/**, **siswa/**: Role-specific components

### Shadcn/ui Components to Install

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add form
npx shadcn-ui@latest add select
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add table
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add label
npx shadcn-ui@latest add textarea
```


### Key UI Components

#### 1. Authentication Components

**LoginForm** (Client Component)
- Path: `src/components/auth/LoginForm.tsx`
- Purpose: Handle user login with email/username and password
- Data Source: Calls `signIn` server action
- Features: Form validation, error display, loading state

#### 2. Shared Components

**DashboardLayout** (Server Component)
- Path: `src/components/shared/DashboardLayout.tsx`
- Purpose: Main layout with sidebar and navbar
- Data Source: Session data from NextAuth
- Features: Role-based navigation, user menu, responsive sidebar

**Navbar** (Server Component)
- Path: `src/components/shared/Navbar.tsx`
- Purpose: Top navigation bar with user info and logout
- Data Source: Session data
- Features: User avatar, notifications, logout button

**Sidebar** (Client Component)
- Path: `src/components/shared/Sidebar.tsx`
- Purpose: Side navigation menu
- Data Source: Props (navigation items based on role)
- Features: Collapsible, active state, icons

**DataTable** (Client Component)
- Path: `src/components/shared/DataTable.tsx`
- Purpose: Reusable table with sorting, filtering, pagination
- Data Source: Props
- Features: TanStack Table integration, search, export

**StatCard** (Server Component)
- Path: `src/components/shared/StatCard.tsx`
- Purpose: Display statistics on dashboard
- Data Source: Props
- Features: Icon, title, value, trend indicator

#### 3. Admin Components

**UserManagementTable** (Client Component)
- Path: `src/components/admin/UserManagementTable.tsx`
- Purpose: Display and manage users
- Data Source: Server component passes data, calls user actions
- Features: CRUD operations, role filter, search

**UserForm** (Client Component)
- Path: `src/components/admin/UserForm.tsx`
- Purpose: Create/edit user form
- Data Source: Calls `createUser` or `updateUser` actions
- Features: Role selection, validation, password generation

**AcademicYearForm** (Client Component)
- Path: `src/components/admin/AcademicYearForm.tsx`
- Purpose: Create/edit academic year
- Data Source: Calls academic year actions
- Features: Date picker, active toggle

**ClassForm** (Client Component)
- Path: `src/components/admin/ClassForm.tsx`
- Purpose: Create/edit class
- Data Source: Calls class actions
- Features: Grade level selector, academic year selector

**ViolationTypeForm** (Client Component)
- Path: `src/components/admin/ViolationTypeForm.tsx`
- Purpose: Create/edit violation types
- Data Source: Calls violation type actions
- Features: Points input, type selector (pelanggaran/prestasi)

**StudentCounselorMapping** (Client Component)
- Path: `src/components/admin/StudentCounselorMapping.tsx`
- Purpose: Assign students to counselors
- Data Source: Calls mapping actions
- Features: Multi-select students, counselor selector

**HomeroomTeacherMapping** (Client Component)
- Path: `src/components/admin/HomeroomTeacherMapping.tsx`
- Purpose: Assign homeroom teacher to class
- Data Source: Calls mapping actions
- Features: Class selector, teacher selector


#### 4. Guru BK Components

**StudentList** (Server Component)
- Path: `src/components/guru-bk/StudentList.tsx`
- Purpose: Display list of assigned students
- Data Source: Calls `getMyStudents` action
- Features: Search, filter, student cards with violation summary

**ViolationForm** (Client Component)
- Path: `src/components/guru-bk/ViolationForm.tsx`
- Purpose: Record student violation/prestation
- Data Source: Calls `createViolation` action
- Features: Student selector, violation type selector, date picker, description

**ViolationHistory** (Server Component)
- Path: `src/components/guru-bk/ViolationHistory.tsx`
- Purpose: Display violation history for a student
- Data Source: Calls `getStudentViolations` action
- Features: Timeline view, edit/delete actions, point summary

**CounselingJournalForm** (Client Component)
- Path: `src/components/guru-bk/CounselingJournalForm.tsx`
- Purpose: Create/edit encrypted counseling journal
- Data Source: Calls `createCounselingJournal` or `updateCounselingJournal` actions
- Features: Rich text editor, student selector, session date, privacy indicator

**CounselingJournalList** (Server Component)
- Path: `src/components/guru-bk/CounselingJournalList.tsx`
- Purpose: Display counselor's own journals
- Data Source: Calls `getMyCounselingJournals` action
- Features: Filter by student/date, view/edit/delete, privacy badge

**CounselingJournalViewer** (Client Component)
- Path: `src/components/guru-bk/CounselingJournalViewer.tsx`
- Purpose: View decrypted journal entry
- Data Source: Calls `getCounselingJournalById` action
- Features: Read-only view, edit button, security indicator

**PermissionForm** (Client Component)
- Path: `src/components/guru-bk/PermissionForm.tsx`
- Purpose: Create permission slip (in-person flow)
- Data Source: Calls `createPermission` action
- Features: Student search, type selector, time picker, auto-print trigger

**PermissionPrintView** (Client Component)
- Path: `src/components/guru-bk/PermissionPrintView.tsx`
- Purpose: Formatted permission slip for printing
- Data Source: Props (permission data)
- Features: Print-optimized layout, QR code, school header

**AppointmentList** (Server Component)
- Path: `src/components/guru-bk/AppointmentList.tsx`
- Purpose: Display appointment requests
- Data Source: Calls `getMyAppointments` action
- Features: Status filter, approve/reject/reschedule actions, calendar view

**AppointmentCard** (Client Component)
- Path: `src/components/guru-bk/AppointmentCard.tsx`
- Purpose: Display single appointment with actions
- Data Source: Props
- Features: Student info, time, reason, action buttons (approve/reject/reschedule)


#### 5. Wali Kelas Components

**ClassDashboard** (Server Component)
- Path: `src/components/wali-kelas/ClassDashboard.tsx`
- Purpose: Display class overview and statistics
- Data Source: Calls `getClassStatistics` action
- Features: Student count, violation summary, charts

**ClassStudentList** (Server Component)
- Path: `src/components/wali-kelas/ClassStudentList.tsx`
- Purpose: Display students in homeroom class
- Data Source: Calls `getMyClassStudents` action
- Features: Search, sort by points, student cards

**StudentViolationView** (Server Component)
- Path: `src/components/wali-kelas/StudentViolationView.tsx`
- Purpose: View student violation history (read-only)
- Data Source: Calls `getStudentViolationHistory` action
- Features: Timeline view, point summary, filter by date

**StudentPermissionView** (Server Component)
- Path: `src/components/wali-kelas/StudentPermissionView.tsx`
- Purpose: View student permission history (read-only)
- Data Source: Calls `getStudentPermissionHistory` action
- Features: List view, filter by type/date, export

#### 6. Siswa Components

**StudentDashboard** (Server Component)
- Path: `src/components/siswa/StudentDashboard.tsx`
- Purpose: Student home page with overview
- Data Source: Calls `getMyProfile`, `getMyViolationSummary` actions
- Features: Profile card, violation summary, upcoming appointments

**StudentProfile** (Server Component)
- Path: `src/components/siswa/StudentProfile.tsx`
- Purpose: Display student profile information
- Data Source: Calls `getMyProfile` action
- Features: Personal info, class info, counselor info

**StudentProfileForm** (Client Component)
- Path: `src/components/siswa/StudentProfileForm.tsx`
- Purpose: Edit limited profile fields
- Data Source: Calls `updateMyProfile` action
- Features: Phone, address update only

**MyViolationList** (Server Component)
- Path: `src/components/siswa/MyViolationList.tsx`
- Purpose: Display own violation history (read-only)
- Data Source: Calls `getMyViolations` action
- Features: Timeline view, point summary, filter

**MyPermissionList** (Server Component)
- Path: `src/components/siswa/MyPermissionList.tsx`
- Purpose: Display own permission history (read-only)
- Data Source: Calls `getMyPermissions` action
- Features: List view, filter by type/date

**AppointmentBookingForm** (Client Component)
- Path: `src/components/siswa/AppointmentBookingForm.tsx`
- Purpose: Create new appointment request
- Data Source: Calls `createAppointment` action
- Features: Calendar view, time slot selector, reason input

**CounselorAvailability** (Client Component)
- Path: `src/components/siswa/CounselorAvailability.tsx`
- Purpose: Display counselor available time slots
- Data Source: Calls `getCounselorAvailableSlots` action
- Features: Calendar integration, slot selection, real-time availability

**MyAppointmentList** (Server Component)
- Path: `src/components/siswa/MyAppointmentList.tsx`
- Purpose: Display student's appointments
- Data Source: Calls `getMyAppointments` action
- Features: Status badges, cancel action, filter by status


## Error Handling

### Error Handling Strategy

**1. Client-Side Validation**
- Form validation menggunakan Zod schemas
- Real-time validation feedback
- Display field-level errors

**2. Server-Side Validation**
- Semua Server Actions melakukan validasi input dengan Zod
- Return structured error responses
- Sanitize inputs untuk mencegah injection attacks

**3. Database Errors**
- Prisma error handling dengan try-catch
- Translate database errors ke user-friendly messages
- Log errors untuk debugging

**4. Authentication Errors**
- Invalid credentials handling
- Session expiration handling
- Unauthorized access redirects

**5. Encryption Errors**
- Graceful handling jika decryption gagal
- Log encryption failures untuk investigation
- Never expose encryption details ke user

### Error Response Pattern

```typescript
// Success response
{
  success: true,
  data: { ... }
}

// Validation error response
{
  success: false,
  errors: {
    email: ["Email tidak valid"],
    password: ["Password minimal 8 karakter"]
  }
}

// General error response
{
  success: false,
  error: "Terjadi kesalahan. Silakan coba lagi."
}
```

### Error Logging

```typescript
// lib/logger.ts
export function logError(error: Error, context: Record<string, any>) {
  console.error({
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  });
  
  // In production: send to error tracking service (e.g., Sentry)
}
```

### User-Facing Error Messages

```typescript
// lib/error-messages.ts
export const ERROR_MESSAGES = {
  UNAUTHORIZED: "Anda tidak memiliki akses ke halaman ini",
  INVALID_CREDENTIALS: "Email/username atau password salah",
  SESSION_EXPIRED: "Sesi Anda telah berakhir. Silakan login kembali",
  VALIDATION_FAILED: "Data yang Anda masukkan tidak valid",
  NOT_FOUND: "Data tidak ditemukan",
  DUPLICATE_ENTRY: "Data sudah ada dalam sistem",
  SERVER_ERROR: "Terjadi kesalahan server. Silakan coba lagi",
  NETWORK_ERROR: "Koneksi internet bermasalah. Periksa koneksi Anda",
  ENCRYPTION_ERROR: "Terjadi kesalahan keamanan. Hubungi administrator",
  PERMISSION_DENIED: "Anda tidak memiliki izin untuk melakukan aksi ini"
};
```


## Testing Strategy

### Testing Pyramid

```
                    /\
                   /  \
                  / E2E \
                 /--------\
                /          \
               / Integration \
              /--------------\
             /                \
            /   Unit Tests     \
           /--------------------\
```

### 1. Unit Tests

**Tools**: Vitest, Testing Library

**Coverage Areas**:
- Utility functions (encryption, validation, formatting)
- Zod schemas validation
- Helper functions

**Example**:
```typescript
// lib/encryption/crypto.test.ts
describe('Encryption utilities', () => {
  it('should encrypt and decrypt text correctly', () => {
    const original = 'Sensitive counseling data';
    const { encrypted, iv, tag } = encrypt(original);
    const decrypted = decrypt(encrypted, iv, tag);
    expect(decrypted).toBe(original);
  });
});
```

### 2. Integration Tests

**Tools**: Vitest, Prisma Test Environment

**Coverage Areas**:
- Server Actions with database
- Authentication flows
- CRUD operations
- Role-based access control

**Example**:
```typescript
// lib/actions/guru-bk/journals.test.ts
describe('Counseling Journal Actions', () => {
  it('should only allow counselor to read their own journals', async () => {
    const journal = await createCounselingJournal(formData);
    const result = await getCounselingJournalById(journal.data.id);
    expect(result.success).toBe(true);
    
    // Try to access with different counselor
    const unauthorizedResult = await getCounselingJournalById(journal.data.id);
    expect(unauthorizedResult.success).toBe(false);
  });
});
```

### 3. Component Tests

**Tools**: Vitest, Testing Library, React Testing Library

**Coverage Areas**:
- Form submissions
- User interactions
- Conditional rendering based on role
- Client component behavior

**Example**:
```typescript
// components/guru-bk/ViolationForm.test.tsx
describe('ViolationForm', () => {
  it('should submit violation data correctly', async () => {
    render(<ViolationForm students={mockStudents} />);
    
    await userEvent.selectOptions(screen.getByLabelText('Siswa'), 'student-1');
    await userEvent.selectOptions(screen.getByLabelText('Jenis Pelanggaran'), 'violation-1');
    await userEvent.click(screen.getByRole('button', { name: 'Simpan' }));
    
    expect(mockCreateViolation).toHaveBeenCalled();
  });
});
```

### 4. End-to-End Tests

**Tools**: Playwright

**Coverage Areas**:
- Critical user flows
- Authentication and authorization
- Multi-step processes (e.g., create appointment → approve → complete)

**Example Scenarios**:
- Admin creates user → User logs in → User accesses role-specific dashboard
- Guru BK creates violation → Wali Kelas views violation → Siswa views own violation
- Siswa creates appointment → Guru BK approves → Appointment appears in both calendars
- Guru BK creates journal → Verify only creator can access → Admin cannot access

### 5. Security Tests

**Coverage Areas**:
- SQL injection prevention
- XSS prevention
- CSRF protection
- Encryption/decryption integrity
- Role-based access control enforcement
- Session management

**Manual Security Checklist**:
- [ ] All user inputs are validated and sanitized
- [ ] Passwords are hashed with bcrypt
- [ ] Counseling journals are encrypted at rest
- [ ] Only authorized users can access encrypted data
- [ ] SQL queries use parameterized statements (Prisma)
- [ ] CSRF tokens are validated
- [ ] Sessions expire after inactivity
- [ ] Sensitive data is not logged


## Performance Optimization

### 1. Database Optimization

**Indexing Strategy**:
- Primary keys (UUID) automatically indexed
- Foreign keys indexed for JOIN performance
- Frequently queried columns indexed (email, username, nis, status, dates)
- Composite indexes untuk query patterns yang umum

**Query Optimization**:
- Use Prisma's `select` untuk fetch only needed fields
- Use `include` dengan hati-hati untuk avoid N+1 queries
- Implement pagination untuk large datasets
- Use database-level aggregations

**Example**:
```typescript
// Efficient query with select and include
const students = await prisma.student.findMany({
  where: { classId: classId },
  select: {
    id: true,
    nis: true,
    user: {
      select: {
        fullName: true,
        email: true
      }
    },
    violations: {
      select: {
        points: true
      }
    }
  },
  take: 20,
  skip: page * 20
});
```

### 2. Caching Strategy

**Server-Side Caching**:
- Next.js automatic caching untuk Server Components
- Revalidate strategies untuk data yang jarang berubah
- Cache master data (violation types, classes, academic years)

**Example**:
```typescript
// app/guru-bk/students/page.tsx
export const revalidate = 300; // Revalidate every 5 minutes

export default async function StudentsPage() {
  const students = await getMyStudents();
  return <StudentList students={students} />;
}
```

**Client-Side Caching**:
- React Server Components automatic deduplication
- SWR atau React Query untuk client-side data fetching (jika diperlukan)

### 3. Code Splitting

- Automatic code splitting dengan Next.js App Router
- Dynamic imports untuk heavy components
- Lazy loading untuk modal dialogs dan forms

**Example**:
```typescript
import dynamic from 'next/dynamic';

const ViolationForm = dynamic(() => import('@/components/guru-bk/ViolationForm'), {
  loading: () => <FormSkeleton />
});
```

### 4. Image Optimization

- Use Next.js Image component untuk automatic optimization
- Lazy loading images
- Responsive images dengan srcset

### 5. Bundle Size Optimization

- Tree shaking dengan ES modules
- Analyze bundle dengan `@next/bundle-analyzer`
- Remove unused dependencies
- Use Shadcn/ui (tree-shakeable components)


## Security Considerations

### 1. Authentication Security

**Password Security**:
- Minimum 8 characters requirement
- Hash passwords dengan bcrypt (cost factor: 12)
- Never store plain text passwords
- Implement password change functionality

**Session Security**:
- JWT tokens dengan short expiration (1 hour)
- Refresh token mechanism
- Secure cookie flags (httpOnly, secure, sameSite)
- Session invalidation on logout

### 2. Authorization Security

**Role-Based Access Control**:
- Middleware-level route protection
- Server Action-level permission checks
- Database-level Row Level Security (RLS) untuk counseling journals
- Never trust client-side role checks

**Example**:
```typescript
// lib/actions/guru-bk/journals.ts
export async function getCounselingJournalById(id: string) {
  const session = await auth();
  
  if (!session || session.user.role !== 'GURU_BK') {
    return { success: false, error: ERROR_MESSAGES.UNAUTHORIZED };
  }
  
  const journal = await prisma.counselingJournal.findUnique({
    where: { id }
  });
  
  // Verify ownership
  if (journal.counselorId !== session.user.teacherId) {
    return { success: false, error: ERROR_MESSAGES.PERMISSION_DENIED };
  }
  
  // Decrypt and return
  const decrypted = decrypt(journal.encryptedContent, journal.encryptionIv, journal.encryptionTag);
  return { success: true, data: { ...journal, content: decrypted } };
}
```

### 3. Data Security

**Encryption at Rest**:
- Counseling journals encrypted dengan AES-256-GCM
- Encryption key stored in environment variable
- Never commit encryption keys to version control
- Plan untuk key rotation

**Encryption in Transit**:
- HTTPS only (enforce in production)
- Secure WebSocket connections (jika diperlukan di future)

**Input Sanitization**:
- Validate all inputs dengan Zod
- Sanitize HTML inputs untuk prevent XSS
- Use Prisma parameterized queries untuk prevent SQL injection

### 4. CSRF Protection

- Next.js built-in CSRF protection untuk Server Actions
- Verify origin headers
- Use SameSite cookie attribute

### 5. Rate Limiting

**Implementation**:
- Rate limit login attempts (5 attempts per 15 minutes)
- Rate limit API endpoints
- Use Redis atau in-memory store untuk tracking

**Example**:
```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '15 m'),
});

export async function checkRateLimit(identifier: string) {
  const { success } = await ratelimit.limit(identifier);
  return success;
}
```

### 6. Audit Logging

- Log all critical operations (create, update, delete)
- Log authentication attempts
- Log access to sensitive data (counseling journals)
- Store logs dengan timestamp, user ID, IP address, action


## Progressive Web App (PWA) Implementation

### PWA Features

**1. Installability**
- Web app manifest (`public/manifest.json`)
- Service worker untuk offline support
- Install prompts untuk mobile users

**Manifest Configuration**:
```json
{
  "name": "Aplikasi Bimbingan Konseling",
  "short_name": "BK App",
  "description": "Aplikasi digitalisasi layanan Bimbingan Konseling sekolah",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#10b981",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**2. Offline Support**
- Cache static assets (CSS, JS, images)
- Cache API responses untuk read-only data
- Offline fallback page
- Background sync untuk form submissions

**Service Worker Strategy**:
- Network-first untuk dynamic data
- Cache-first untuk static assets
- Stale-while-revalidate untuk master data

**3. Performance**
- Lazy loading images
- Code splitting
- Preload critical resources
- Optimize fonts

**next-pwa Configuration**:
```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

module.exports = withPWA({
  // Next.js config
});
```

## Deployment Strategy

### Development Environment

**Docker Compose Setup**:
```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: bk-app-postgres
    environment:
      POSTGRES_USER: bkapp
      POSTGRES_PASSWORD: bkapp_dev_password
      POSTGRES_DB: bk_app_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

**Environment Variables**:
```bash
# .env.local
DATABASE_URL="postgresql://bkapp:bkapp_dev_password@localhost:5432/bk_app_dev"
DATABASE_ENCRYPTION_KEY="your-32-byte-hex-key-here"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-here"
NODE_ENV="development"
```

### Production Considerations

**Database**:
- Use managed PostgreSQL (e.g., Supabase, Neon, AWS RDS)
- Enable SSL connections
- Regular backups
- Connection pooling (PgBouncer)

**Hosting**:
- Deploy to Vercel (recommended untuk Next.js)
- Alternative: Railway, Fly.io, AWS, Google Cloud

**Environment Variables**:
- Store securely (Vercel Environment Variables, AWS Secrets Manager)
- Rotate encryption keys periodically
- Use different keys untuk production dan staging

**Monitoring**:
- Error tracking (Sentry)
- Performance monitoring (Vercel Analytics)
- Database monitoring
- Uptime monitoring


## UI/UX Design Guidelines

### Design System

**Color Palette**:
```css
/* Tailwind config - colors */
colors: {
  primary: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#10b981', // Main green
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  neutral: {
    // Default Tailwind gray scale
  }
}
```

**Typography**:
- Font Family: Inter (Google Fonts)
- Headings: font-semibold
- Body: font-normal
- Scale: text-sm, text-base, text-lg, text-xl, text-2xl, text-3xl

**Spacing**:
- Consistent spacing scale (4px base unit)
- Use Tailwind spacing utilities (p-4, m-6, gap-4)

**Border Radius**:
- Small: rounded-md (6px)
- Medium: rounded-lg (8px)
- Large: rounded-xl (12px)
- Full: rounded-full

### Component Patterns

**Cards**:
```tsx
<Card className="p-6 shadow-sm hover:shadow-md transition-shadow">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

**Forms**:
```tsx
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="fieldName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Label</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <Button type="submit">Submit</Button>
  </form>
</Form>
```

**Tables**:
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Column 1</TableHead>
      <TableHead>Column 2</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {data.map((row) => (
      <TableRow key={row.id}>
        <TableCell>{row.field1}</TableCell>
        <TableCell>{row.field2}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Responsive Design

**Breakpoints**:
- Mobile: < 640px (sm)
- Tablet: 640px - 1024px (md, lg)
- Desktop: > 1024px (xl, 2xl)

**Mobile-First Approach**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>
```

**Navigation**:
- Mobile: Bottom navigation atau hamburger menu
- Desktop: Sidebar navigation

### Accessibility

**ARIA Labels**:
- All interactive elements have proper labels
- Form inputs have associated labels
- Buttons have descriptive text

**Keyboard Navigation**:
- All interactive elements are keyboard accessible
- Proper focus management
- Skip to content link

**Color Contrast**:
- WCAG AA compliance minimum
- Text contrast ratio > 4.5:1
- Interactive elements contrast ratio > 3:1

**Screen Reader Support**:
- Semantic HTML
- ARIA roles where needed
- Alt text untuk images


## Data Flow Examples

### Example 1: Creating a Violation Record

```
1. Guru BK opens violation form
   └─> Server Component fetches assigned students
       └─> Prisma query: student_counselor_assignments

2. Guru BK fills form and submits
   └─> Client Component calls createViolation Server Action
       └─> Validate input with Zod schema
       └─> Check authorization (is user Guru BK?)
       └─> Check if student is assigned to counselor
       └─> Prisma transaction:
           ├─> Create violation record
           └─> Update student total points (aggregate)
       └─> Create audit log entry
       └─> Return success response

3. UI updates with new violation
   └─> Revalidate path or redirect
   └─> Show success toast notification
```

### Example 2: Creating Encrypted Counseling Journal

```
1. Guru BK opens journal form
   └─> Server Component fetches assigned students

2. Guru BK writes journal entry and submits
   └─> Client Component calls createCounselingJournal Server Action
       └─> Validate input with Zod schema
       └─> Check authorization (is user Guru BK?)
       └─> Encrypt journal content:
           ├─> Generate random IV
           ├─> Encrypt with AES-256-GCM
           └─> Get authentication tag
       └─> Prisma create:
           ├─> Store encrypted_content
           ├─> Store encryption_iv
           ├─> Store encryption_tag
           └─> Store counselor_id (for access control)
       └─> Create audit log entry
       └─> Return success response (without decrypted content)

3. UI updates with new journal entry
   └─> Redirect to journal list
   └─> Show success notification
```

### Example 3: Student Booking Appointment

```
1. Siswa opens appointment booking page
   └─> Server Component fetches counselor info
   └─> Server Component fetches available slots

2. Siswa selects date
   └─> Client Component calls getCounselorAvailableSlots
       └─> Query existing appointments for that date
       └─> Calculate available time slots
       └─> Return available slots

3. Siswa selects time slot and submits
   └─> Client Component calls createAppointment Server Action
       └─> Validate input with Zod schema
       └─> Check authorization (is user Siswa?)
       └─> Check if slot is still available
       └─> Prisma create appointment with status PENDING
       └─> Create audit log entry
       └─> Return success response

4. Guru BK receives notification (future: real-time)
   └─> Appointment appears in Guru BK dashboard
   └─> Guru BK can approve/reject/reschedule
```

### Example 4: Creating and Printing Permission Slip

```
1. Siswa arrives at Guru BK office (in-person)

2. Guru BK opens permission form
   └─> Server Component renders form

3. Guru BK searches for student
   └─> Client Component with search functionality
   └─> Debounced search query

4. Guru BK fills form and clicks "Simpan & Cetak"
   └─> Client Component calls createPermission Server Action
       └─> Validate input with Zod schema
       └─> Check authorization (is user Guru BK?)
       └─> Prisma create permission record
       └─> Generate permission number (format: PRM/YYYY/MM/XXXX)
       └─> Create audit log entry
       └─> Return success with print data

5. Client receives response with print data
   └─> Open print dialog component
   └─> Render formatted permission slip
   └─> Trigger window.print()
   └─> User prints using browser print dialog
   └─> Close print dialog after printing
```


## Migration and Seeding Strategy

### Database Migrations

**Prisma Migrate Workflow**:
```bash
# Create migration
npx prisma migrate dev --name init

# Apply migrations to production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Seed Data

**Seed Script** (`prisma/seed.ts`):
```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create Academic Year
  const academicYear = await prisma.academicYear.create({
    data: {
      name: '2024/2025',
      startDate: new Date('2024-07-01'),
      endDate: new Date('2025-06-30'),
      isActive: true
    }
  });

  // Create Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@school.com',
      username: 'admin',
      passwordHash: await bcrypt.hash('admin123', 12),
      role: 'ADMIN',
      fullName: 'Administrator',
      isActive: true
    }
  });

  // Create Guru BK User
  const guruBkUser = await prisma.user.create({
    data: {
      email: 'gurubk@school.com',
      username: 'gurubk',
      passwordHash: await bcrypt.hash('gurubk123', 12),
      role: 'GURU_BK',
      fullName: 'Ibu Siti Nurhaliza',
      isActive: true
    }
  });

  const guruBk = await prisma.teacher.create({
    data: {
      userId: guruBkUser.id,
      nip: '198501012010012001',
      specialization: 'Bimbingan Konseling'
    }
  });

  // Create Wali Kelas User
  const waliKelasUser = await prisma.user.create({
    data: {
      email: 'walikelas@school.com',
      username: 'walikelas',
      passwordHash: await bcrypt.hash('walikelas123', 12),
      role: 'WALI_KELAS',
      fullName: 'Bapak Ahmad Dahlan',
      isActive: true
    }
  });

  const waliKelas = await prisma.teacher.create({
    data: {
      userId: waliKelasUser.id,
      nip: '198701012012011001',
      specialization: 'Matematika'
    }
  });

  // Create Class
  const class10A = await prisma.class.create({
    data: {
      name: '10 IPA 1',
      gradeLevel: 10,
      academicYearId: academicYear.id
    }
  });

  // Assign Wali Kelas to Class
  await prisma.classHomeroomTeacher.create({
    data: {
      classId: class10A.id,
      teacherId: waliKelas.id,
      academicYearId: academicYear.id
    }
  });

  // Create Student User
  const studentUser = await prisma.user.create({
    data: {
      email: 'siswa@school.com',
      username: 'siswa001',
      passwordHash: await bcrypt.hash('siswa123', 12),
      role: 'SISWA',
      fullName: 'Andi Wijaya',
      isActive: true
    }
  });

  const student = await prisma.student.create({
    data: {
      userId: studentUser.id,
      nis: '2024001',
      nisn: '0012345678',
      classId: class10A.id,
      dateOfBirth: new Date('2008-05-15'),
      address: 'Jl. Pendidikan No. 123',
      parentName: 'Bapak Wijaya',
      parentPhone: '081234567890'
    }
  });

  // Assign Student to Counselor
  await prisma.studentCounselorAssignment.create({
    data: {
      studentId: student.id,
      counselorId: guruBk.id,
      academicYearId: academicYear.id
    }
  });

  // Create Violation Types
  await prisma.violationType.createMany({
    data: [
      {
        code: 'P001',
        name: 'Terlambat masuk kelas',
        description: 'Datang terlambat ke sekolah atau kelas',
        points: 5,
        type: 'PELANGGARAN',
        category: 'Kedisiplinan'
      },
      {
        code: 'P002',
        name: 'Tidak mengerjakan tugas',
        description: 'Tidak mengumpulkan tugas tepat waktu',
        points: 10,
        type: 'PELANGGARAN',
        category: 'Akademik'
      },
      {
        code: 'P003',
        name: 'Berkelahi',
        description: 'Terlibat perkelahian dengan siswa lain',
        points: 50,
        type: 'PELANGGARAN',
        category: 'Perilaku'
      },
      {
        code: 'PR001',
        name: 'Juara lomba',
        description: 'Memenangkan lomba tingkat sekolah atau lebih tinggi',
        points: -20,
        type: 'PRESTASI',
        category: 'Prestasi'
      },
      {
        code: 'PR002',
        name: 'Membantu teman',
        description: 'Membantu teman yang kesulitan',
        points: -5,
        type: 'PRESTASI',
        category: 'Karakter'
      }
    ]
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Run Seed**:
```bash
npx prisma db seed
```


## Future Enhancements (Post-MVP)

Fitur-fitur berikut **TIDAK** termasuk dalam MVP, namun dapat dipertimbangkan untuk versi future:

### Phase 2 Features

1. **Real-time Notifications**
   - WebSocket atau Server-Sent Events
   - Push notifications untuk appointment updates
   - In-app notification center

2. **Advanced Reporting**
   - Dashboard analytics dengan charts
   - Export reports (PDF, Excel)
   - Violation trends analysis
   - Class comparison reports

3. **Parent Portal**
   - View student violations
   - View appointment history
   - Communication with counselor
   - Permission approval workflow

4. **Principal Portal**
   - School-wide statistics
   - Counselor performance metrics
   - Approval workflows untuk critical cases

5. **File Attachments**
   - Upload evidence untuk violations
   - Attach documents to counseling journals
   - Student document repository

### Phase 3 Features

1. **Chat System**
   - Real-time chat between student and counselor
   - Group counseling sessions
   - File sharing in chat

2. **Video Consultation**
   - WebRTC video calls
   - Screen sharing
   - Recording (with consent)

3. **Psychological Assessment**
   - Online questionnaires
   - Automated scoring
   - Result visualization
   - Historical tracking

4. **Mobile Apps**
   - Native iOS app
   - Native Android app
   - Better offline support

5. **Integration APIs**
   - Integration dengan sistem akademik sekolah
   - Integration dengan sistem absensi
   - Export data ke sistem lain

## Conclusion

Design document ini menyediakan blueprint lengkap untuk implementasi Aplikasi Bimbingan Konseling (BK) Sekolah. Arsitektur yang dipilih menggunakan Next.js 15 dengan App Router, TypeScript, PostgreSQL, dan Prisma memberikan foundation yang solid untuk aplikasi yang scalable, secure, dan maintainable.

### Key Design Decisions

1. **Next.js App Router**: Memanfaatkan Server Components dan Server Actions untuk performance optimal dan developer experience yang baik

2. **PostgreSQL dengan Prisma**: Type-safe database access dengan migration system yang robust

3. **AES-256-GCM Encryption**: Enkripsi level enterprise untuk counseling journals yang menjamin confidentiality

4. **Role-Based Access Control**: Multi-layer authorization (middleware, server actions, database) untuk security maksimal

5. **Shadcn/ui**: Component library yang customizable dan accessible

6. **PWA**: Progressive Web App untuk mobile-first experience dengan offline support

### Security Highlights

- End-to-end encryption untuk counseling journals
- Multi-layer authorization checks
- Input validation dan sanitization
- Audit logging untuk compliance
- Rate limiting untuk prevent abuse

### Next Steps

Setelah design document ini disetujui, langkah selanjutnya adalah:

1. Setup project structure dan dependencies
2. Configure database dan Prisma schema
3. Implement authentication system
4. Build core features incrementally
5. Testing dan security audit
6. Deployment ke production

Design ini telah mempertimbangkan semua requirements dari MVP document dan siap untuk diimplementasikan.
