'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { getMyStudents } from '@/lib/actions/guru-bk/violations';
import type { PermissionPrintData } from '@/lib/actions/guru-bk/permissions';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const PermissionForm = dynamic(() => import('@/components/guru-bk/PermissionForm').then(mod => ({ default: mod.PermissionForm })), {
  loading: () => (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-10 w-32" />
    </div>
  ),
  ssr: false
});

const PermissionPrintView = dynamic(() => import('@/components/guru-bk/PermissionPrintView').then(mod => ({ default: mod.PermissionPrintView })), {
  loading: () => <div className="fixed inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-white" /></div>,
  ssr: false
});

type Student = {
  id: string;
  nis: string;
  user: {
    fullName: string;
  };
  class: {
    name: string;
  } | null;
};

export default function NewPermissionPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [printData, setPrintData] = useState<PermissionPrintData | null>(null);

  useEffect(() => {
    async function loadStudents() {
      try {
        const result = await getMyStudents();
        if (result.success && result.data) {
          setStudents(result.data);
        }
      } catch (error) {
        console.error('Failed to load students:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadStudents();
  }, []);

  const handlePrintReady = (data: PermissionPrintData) => {
    setPrintData(data);
  };

  const handleClosePrint = () => {
    setPrintData(null);
    router.push('/guru-bk/permissions');
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Buat Izin Baru</h1>
        <p className="text-muted-foreground mt-2">
          Buat dan cetak surat izin untuk siswa
        </p>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <PermissionForm students={students} onPrintReady={handlePrintReady} />
      </div>

      {/* Print Dialog */}
      {printData && (
        <PermissionPrintView printData={printData} onClose={handleClosePrint} />
      )}
    </div>
  );
}
