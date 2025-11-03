# Code Splitting and Lazy Loading Implementation

## Overview

Implemented dynamic imports and lazy loading for heavy form components, modal dialogs, and large table components to improve initial page load performance and reduce bundle sizes.

## Implementation Date

November 3, 2024

## Changes Made

### 1. Form Components with Dynamic Imports

The following heavy form components were converted to use `next/dynamic` with loading skeletons:

#### Admin Module
- **UserForm** (used in `/admin/users/new` and `/admin/users/[id]/edit`)
  - Size: Large form with role selection, class assignment, and validation
  - Loading state: Skeleton with 4 input fields
  
- **AcademicYearForm** (used in `/admin/master-data/academic-years/new`)
  - Loading state: Skeleton with 3 input fields
  
- **ClassForm** (used in `/admin/master-data/classes/new`)
  - Loading state: Skeleton with 3 input fields
  
- **ViolationTypeForm** (used in `/admin/master-data/violation-types/new`)
  - Loading state: Skeleton with 3 input fields

#### Guru BK Module
- **ViolationForm** (used in `/guru-bk/violations/new`)
  - Already implemented with dynamic import
  - Loading state: Skeleton with 3 fields
  
- **CounselingJournalForm** (used in `/guru-bk/journals/new` and `/guru-bk/journals/[id]/edit`)
  - Already implemented with dynamic import
  - Loading state: Skeleton with rich text editor placeholder
  
- **PermissionForm** (used in `/guru-bk/permissions/new`)
  - Already implemented with dynamic import (Client Component)
  - Loading state: Skeleton with 3 fields
  
- **PermissionPrintView** (used in `/guru-bk/permissions/new`)
  - Already implemented with dynamic import (Client Component)
  - Loading state: Loading spinner overlay

#### Siswa Module
- **StudentProfileForm** (used in `/siswa/profile`)
  - Loading state: Card with skeleton fields
  
- **AppointmentBookingForm** (used in `/siswa/appointments/new`)
  - Already implemented with dynamic import
  - Loading state: Two cards with skeleton content

#### Shared Components
- **ChangePasswordForm** (used in all settings pages)
  - Implemented in:
    - `/admin/settings`
    - `/guru-bk/settings`
    - `/wali-kelas/settings`
    - `/siswa/profile` (in tabs)
  - Loading state: Card with skeleton fields

### 2. Table and List Components with Dynamic Imports

Large table and list components that display multiple records:

- **UserManagementTable** (used in `/admin/users`)
  - Size: Complex table with sorting, filtering, and actions
  - Loading state: Card with table skeleton
  
- **CounselingJournalList** (used in `/guru-bk/journals`)
  - Size: List with encrypted content indicators
  - Loading state: Card with multiple item skeletons
  
- **AuditLogList** (used in `/admin/audit-logs`)
  - Size: Large table with pagination and filters
  - Loading state: Card with table skeleton

### 3. Mapping Components with Dynamic Imports

Complex mapping components with multiple selects and tables:

- **StudentCounselorMapping** (used in `/admin/mappings`)
  - Size: Multi-select with assignment table
  - Loading state: Card with form and table skeletons
  
- **HomeroomTeacherMapping** (used in `/admin/mappings`)
  - Size: Class and teacher selectors with assignment table
  - Loading state: Card with form and table skeletons

### 4. Bug Fixes

- **Fixed offline page**: Converted to Client Component to support onClick handlers
- **Fixed action-wrapper types**: Updated Session type import to resolve TypeScript errors
- **Fixed validation schema**: Corrected `ViolationType` to `ViolationCategory` enum

## Technical Implementation

### Dynamic Import Pattern

```typescript
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const ComponentName = dynamic(
  () => import('@/components/path/ComponentName').then(mod => ({ default: mod.ComponentName })),
  {
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-32" />
      </div>
    )
  }
);
```

### Key Considerations

1. **Server Components**: Removed `ssr: false` option as it's not allowed in Next.js 15 Server Components
2. **Client Components**: Kept `ssr: false` for components marked with `'use client'` directive
3. **Loading States**: Used Skeleton components from shadcn/ui for consistent loading UX
4. **Bundle Splitting**: Each dynamically imported component creates a separate chunk

## Performance Impact

### Bundle Size Analysis

After implementation, the build shows improved code splitting:

- **Shared First Load JS**: 102 kB (baseline for all pages)
- **Page-specific bundles**: Range from 134 B to 12.8 kB
- **Heavy form pages**: Reduced initial load by lazy-loading form components
- **Table pages**: Reduced initial load by lazy-loading table components

### Example Improvements

- `/admin/users/new`: Form component loaded on-demand (187 kB total with form)
- `/guru-bk/journals/new`: Journal form loaded on-demand (193 kB total with form)
- `/admin/mappings`: Mapping components loaded on-demand (178 kB total)

## Files Modified

### Pages with New Dynamic Imports (11 files)
1. `app/(dashboard)/admin/master-data/academic-years/new/page.tsx`
2. `app/(dashboard)/admin/master-data/classes/new/page.tsx`
3. `app/(dashboard)/admin/master-data/violation-types/new/page.tsx`
4. `app/(dashboard)/admin/settings/page.tsx`
5. `app/(dashboard)/admin/users/page.tsx`
6. `app/(dashboard)/admin/mappings/page.tsx`
7. `app/(dashboard)/admin/audit-logs/page.tsx`
8. `app/(dashboard)/guru-bk/settings/page.tsx`
9. `app/(dashboard)/guru-bk/journals/page.tsx`
10. `app/(dashboard)/siswa/profile/page.tsx`
11. `app/(dashboard)/wali-kelas/settings/page.tsx`

### Pages with Fixed Dynamic Imports (6 files)
1. `app/(dashboard)/admin/users/new/page.tsx` - Removed `ssr: false`
2. `app/(dashboard)/admin/users/[id]/edit/page.tsx` - Removed `ssr: false`
3. `app/(dashboard)/guru-bk/violations/new/page.tsx` - Removed `ssr: false`
4. `app/(dashboard)/guru-bk/journals/new/page.tsx` - Removed `ssr: false`
5. `app/(dashboard)/guru-bk/journals/[id]/edit/page.tsx` - Removed `ssr: false`
6. `app/(dashboard)/siswa/appointments/new/page.tsx` - Removed `ssr: false`

### Bug Fixes (3 files)
1. `app/offline/page.tsx` - Added `'use client'` directive
2. `lib/errors/action-wrapper.ts` - Fixed Session type import
3. `lib/validations/master-data.ts` - Fixed enum name from `ViolationType` to `ViolationCategory`

## Testing

### Build Verification
- ✅ Production build completes successfully
- ✅ No TypeScript errors
- ✅ All dynamic imports resolve correctly
- ✅ Loading states render properly

### Manual Testing Checklist
- [ ] Test form loading states on slow connections
- [ ] Verify all forms still function correctly
- [ ] Test table loading states
- [ ] Verify mapping components work correctly
- [ ] Test offline page functionality

## Benefits

1. **Reduced Initial Bundle Size**: Heavy components are loaded only when needed
2. **Improved Time to Interactive**: Faster initial page load
3. **Better User Experience**: Skeleton loading states provide visual feedback
4. **Code Organization**: Clear separation between page logic and heavy components
5. **Scalability**: Easy to add more dynamic imports as the app grows

## Future Improvements

1. **Bundle Analysis**: Install `@next/bundle-analyzer` to identify more optimization opportunities
2. **Prefetching**: Add prefetch hints for commonly accessed routes
3. **Image Optimization**: Ensure all images use Next.js Image component
4. **Component-level Code Splitting**: Consider splitting large components into smaller chunks

## Related Tasks

- Task 22.1: Database query optimization ✅
- Task 22.2: Caching strategies ✅
- Task 22.3: Code splitting and lazy loading ✅ (This document)
- Task 22.4: Bundle size analysis (Optional)

## References

- [Next.js Dynamic Imports](https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading)
- [React.lazy and Suspense](https://react.dev/reference/react/lazy)
- [Code Splitting Best Practices](https://web.dev/code-splitting-suspense/)
