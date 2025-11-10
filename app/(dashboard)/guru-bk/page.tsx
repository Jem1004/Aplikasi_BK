import { StatCard } from "@/components/shared/StatCard";
import { GraduationCap, AlertCircle, Calendar, FileText, Plus } from "lucide-react";
import { getMyStudents } from "@/lib/actions/guru-bk/violations";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Implement stale-while-revalidate for dashboard statistics
// Cache for 1 minute (60 seconds) - dashboard stats should be relatively fresh
export const revalidate = 60;

async function getDashboardData() {
  const session = await auth();
  
  if (!session?.user?.teacherId) {
    return {
      studentsCount: 0,
      recentViolationsCount: 0,
      pendingAppointmentsCount: 0,
      journalsCount: 0,
      recentViolations: [],
    };
  }

  const teacherId = session.user.teacherId;

  // Get students count
  const studentsResult = await getMyStudents();
  const studentsCount = studentsResult.success ? studentsResult.data?.length || 0 : 0;

  // Get recent violations count (this month)
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const recentViolationsCount = await prisma.violation.count({
    where: {
      recordedBy: teacherId,
      incidentDate: {
        gte: startOfMonth,
      }
    },
  });

  // Get pending appointments count
  const pendingAppointmentsCount = await prisma.appointment.count({
    where: {
      counselorId: teacherId,
      status: 'PENDING'
    },
  });

  // Get journals count
  const journalsCount = await prisma.counselingJournal.count({
    where: {
      counselorId: teacherId
    },
  });

  // Get recent violations for display
  const recentViolations = await prisma.violation.findMany({
    where: {
      recordedBy: teacherId
    },
    include: {
      student: {
        include: {
          user: true,
          class: true,
        },
      },
      violationType: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
  });

  return {
    studentsCount,
    recentViolationsCount,
    pendingAppointmentsCount,
    journalsCount,
    recentViolations,
  };
}

export default async function GuruBKDashboard() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Guru BK</h1>
          <p className="text-muted-foreground mt-2">
            Kelola siswa dan layanan konseling
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/guru-bk/violations/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Catat Pelanggaran
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Siswa Binaan"
          value={data.studentsCount.toString()}
          description="Siswa yang di-mapping"
          icon={GraduationCap}
        />
        <StatCard
          title="Pelanggaran"
          value={data.recentViolationsCount.toString()}
          description="Bulan ini"
          icon={AlertCircle}
        />
        <StatCard
          title="Janji Temu"
          value={data.pendingAppointmentsCount.toString()}
          description="Menunggu persetujuan"
          icon={Calendar}
        />
        <StatCard
          title="Jurnal"
          value={data.journalsCount.toString()}
          description="Jurnal konseling"
          icon={FileText}
        />
      </div>

      {/* Recent Violations */}
      <Card>
        <CardHeader>
          <CardTitle>Pelanggaran Terbaru</CardTitle>
          <CardDescription>
            5 pelanggaran terakhir yang dicatat
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentViolations.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Belum ada pelanggaran yang dicatat
            </p>
          ) : (
            <div className="space-y-4">
              {data.recentViolations.map((violation) => (
                <div
                  key={violation.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{violation.student.user.fullName}</p>
                      <Badge variant={violation.violationType.type === 'PELANGGARAN' ? 'destructive' : 'default'}>
                        {violation.violationType.type === 'PELANGGARAN' ? 'Pelanggaran' : 'Prestasi'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {violation.violationType.name} • {violation.student.class?.name || 'Tanpa Kelas'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(violation.incidentDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${violation.points > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {violation.points > 0 ? '+' : ''}{violation.points}
                    </p>
                    <p className="text-xs text-muted-foreground">poin</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
