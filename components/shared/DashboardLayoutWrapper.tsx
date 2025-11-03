'use client';

import dynamic from 'next/dynamic';
import { LoadingPage } from '@/components/shared/LoadingSpinner';

// Dynamically import components in a client component
const DashboardLayout = dynamic(
  () => import('@/components/shared/DashboardLayout').then(mod => ({ default: mod.DashboardLayout })),
  {
    loading: () => <LoadingPage text="Memuat dashboard..." />,
    ssr: false
  }
);

// Navbar removed for minimalis design

const InstallPrompt = dynamic(
  () => import('@/components/shared/InstallPrompt').then(mod => ({ default: mod.InstallPrompt })),
  {
    loading: () => null,
    ssr: false
  }
);

interface DashboardLayoutWrapperProps {
  children: React.ReactNode;
  role: string;
}

export function DashboardLayoutWrapper({ children, role }: DashboardLayoutWrapperProps) {
  return (
    <>
      <DashboardLayout role={role} navbar={undefined}>
        {children}
      </DashboardLayout>
      <InstallPrompt />
    </>
  );
}