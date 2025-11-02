import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAcademicYears } from '@/lib/actions/admin/master-data';
import { AcademicYearActions } from '@/components/admin/AcademicYearActions';

export default async function AcademicYearsPage() {
  const result = await getAcademicYears();
  const academicYears = result.success ? result.data : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tahun Ajaran</h1>
          <p className="text-muted-foreground">Kelola data tahun ajaran</p>
        </div>
        <Link href="/admin/master-data/academic-years/new">
          <Button>Tambah Tahun Ajaran</Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {academicYears && academicYears.length > 0 ? (
          academicYears.map((year: any) => (
            <Card key={year.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {year.name}
                      {year.isActive && (
                        <Badge variant="default" className="bg-green-600">
                          Aktif
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {new Date(year.startDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}{' '}
                      -{' '}
                      {new Date(year.endDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </CardDescription>
                  </div>
                  <AcademicYearActions academicYear={year} />
                </div>
              </CardHeader>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">Belum ada tahun ajaran</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
