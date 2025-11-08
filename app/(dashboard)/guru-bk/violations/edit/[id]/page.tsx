import dynamic from 'next/dynamic';
import { getViolationById } from '@/lib/actions/guru-bk/violations';
import { prisma } from '@/lib/db/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { redirect, notFound } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

const EditViolationForm = dynamic(() => import('@/components/guru-bk/EditViolationForm').then(mod => ({ default: mod.EditViolationForm })), {
  loading: () => (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-32 w-full" />
      <div className="flex gap-3">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
});

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditViolationPage({ params }: PageProps) {
  const { id } = await params;

  // Get violation details
  const violationResult = await getViolationById(id);

  if (!violationResult.success) {
    if (violationResult.error?.includes('tidak ditemukan')) {
      notFound();
    }
    redirect('/unauthorized');
  }

  const violation = violationResult.data;

  if (!violation) {
    notFound();
  }

  // Get active violation types
  const violationTypes = await prisma.violationType.findMany({
    where: {
      isActive: true,
      deletedAt: null,
    },
    orderBy: [
      { type: 'asc' },
      { category: 'asc' },
      { name: 'asc' },
    ],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Pelanggaran/Prestasi</h1>
        <p className="text-muted-foreground mt-2">
          Perbarui catatan pelanggaran atau prestasi siswa
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Edit Pelanggaran/Prestasi</CardTitle>
          <CardDescription>
            Perbarui data pelanggaran atau prestasi untuk {violation.student.user.fullName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditViolationForm
            violation={violation}
            violationTypes={violationTypes}
          />
        </CardContent>
      </Card>
    </div>
  );
}