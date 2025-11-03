# Implementation Plan

## Overview

Implementation plan ini memecah pembangunan Aplikasi Bimbingan Konseling (BK) Sekolah menjadi task-task yang dapat dieksekusi secara incremental. Setiap task dirancang untuk membangun di atas task sebelumnya, dengan fokus pada implementasi core functionality terlebih dahulu.

## Tasks

- [x] 1. Project initialization and setup
  - Initialize Next.js 15 project dengan TypeScript dan App Router
  - Install dan configure dependencies (Prisma, NextAuth, Tailwind, Shadcn/ui)
  - Setup Docker Compose untuk PostgreSQL development environment
  - Configure environment variables dan .env.example
  - Setup project directory structure sesuai design
  - _Requirements: All (Foundation)_

- [x] 2. Database schema implementation
  - [x] 2.1 Create Prisma schema dengan semua models
    - Define User, Teacher, Student models
    - Define AcademicYear, Class models
    - Define ViolationType, Violation models
    - Define CounselingJournal model dengan encryption fields
    - Define Permission, Appointment models
    - Define mapping tables (StudentCounselorAssignment, ClassHomeroomTeacher)
    - Define AuditLog model
    - _Requirements: 2.1, 2.2, 2.3, 4.1, 5.1, 6.1, 7.1, 8.1_
  - [x] 2.2 Create and run initial migration
    - Generate Prisma migration
    - Apply migration ke development database
    - Verify schema creation
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 2.3 Create database seed script
    - Implement seed.ts dengan sample data
    - Create admin, guru BK, wali kelas, dan siswa users
    - Create academic year, classes, violation types
    - Create mappings between entities
    - Run seed script dan verify data
    - _Requirements: 2.1, 2.2, 2.3_


- [x] 3. Encryption utilities implementation
  - [x] 3.1 Implement AES-256-GCM encryption functions
    - Create crypto.ts dengan encrypt() dan decrypt() functions
    - Implement IV generation dan authentication tag handling
    - Add error handling untuk encryption failures
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  - [x] 3.2 Write unit tests untuk encryption utilities
    - Test encrypt/decrypt round-trip
    - Test dengan berbagai input sizes
    - Test error handling untuk invalid inputs
    - _Requirements: 5.1, 11.1, 11.2_

- [x] 4. Authentication system implementation
  - [x] 4.1 Configure NextAuth.js v5
    - Create auth.config.ts dengan credentials provider
    - Implement JWT strategy dengan role dan userId dalam token
    - Configure session callbacks untuk include role data
    - Setup custom login page route
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [x] 4.2 Create authentication server actions
    - Implement signIn action dengan credential validation
    - Implement signOut action
    - Implement changePassword action
    - Add input validation dengan Zod schemas
    - _Requirements: 1.1, 1.2, 1.4, 11.1_
  - [x] 4.3 Implement middleware untuk route protection
    - Create middleware.ts dengan role-based route guards
    - Protect /admin routes untuk ADMIN only
    - Protect /guru-bk routes untuk GURU_BK only
    - Protect /wali-kelas routes untuk WALI_KELAS only
    - Protect /siswa routes untuk SISWA only
    - _Requirements: 1.3, 1.5_
  - [x] 4.4 Create login page dan form component
    - Build LoginForm client component dengan Shadcn/ui
    - Implement form validation dan error display
    - Add loading states dan error messages
    - Style dengan Tailwind CSS (green accent theme)
    - _Requirements: 1.1, 1.2, 10.1_

- [x] 5. Shared UI components and layout
  - [x] 5.1 Install dan configure Shadcn/ui components
    - Install base components (button, input, form, select, dialog, table, card, etc.)
    - Configure Tailwind dengan green color theme
    - Setup typography dan spacing utilities
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  - [x] 5.2 Create DashboardLayout component
    - Build layout dengan sidebar dan navbar
    - Implement responsive behavior (mobile/desktop)
    - Add role-based navigation items
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 10.1_
  - [x] 5.3 Create Navbar component
    - Display user info dan avatar
    - Add logout button
    - Implement mobile menu toggle
    - _Requirements: 9.5_
  - [x] 5.4 Create Sidebar component
    - Build navigation menu dengan icons
    - Implement active state highlighting
    - Add collapsible behavior untuk mobile
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  - [x] 5.5 Create reusable DataTable component
    - Implement dengan TanStack Table
    - Add sorting, filtering, pagination
    - Make it generic dan reusable
    - _Requirements: 2.1, 2.2, 2.3, 4.1, 6.1, 7.1, 8.1_
  - [x] 5.6 Create StatCard component untuk dashboard statistics
    - Display icon, title, value, trend
    - Make it responsive dan accessible
    - _Requirements: 9.1, 9.2, 9.3, 9.4_


- [x] 6. Admin module - User management
  - [x] 6.1 Create user management server actions
    - Implement createUser action dengan password hashing
    - Implement updateUser action
    - Implement deleteUser action (soft delete)
    - Implement getUsers action dengan filters
    - Implement getUserById action
    - Add authorization checks (ADMIN only)
    - _Requirements: 2.1, 2.2, 2.3, 11.3_
  - [x] 6.2 Create admin dashboard page
    - Build admin dashboard dengan statistics
    - Display user counts by role
    - Add quick action buttons
    - _Requirements: 9.1_
  - [x] 6.3 Create user management UI components
    - Build UserManagementTable component
    - Create UserForm component untuk create/edit
    - Implement search dan filter functionality
    - Add delete confirmation dialog
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 6.4 Create user management pages
    - Build /admin/users page dengan table
    - Create /admin/users/new page dengan form
    - Create /admin/users/[id]/edit page
    - Wire up dengan server actions
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 7. Admin module - Master data management
  - [x] 7.1 Create master data server actions
    - Implement academic year CRUD actions
    - Implement class CRUD actions
    - Implement violation type CRUD actions
    - Add authorization checks (ADMIN only)
    - _Requirements: 2.4, 2.5, 2.6_
  - [x] 7.2 Create academic year management UI
    - Build AcademicYearForm component
    - Create academic year list page
    - Implement set active year functionality
    - _Requirements: 2.5_
  - [x] 7.3 Create class management UI
    - Build ClassForm component dengan grade level selector
    - Create class list page dengan academic year filter
    - _Requirements: 2.4_
  - [x] 7.4 Create violation type management UI
    - Build ViolationTypeForm component
    - Create violation type list page
    - Implement category grouping
    - Add points display (positive untuk prestasi, negative untuk pelanggaran)
    - _Requirements: 2.6_

- [x] 8. Admin module - Mapping management
  - [x] 8.1 Create mapping server actions
    - Implement assignStudentToCounselor action
    - Implement removeStudentFromCounselor action
    - Implement assignHomeroomTeacher action
    - Implement removeHomeroomTeacher action
    - Implement getStudentCounselorAssignments action
    - Add authorization checks (ADMIN only)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 8.2 Create student-counselor mapping UI
    - Build StudentCounselorMapping component
    - Implement multi-select untuk students
    - Add counselor selector
    - Display current assignments dalam table
    - _Requirements: 3.1, 3.3_
  - [x] 8.3 Create homeroom teacher mapping UI
    - Build HomeroomTeacherMapping component
    - Implement class selector
    - Add teacher selector
    - Display current assignments
    - _Requirements: 3.2, 3.4_


- [x] 9. Guru BK module - Violation management
  - [x] 9.1 Create violation server actions
    - Implement createViolation action dengan point calculation
    - Implement updateViolation action
    - Implement deleteViolation action
    - Implement getStudentViolations action
    - Implement getMyStudents action (only assigned students)
    - Implement getStudentViolationSummary action
    - Add authorization checks (GURU_BK only, assigned students only)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  - [x] 9.2 Create Guru BK dashboard page
    - Display assigned students count
    - Show pending appointments
    - Display recent violations
    - Add quick action buttons
    - _Requirements: 9.2_
  - [x] 9.3 Create student list component
    - Build StudentList component dengan search
    - Display student cards dengan violation summary
    - Add filter by class
    - _Requirements: 4.1_
  - [x] 9.4 Create violation form component
    - Build ViolationForm dengan student selector
    - Add violation type selector (grouped by category)
    - Implement date picker untuk incident date
    - Add description textarea
    - Display calculated points
    - _Requirements: 4.2_
  - [x] 9.5 Create violation history component
    - Build ViolationHistory dengan timeline view
    - Display violation details dengan edit/delete actions
    - Show point summary (total, violations, prestations)
    - Add date range filter
    - _Requirements: 4.3, 4.5, 4.6_
  - [x] 9.6 Create violation management pages
    - Build /guru-bk/violations page dengan student list
    - Create /guru-bk/violations/new page dengan form
    - Create /guru-bk/violations/[studentId] page dengan history
    - Wire up dengan server actions
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 10. Guru BK module - Counseling journal (CRITICAL SECURITY)
  - [x] 10.1 Create counseling journal server actions
    - Implement createCounselingJournal action dengan encryption
    - Implement updateCounselingJournal action dengan re-encryption
    - Implement deleteCounselingJournal action
    - Implement getMyCounselingJournals action dengan decryption
    - Implement getCounselingJournalById action dengan ownership verification
    - Add strict authorization checks (only creator can access)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  - [x] 10.2 Create counseling journal form component
    - Build CounselingJournalForm dengan rich text editor
    - Add student selector (only assigned students)
    - Implement session date picker
    - Add privacy indicator badge
    - Display encryption status
    - _Requirements: 5.1, 5.5_
  - [x] 10.3 Create counseling journal list component
    - Build CounselingJournalList dengan filter by student/date
    - Display journal cards dengan preview (encrypted indicator)
    - Add view/edit/delete actions
    - Show privacy badges
    - _Requirements: 5.3, 5.5_
  - [x] 10.4 Create counseling journal viewer component
    - Build CounselingJournalViewer untuk read-only view
    - Display decrypted content
    - Add edit button (only for creator)
    - Show security indicator
    - _Requirements: 5.2, 5.6_
  - [x] 10.5 Create counseling journal pages
    - Build /guru-bk/journals page dengan list
    - Create /guru-bk/journals/new page dengan form
    - Create /guru-bk/journals/[id] page dengan viewer
    - Create /guru-bk/journals/[id]/edit page
    - Wire up dengan server actions
    - _Requirements: 5.1, 5.2, 5.3, 5.5_
  - [x] 10.6 Write integration tests untuk journal security
    - Test encryption/decryption flow
    - Test ownership verification
    - Test unauthorized access prevention (including ADMIN)
    - Test audit logging
    - _Requirements: 5.2, 5.4, 11.1, 11.2, 11.3_


- [x] 11. Guru BK module - Permission management
  - [x] 11.1 Create permission server actions
    - Implement createPermission action dengan auto-generate permission number
    - Implement getPermissions action dengan filters
    - Implement getPermissionById action
    - Add authorization checks (GURU_BK only)
    - Return formatted print data dalam response
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
  - [x] 11.2 Create permission form component
    - Build PermissionForm dengan student search
    - Add permission type selector (MASUK/KELUAR)
    - Implement time picker untuk start/end time
    - Add reason textarea dan destination input
    - Add "Simpan & Cetak" button
    - _Requirements: 6.2, 6.3_
  - [x] 11.3 Create permission print view component
    - Build PermissionPrintView dengan print-optimized layout
    - Display formatted permission slip
    - Add school header dan permission number
    - Implement QR code generation (optional)
    - Trigger window.print() after render
    - _Requirements: 6.4_
  - [x] 11.4 Create permission management pages
    - Build /guru-bk/permissions page dengan list
    - Create /guru-bk/permissions/new page dengan form dan print dialog
    - Implement print flow (create → show print view → trigger print)
    - Add permission history view
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 12. Guru BK module - Appointment management
  - [x] 12.1 Create appointment server actions untuk Guru BK
    - Implement getMyAppointments action dengan status filter
    - Implement approveAppointment action
    - Implement rejectAppointment action dengan reason
    - Implement rescheduleAppointment action
    - Implement completeAppointment action
    - Implement getAvailableSlots action
    - Add authorization checks (GURU_BK only)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  - [x] 12.2 Create appointment list component untuk Guru BK
    - Build AppointmentList dengan status filter
    - Display appointments dalam calendar view dan list view
    - Add approve/reject/reschedule action buttons
    - Show student info dan reason
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - [x] 12.3 Create appointment card component
    - Build AppointmentCard dengan student info
    - Display time, date, reason
    - Add action buttons (approve/reject/reschedule)
    - Show status badge
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - [x] 12.4 Create appointment management pages untuk Guru BK
    - Build /guru-bk/appointments page dengan list dan calendar
    - Implement filter by status dan date range
    - Add quick actions untuk pending appointments
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_


- [x] 13. Wali Kelas module implementation
  - [x] 13.1 Create Wali Kelas server actions
    - Implement getMyClassStudents action
    - Implement getStudentViolationHistory action (read-only)
    - Implement getStudentPermissionHistory action (read-only)
    - Implement getClassStatistics action
    - Add authorization checks (WALI_KELAS only, own class only)
    - Ensure NO access to counseling journals
    - _Requirements: 4.5, 6.6_
  - [x] 13.2 Create Wali Kelas dashboard page
    - Display class statistics (student count, violations, prestations)
    - Show recent student activities
    - Add charts untuk violation trends
    - _Requirements: 9.3_
  - [x] 13.3 Create class student list component
    - Build ClassStudentList dengan search dan sort
    - Display student cards dengan violation summary
    - Add view details action
    - _Requirements: 4.5_
  - [x] 13.4 Create student violation view component (read-only)
    - Build StudentViolationView dengan timeline
    - Display violation history (read-only, no edit/delete)
    - Show point summary
    - Add date range filter
    - _Requirements: 4.5_
  - [x] 13.5 Create student permission view component (read-only)
    - Build StudentPermissionView dengan list
    - Display permission history (read-only)
    - Add filter by type dan date
    - Implement export functionality
    - _Requirements: 6.6_
  - [x] 13.6 Create Wali Kelas pages
    - Build /wali-kelas/students page dengan class list
    - Create /wali-kelas/students/[id] page dengan violation dan permission history
    - Ensure counseling journals are NOT accessible
    - _Requirements: 4.5, 6.6_

- [x] 14. Siswa module - Profile and violations
  - [x] 14.1 Create Siswa profile server actions
    - Implement getMyProfile action
    - Implement updateMyProfile action (limited fields only)
    - Implement getMyViolations action (read-only)
    - Implement getMyViolationSummary action
    - Implement getMyPermissions action (read-only)
    - Add authorization checks (SISWA only, own data only)
    - _Requirements: 4.6, 6.7, 9.5_
  - [x] 14.2 Create Siswa dashboard page
    - Display profile card dengan photo
    - Show violation summary (total points, counts)
    - Display upcoming appointments
    - Add quick action buttons
    - _Requirements: 9.4_
  - [x] 14.3 Create student profile components
    - Build StudentProfile component dengan personal info
    - Create StudentProfileForm untuk edit limited fields
    - Display class info dan counselor info
    - _Requirements: 9.5_
  - [x] 14.4 Create my violation list component (read-only)
    - Build MyViolationList dengan timeline view
    - Display violation history (read-only, no edit)
    - Show point summary
    - Add date range filter
    - _Requirements: 4.6_
  - [x] 14.5 Create my permission list component (read-only)
    - Build MyPermissionList dengan list view
    - Display permission history (read-only)
    - Add filter by type dan date
    - _Requirements: 6.7_
  - [x] 14.6 Create Siswa profile pages
    - Build /siswa/profile page dengan view dan edit
    - Create /siswa/violations page dengan history
    - Create /siswa/permissions page dengan history
    - _Requirements: 4.6, 6.7, 9.5_


- [x] 15. Siswa module - Appointment booking
  - [x] 15.1 Create Siswa appointment server actions
    - Implement createAppointment action
    - Implement cancelAppointment action
    - Implement getMyAppointments action dengan status filter
    - Implement getMyCounselor action
    - Implement getCounselorAvailableSlots action
    - Add authorization checks (SISWA only, own appointments only)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  - [x] 15.2 Create counselor availability component
    - Build CounselorAvailability dengan calendar integration
    - Display available time slots
    - Implement slot selection
    - Show real-time availability
    - _Requirements: 7.1_
  - [x] 15.3 Create appointment booking form component
    - Build AppointmentBookingForm dengan date picker
    - Add time slot selector (from available slots)
    - Implement reason textarea
    - Add validation untuk prevent double booking
    - _Requirements: 7.2_
  - [x] 15.4 Create my appointment list component
    - Build MyAppointmentList dengan status badges
    - Display appointment cards dengan counselor info
    - Add cancel action untuk pending appointments
    - Implement filter by status
    - _Requirements: 7.4, 7.5_
  - [x] 15.5 Create Siswa appointment pages
    - Build /siswa/appointments page dengan list
    - Create /siswa/appointments/new page dengan booking form
    - Display counselor availability calendar
    - Show appointment status updates
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 16. Audit logging implementation
  - [x] 16.1 Create audit logging utility functions
    - Implement logAuditEvent function
    - Add helpers untuk log create/update/delete operations
    - Capture user ID, IP address, user agent
    - Store old values dan new values (JSON)
    - _Requirements: 11.6_
  - [x] 16.2 Integrate audit logging into server actions
    - Add audit logs untuk user CRUD operations
    - Add audit logs untuk violation CRUD operations
    - Add audit logs untuk counseling journal access (create/read/update/delete)
    - Add audit logs untuk permission creation
    - Add audit logs untuk appointment status changes
    - Add audit logs untuk mapping changes
    - _Requirements: 11.6_
  - [x] 16.3 Create audit log viewer untuk Admin
    - Build audit log list page dengan filters
    - Display log entries dengan user, action, timestamp
    - Add search by entity type dan entity ID
    - Implement date range filter
    - _Requirements: 11.6_


- [x] 17. Error handling and validation
  - [x] 17.1 Create Zod validation schemas
    - Define schemas untuk user creation/update
    - Define schemas untuk violation creation/update
    - Define schemas untuk counseling journal creation/update
    - Define schemas untuk permission creation
    - Define schemas untuk appointment creation/update
    - Define schemas untuk all other forms
    - _Requirements: 11.1, 11.2_
  - [x] 17.2 Implement error handling utilities
    - Create error message constants
    - Implement error logging function
    - Create user-friendly error message mapper
    - Add Prisma error handler
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  - [x] 17.3 Add error handling to all server actions
    - Wrap actions dalam try-catch blocks
    - Return structured error responses
    - Log errors dengan context
    - Sanitize error messages untuk users
    - _Requirements: 11.1, 11.2, 11.3_
  - [x] 17.4 Implement client-side error display
    - Add toast notifications untuk success/error messages
    - Display field-level validation errors dalam forms
    - Show loading states during actions
    - Add error boundaries untuk component errors
    - _Requirements: 11.1, 11.2_

- [-] 18. PWA implementation
  - [x] 18.1 Configure PWA dengan next-pwa
    - Install next-pwa package
    - Configure next-pwa in next.config.js
    - Create public/manifest.json with app metadata
    - Configure service worker strategy (network-first for dynamic, cache-first for static)
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  - [x] 18.2 Create PWA assets
    - Create public/icons directory
    - Generate app icons (192x192, 512x512) with green theme
    - Create splash screens for different devices
    - Add favicon.ico and apple-touch-icon.png
    - _Requirements: 10.1, 10.4_
  - [x] 18.3 Implement offline support
    - Configure cache strategies in service worker (network-first for API, cache-first for assets)
    - Create offline fallback page at app/offline/page.tsx
    - Test offline functionality with DevTools
    - _Requirements: 10.4_
  - [x] 18.4 Add install prompt and metadata
    - Add PWA meta tags to app/layout.tsx (theme-color, apple-mobile-web-app-capable)
    - Implement install prompt component for mobile users
    - Add "Add to Home Screen" button in user menu
    - Test installability on mobile devices
    - _Requirements: 10.1, 10.4_

- [x] 19. Responsive design and styling improvements
  - [x] 19.1 Audit and improve mobile responsiveness
    - Review all pages for mobile responsiveness (320px - 768px)
    - Improve table responsiveness (use horizontal scroll or card layout on mobile)
    - Enhance sidebar collapse behavior on mobile
    - Test navigation on mobile devices (ensure touch targets are adequate)
    - _Requirements: 10.1, 10.2, 10.3_
  - [x] 19.2 Enhance styling consistency
    - Review and ensure consistent green color theme usage (primary-500: #10b981)
    - Audit spacing consistency across all pages
    - Add smooth transitions to interactive elements
    - Ensure consistent card and button styling
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  - [x] 19.3 Improve accessibility
    - Audit and add missing ARIA labels to interactive elements
    - Test keyboard navigation on all forms and interactive components
    - Verify color contrast ratios meet WCAG AA standards
    - Enhance focus indicators for keyboard navigation
    - Add skip-to-content link for screen readers
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_


- [-] 20. Security hardening
  - [x] 20.1 Implement password security enhancements
    - Add password complexity validation in Zod schema (min 8 chars, mix of letters/numbers)
    - Verify bcrypt cost factor is 12 in all password hashing
    - Implement password change functionality in user profile
    - Add client-side password strength indicator component
    - _Requirements: 11.3_
  - [x] 20.2 Enhance session security
    - Review and configure NextAuth cookie flags (httpOnly, secure, sameSite: 'lax')
    - Set JWT expiration to 1 hour in auth.config.ts
    - Verify session invalidation on logout
    - Review CSRF protection in Next.js Server Actions
    - _Requirements: 1.5, 11.5_
  - [-] 20.3 Implement rate limiting
    - Install @upstash/ratelimit and @upstash/redis packages
    - Create lib/rate-limit.ts with rate limiting utility
    - Add rate limiting to login action (5 attempts per 15 minutes)
    - Add rate limiting to sensitive endpoints (journal access, user creation)
    - _Requirements: 11.1, 11.2, 11.3_
  - [ ] 20.4 Verify encryption security
    - Review encryption key management in .env.local
    - Test IV randomness in crypto.ts
    - Verify authentication tag verification in decrypt function
    - Ensure .env.local is in .gitignore
    - Document key rotation procedure
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 11.3_
  - [ ] 20.5 Conduct comprehensive security audit
    - Test SQL injection prevention (Prisma parameterized queries)
    - Test XSS prevention (input sanitization, React escaping)
    - Verify CSRF protection in Server Actions
    - Test role-based access control on all routes and actions
    - Test counseling journal access restrictions (only creator can access)
    - Verify audit logging captures all critical operations
    - Test unauthorized access attempts return proper errors
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [ ] 21. Testing implementation
  - [ ] 21.1 Expand unit tests untuk utilities
    - Review and expand crypto.test.ts (encryption/decryption edge cases)
    - Write tests for validation schemas in lib/validations
    - Write tests for error handling utilities
    - Write tests for audit logger functions
    - _Requirements: 11.1, 11.2_
  - [ ] 21.2 Write integration tests untuk server actions
    - Expand journals.test.ts with more security scenarios
    - Write tests for authentication flows (login, logout, session)
    - Write tests for user CRUD operations with authorization
    - Write tests for violation CRUD with role checks
    - Write tests for appointment workflow (create, approve, reject)
    - Write tests for permission creation
    - _Requirements: 1.1, 1.2, 1.3, 5.2, 5.4_
  - [ ] 21.3 Write component tests
    - Write tests for form components (ViolationForm, UserForm, etc.)
    - Write tests for user interactions (button clicks, form submissions)
    - Write tests for conditional rendering based on role
    - Write tests for error display components
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  - [ ] 21.4 Write E2E tests untuk critical flows
    - Setup Playwright for E2E testing
    - Write test for complete login → dashboard → logout flow
    - Write test for Guru BK violation creation flow
    - Write test for Siswa appointment booking → Guru BK approval flow
    - Write test for permission creation and print flow
    - Write test for counseling journal security (verify Admin cannot access)
    - _Requirements: 1.1, 4.1, 5.1, 6.1, 7.1_


- [ ] 22. Performance optimization
  - [ ] 22.1 Implement database query optimization
    - Review Prisma schema and add missing indexes (email, username, nis, status fields)
    - Audit server actions to use Prisma select for fetching only needed fields
    - Implement pagination in list views (users, violations, journals, appointments)
    - Review and optimize N+1 queries with proper includes
    - _Requirements: All (Performance)_
  - [ ] 22.2 Implement caching strategies
    - Add revalidate config to Server Components for master data pages
    - Cache violation types, classes, and academic years with appropriate revalidation
    - Implement stale-while-revalidate for dashboard statistics
    - Review and optimize Next.js caching behavior
    - _Requirements: All (Performance)_
  - [ ] 22.3 Implement code splitting and lazy loading
    - Use dynamic imports for heavy form components (ViolationForm, JournalForm)
    - Lazy load modal dialogs and print components
    - Review bundle size and identify large components for splitting
    - _Requirements: 10.1, 10.2, 10.3_
  - [ ] 22.4 Analyze and optimize bundle size
    - Install and run @next/bundle-analyzer
    - Review and remove unused dependencies from package.json
    - Optimize images with Next.js Image component where applicable
    - Review and optimize Shadcn/ui component imports
    - _Requirements: 10.1, 10.2, 10.3_

- [ ] 23. Documentation and deployment preparation
  - [ ] 23.1 Enhance README documentation
    - Review and update project setup instructions
    - Document all environment variables with descriptions
    - Add troubleshooting section for common issues
    - Document testing procedures (npm run test)
    - Add API documentation for server actions
    - _Requirements: All (Documentation)_
  - [ ] 23.2 Create deployment documentation
    - Create DEPLOYMENT.md with production deployment steps
    - Document environment variable checklist for production
    - Include database migration procedures for production
    - Document backup and restore procedures
    - Add monitoring and logging setup instructions
    - _Requirements: All (Documentation)_
  - [ ] 23.3 Create user documentation
    - Create USER_GUIDE.md with role-specific instructions
    - Document Admin workflows (user management, master data, mappings)
    - Document Guru BK workflows (violations, journals, permissions, appointments)
    - Document Wali Kelas workflows (viewing student data)
    - Document Siswa workflows (profile, appointments, viewing violations)
    - Add screenshots for key features
    - _Requirements: All (Documentation)_
  - [ ] 23.4 Prepare production environment
    - Choose and setup managed PostgreSQL provider (Supabase/Neon/Railway)
    - Configure production environment variables
    - Setup SSL/TLS certificates (if self-hosting)
    - Configure domain and DNS settings
    - Setup error tracking (Sentry or similar)
    - _Requirements: All (Deployment)_
  - [ ] 23.5 Deploy to production
    - Deploy application to hosting platform (Vercel recommended)
    - Run database migrations in production
    - Seed initial production data (admin user, violation types, academic year)
    - Test all critical flows in production
    - Setup monitoring and alerts
    - Document rollback procedures
    - _Requirements: All (Deployment)_

## Notes

- All tasks are required for comprehensive implementation
- Each task builds incrementally on previous tasks
- Security-critical tasks (especially Task 10 - Counseling Journals) require extra attention
- All tasks should include proper error handling and validation
- Testing should be performed after each major feature implementation
- The implementation should follow the design document strictly, especially for encryption and authorization

## Estimated Timeline

- **Phase 1** (Tasks 1-5): Project setup, database, auth, shared components - 1-2 weeks
- **Phase 2** (Tasks 6-8): Admin module - 1 week
- **Phase 3** (Tasks 9-12): Guru BK module - 2-3 weeks
- **Phase 4** (Tasks 13-15): Wali Kelas dan Siswa modules - 1-2 weeks
- **Phase 5** (Tasks 16-20): Audit, error handling, PWA, security - 1 week
- **Phase 6** (Tasks 21-23): Testing, optimization, deployment - 1-2 weeks

**Total Estimated Time**: 7-11 weeks for MVP completion

## Current Implementation Status

Based on the codebase analysis, the following has been completed:

### ✅ Completed (Tasks 1-17)
- Project setup and infrastructure (Next.js 15, TypeScript, Prisma, Docker)
- Database schema and migrations
- Encryption utilities with tests
- Authentication system (NextAuth.js v5)
- All shared UI components (DashboardLayout, Navbar, Sidebar, DataTable, etc.)
- Complete Admin module (users, master data, mappings, audit logs)
- Complete Guru BK module (violations, journals, permissions, appointments)
- Complete Wali Kelas module (student viewing)
- Complete Siswa module (profile, violations, permissions, appointments)
- Audit logging system
- Error handling and validation framework
- Zod validation schemas
- Client-side error display with toast notifications

### 🚧 Remaining Work (Tasks 18-23)

**Task 18: PWA Implementation** - Not started
- Need to install next-pwa and configure service workers
- Create manifest.json and PWA assets
- Implement offline support

**Task 19: Responsive Design Improvements** - Partially complete
- Core responsiveness exists but needs mobile optimization audit
- Accessibility features need enhancement

**Task 20: Security Hardening** - Partially complete
- Basic security in place (bcrypt, encryption, RBAC)
- Need to add rate limiting
- Need comprehensive security audit

**Task 21: Testing** - Minimal coverage
- Only 2 test files exist (crypto.test.ts, journals.test.ts)
- Need extensive integration, component, and E2E tests

**Task 22: Performance Optimization** - Not started
- Need database indexing review
- Need caching strategy implementation
- Need bundle size analysis

**Task 23: Documentation & Deployment** - Basic README exists
- Need deployment documentation
- Need user guides
- Need production environment setup

### Priority Recommendations

**High Priority (MVP Critical):**
1. Task 20.3: Implement rate limiting for security
2. Task 19.1: Mobile responsiveness audit and fixes
3. Task 21.2: Integration tests for critical flows
4. Task 22.1: Database query optimization and indexing

**Medium Priority (Post-MVP):**
1. Task 18: PWA implementation for mobile experience
2. Task 21.3-21.4: Component and E2E tests
3. Task 22.2-22.4: Performance optimization
4. Task 23: Documentation and deployment

**Low Priority (Nice to Have):**
1. Task 19.3: Advanced accessibility features
2. Task 20.4: Encryption security audit
3. Task 23.3: Comprehensive user documentation
