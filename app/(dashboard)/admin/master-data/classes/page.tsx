import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getClasses, getAcademicYears } from '@/lib/actions/admin/master-data';
import { ClassActions } from '@/components/admin/ClassActions';
import { ClassFilter } from '@/components/admin/ClassFilter';

interface ClassesPageProps {
  searchParams: Promise<{
    academicYearId?: string;
  }>;
}

export default async function ClassesPage({ searchParams }: ClassesPageProps) {
  const params = await searchParams;
  const [classesResult, academicYearsResult] = await Promise.all([
    getClasses(params.academicYearId),
    getAcademicYears(),
  ]);

  const classes = classesResult.success && classesResult.data ? classesResult.data : [];
  const academicYears = academicYearsResult.success && academicYearsResult.data ? academicYearsResult.data : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Kelas</h1>
          <p className="text-muted-foreground">Kelola data kelas</p>
        </div>
        <Link href="/admin/master-data/classes/new">
          <Button>Tambah Kelas</Button>
        </Link>
      </div>

      <ClassFilter academicYears={academicYears} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {classes && classes.length > 0 ? (
          classes.map((classItem: any) => (
            <Card key={classItem.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle>{classItem.name}</CardTitle>
                    <CardDescription>
                      Tingkat {classItem.gradeLevel} • {classItem.academicYear.name}
                    </CardDescription>
                  </div>
                  <ClassActions classData={classItem} academicYears={academicYears} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary">
                    {classItem._count.students} Siswa
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">
                {params.academicYearId
                  ? 'Tidak ada kelas untuk tahun ajaran yang dipilih'
                  : 'Belum ada kelas'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
