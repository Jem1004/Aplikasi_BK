import { StudentViolationView } from "@/components/wali-kelas/StudentViolationView";
import { StudentPermissionView } from "@/components/wali-kelas/StudentPermissionView";
import {
  getStudentViolationHistory,
  getStudentPermissionHistory,
} from "@/lib/actions/wali-kelas/students";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { notFound } from "next/navigation";

type PageProps = {
  params: {
    id: string;
  };
};

async function getStudentData(studentId: string) {
  // Get student info
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: true,
      class: true,
    },
  });

  if (!student || student.deletedAt) {
    return null;
  }

  // Get violations
  const violationsResult = await getStudentViolationHistory(studentId);
  const violations = violationsResult.success ? violationsResult.data || [] : [];

  // Get permissions
  const permissionsResult = await getStudentPermissionHistory(studentId);
  const permissions = permissionsResult.success ? permissionsResult.data || [] : [];

  return {
    student,
    violations,
    permissions,
    violationsError: violationsResult.success ? null : violationsResult.error,
    permissionsError: permissionsResult.success ? null : permissionsResult.error,
  };
}

export default async function StudentDetailPage({ params }: PageProps) {
  const data = await getStudentData(params.id);

  if (!data) {
    notFound();
  }

  const { student, violations, permissions, violationsError, permissionsError } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/wali-kelas/students">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{student.user.fullName}</h1>
          <p className="text-muted-foreground mt-1">
            NIS: {student.nis} • {student.class?.name || 'Tanpa Kelas'}
          </p>
        </div>
      </div>

      {/* Student Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-base">{student.user.email}</p>
            </div>
            {student.nisn && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">NISN</p>
                <p className="text-base">{student.nisn}</p>
              </div>
            )}
            {student.parentName && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nama Orang Tua</p>
                <p className="text-base">{student.parentName}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Violations and Permissions */}
      <Tabs defaultValue="violations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="violations">
            Pelanggaran & Prestasi ({violations.length})
          </TabsTrigger>
          <TabsTrigger value="permissions">
            Riwayat Izin ({permissions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="violations" className="space-y-4">
          {violationsError ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                  <p className="text-lg font-semibold mb-2">Terjadi Kesalahan</p>
                  <p className="text-muted-foreground">{violationsError}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <StudentViolationView
              violations={violations}
              studentName={student.user.fullName}
            />
          )}
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          {permissionsError ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                  <p className="text-lg font-semibold mb-2">Terjadi Kesalahan</p>
                  <p className="text-muted-foreground">{permissionsError}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <StudentPermissionView
              permissions={permissions}
              studentName={student.user.fullName}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Note about counseling journals */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900">
            <strong>Catatan:</strong> Jurnal konseling bersifat privat dan hanya dapat diakses oleh Guru BK yang membuatnya. 
            Sebagai Wali Kelas, Anda dapat melihat riwayat pelanggaran, prestasi, dan izin siswa untuk keperluan monitoring.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
