import { getMyStudents } from '@/lib/actions/guru-bk/violations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Eye } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

// Cache student list for 2 minutes (120 seconds)
export const revalidate = 120;

export default async function StudentsPage() {
  const result = await getMyStudents();

  if (!result.success) {
    redirect('/unauthorized');
  }

  const students = result.data || [];

  // Calculate total points for each student
  const studentsWithPoints = students.map((s) => {
    const totalPoints = s.violations.reduce((sum, v) => sum + v.points, 0);
    return { ...s, totalPoints };
  });

  // Calculate statistics
  const totalStudents = students.length;
  const studentsWithViolations = studentsWithPoints.filter((s) => s.totalPoints > 0).length;
  const studentsWithAchievements = studentsWithPoints.filter((s) => s.totalPoints < 0).length;
  const averagePoints =
    totalStudents > 0
      ? Math.round(studentsWithPoints.reduce((sum, s) => sum + s.totalPoints, 0) / totalStudents)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Siswa Binaan</h1>
          <p className="text-muted-foreground mt-2">
            Daftar siswa yang menjadi tanggung jawab Anda
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">Siswa binaan Anda</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dengan Pelanggaran</CardTitle>
            <div className="h-4 w-4 rounded-full bg-red-100 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentsWithViolations}</div>
            <p className="text-xs text-muted-foreground">
              {totalStudents > 0 ? Math.round((studentsWithViolations / totalStudents) * 100) : 0}%
              dari total siswa
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dengan Prestasi</CardTitle>
            <div className="h-4 w-4 rounded-full bg-emerald-100 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentsWithAchievements}</div>
            <p className="text-xs text-muted-foreground">
              {totalStudents > 0 ? Math.round((studentsWithAchievements / totalStudents) * 100) : 0}%
              dari total siswa
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Poin</CardTitle>
            <div className="h-4 w-4 rounded-full bg-blue-100 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averagePoints}</div>
            <p className="text-xs text-muted-foreground">
              {averagePoints > 0
                ? 'Perlu perhatian'
                : averagePoints < 0
                ? 'Sangat baik'
                : 'Normal'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Student Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Daftar Siswa</CardTitle>
              <CardDescription>
                Total {students.length} siswa binaan
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Belum Ada Siswa Binaan
              </h3>
              <p className="text-gray-500 mb-4">
                Anda belum memiliki siswa yang ditugaskan. Hubungi admin untuk penugasan siswa.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">No</TableHead>
                    <TableHead>Nama Siswa</TableHead>
                    <TableHead>NIS</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telepon Orang Tua</TableHead>
                    <TableHead className="text-center">Total Poin</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsWithPoints.map((student, index) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <span className="text-sm font-semibold text-emerald-700">
                              {student.user.fullName
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{student.user.fullName}</p>
                            {student.nisn && (
                              <p className="text-sm text-gray-500">NISN: {student.nisn}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{student.nis}</span>
                      </TableCell>
                      <TableCell>
                        {student.class ? (
                          <Badge variant="outline">{student.class.name}</Badge>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {student.user.email || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {student.parentPhone || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {student.totalPoints === 0 ? (
                          <Badge variant="outline">0</Badge>
                        ) : student.totalPoints > 0 ? (
                          <Badge variant="destructive">+{student.totalPoints}</Badge>
                        ) : (
                          <Badge className="bg-emerald-500 hover:bg-emerald-600">
                            {student.totalPoints}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/guru-bk/students/${student.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Detail
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
