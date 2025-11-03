import { getStudentViolations, getStudentViolationSummary } from '@/lib/actions/guru-bk/violations';
import { ViolationHistory } from '@/components/guru-bk/ViolationHistory';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';

type PageProps = {
  params: Promise<{
    studentId: string;
  }>;
};

export default async function StudentViolationHistoryPage({ params }: PageProps) {
  const { studentId } = await params;

  // Get student info
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: true,
      class: true,
    },
  });

  if (!student) {
    redirect('/guru-bk/violations');
  }

  // Get violations
  const violationsResult = await getStudentViolations(studentId);

  if (!violationsResult.success) {
    redirect('/unauthorized');
  }

  const violations = violationsResult.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/guru-bk/violations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{student.user.fullName}</h1>
          <p className="text-muted-foreground mt-1">
            NIS: {student.nis} • {student.class?.name || 'Tanpa Kelas'}
          </p>
        </div>
        <Link href={`/guru-bk/violations/new?studentId=${studentId}`}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Catat Pelanggaran
          </Button>
        </Link>
      </div>

      <ViolationHistory
        violations={violations}
        studentName={student.user.fullName}
        canEdit={true}
      />
    </div>
  );
}
