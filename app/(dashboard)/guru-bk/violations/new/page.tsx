import { getMyStudents } from '@/lib/actions/guru-bk/violations';
import { prisma } from '@/lib/db/prisma';
import { ViolationForm } from '@/components/guru-bk/ViolationForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { redirect } from 'next/navigation';

type PageProps = {
  searchParams: Promise<{
    studentId?: string;
  }>;
};

export default async function NewViolationPage({ searchParams }: PageProps) {
  const { studentId } = await searchParams;
  // Get students
  const studentsResult = await getMyStudents();

  if (!studentsResult.success) {
    redirect('/unauthorized');
  }

  const students = studentsResult.data || [];

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
        <h1 className="text-3xl font-bold text-gray-900">Catat Pelanggaran/Prestasi</h1>
        <p className="text-muted-foreground mt-2">
          Tambahkan catatan pelanggaran atau prestasi siswa
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Pelanggaran/Prestasi</CardTitle>
          <CardDescription>
            Isi form di bawah untuk mencatat pelanggaran atau prestasi siswa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ViolationForm
            students={students}
            violationTypes={violationTypes}
            defaultStudentId={studentId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
