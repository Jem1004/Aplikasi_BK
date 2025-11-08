import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  User, 
  GraduationCap, 
  Phone, 
  MapPin, 
  Calendar,
  AlertCircle,
  FileText,
  FileCheck,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { ViolationHistory } from '@/components/guru-bk/ViolationHistory';
import { getStudentViolations, getStudentViolationSummary } from '@/lib/actions/guru-bk/violations';

interface PageProps {
  params: {
    studentId: string;
  };
}

export default async function StudentDetailPage({ params }: PageProps) {
  const session = await auth();
  const resolvedParams = await params;

  if (!session?.user?.teacherId) {
    redirect('/unauthorized');
  }

  // Get student data
  const student = await prisma.student.findUnique({
    where: { id: resolvedParams.studentId },
    include: {
      user: {
        select: {
          fullName: true,
          email: true,
          phone: true,
        },
      },
      class: {
        select: {
          name: true,
          gradeLevel: true,
        },
      },
      counselorAssignments: {
        where: {
          counselorId: session.user.teacherId,
        },
        include: {
          academicYear: {
            select: {
              name: true,
              isActive: true,
            },
          },
        },
      },
    },
  });

  if (!student) {
    redirect('/guru-bk/students');
  }

  // Check if this student is assigned to current counselor
  if (student.counselorAssignments.length === 0) {
    redirect('/unauthorized');
  }

  // Get violations
  const violationsResult = await getStudentViolations(resolvedParams.studentId);
  const summaryResult = await getStudentViolationSummary(resolvedParams.studentId);

  const violations = violationsResult.success ? violationsResult.data : [];
  const summary = summaryResult.success ? summaryResult.data : null;

  // Get journals count
  const journalsCount = await prisma.counselingJournal.count({
    where: {
      studentId: params.studentId,
      counselorId: session.user.teacherId,
      deletedAt: null,
    },
  });

  // Get permissions count
  const permissionsCount = await prisma.permission.count({
    where: {
      studentId: params.studentId,
      issuedBy: session.user.teacherId,
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/guru-bk/students">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Detail Siswa
          </h1>
          <p className="text-muted-foreground mt-1">
            Informasi lengkap dan riwayat siswa
          </p>
        </div>
      </div>

      {/* Student Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profil Siswa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Nama Lengkap</p>
                  <p className="font-medium text-gray-900">{student.user.fullName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <GraduationCap className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">NIS / NISN</p>
                  <p className="font-medium text-gray-900">
                    {student.nis} {student.nisn && `/ ${student.nisn}`}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <GraduationCap className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Kelas</p>
                  <p className="font-medium text-gray-900">
                    {student.class?.name || 'Belum ada kelas'}
                  </p>
                </div>
              </div>

              {student.dateOfBirth && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Tanggal Lahir</p>
                    <p className="font-medium text-gray-900">
                      {new Date(student.dateOfBirth).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {student.user.email && (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{student.user.email}</p>
                  </div>
                </div>
              )}

              {student.parentName && (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Nama Orang Tua</p>
                    <p className="font-medium text-gray-900">{student.parentName}</p>
                  </div>
                </div>
              )}

              {student.parentPhone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Telepon Orang Tua</p>
                    <p className="font-medium text-gray-900">{student.parentPhone}</p>
                  </div>
                </div>
              )}

              {student.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Alamat</p>
                    <p className="font-medium text-gray-900">{student.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Poin</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalPoints || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.totalPoints && summary.totalPoints > 0 ? 'Pelanggaran' : 
               summary?.totalPoints && summary.totalPoints < 0 ? 'Prestasi' : 'Normal'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pelanggaran</CardTitle>
            <div className="h-4 w-4 rounded-full bg-red-100 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.violationCount || 0}</div>
            <p className="text-xs text-muted-foreground">Total catatan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jurnal</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{journalsCount}</div>
            <p className="text-xs text-muted-foreground">Sesi konseling</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Izin</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{permissionsCount}</div>
            <p className="text-xs text-muted-foreground">Surat izin</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Aksi Cepat</CardTitle>
          <CardDescription>
            Tindakan yang dapat dilakukan untuk siswa ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link href={`/guru-bk/violations/new?studentId=${resolvedParams.studentId}`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Catat Pelanggaran
              </Button>
            </Link>
            <Link href={`/guru-bk/journals/new?studentId=${resolvedParams.studentId}`}>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Buat Jurnal
              </Button>
            </Link>
            <Link href={`/guru-bk/permissions/new?studentId=${resolvedParams.studentId}`}>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Buat Izin
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for History */}
      <Tabs defaultValue="violations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="violations">Riwayat Pelanggaran</TabsTrigger>
          <TabsTrigger value="summary">Ringkasan</TabsTrigger>
        </TabsList>

        <TabsContent value="violations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Pelanggaran & Prestasi</CardTitle>
              <CardDescription>
                Catatan lengkap pelanggaran dan prestasi siswa
              </CardDescription>
            </CardHeader>
            <CardContent>
              {violations && violations.length > 0 ? (
                <ViolationHistory 
                  violations={violations} 
                  studentName={student.user.fullName}
                />
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Belum Ada Catatan
                  </h3>
                  <p className="text-gray-500">
                    Siswa ini belum memiliki catatan pelanggaran atau prestasi
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Poin</CardTitle>
              <CardDescription>
                Breakdown poin berdasarkan kategori
              </CardDescription>
            </CardHeader>
            <CardContent>
              {summary ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Total Poin</p>
                      <p className="text-sm text-gray-500">Akumulasi keseluruhan</p>
                    </div>
                    <Badge variant={summary.totalPoints > 0 ? 'destructive' : 'default'}>
                      {summary.totalPoints > 0 ? '+' : ''}{summary.totalPoints} poin
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Pelanggaran</p>
                      <p className="text-sm text-gray-500">Catatan negatif</p>
                    </div>
                    <Badge variant="destructive">
                      {summary.violationCount} catatan
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Prestasi</p>
                      <p className="text-sm text-gray-500">Catatan positif</p>
                    </div>
                    <Badge variant="default">
                      {summary.prestationCount} catatan
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Belum ada data ringkasan</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
