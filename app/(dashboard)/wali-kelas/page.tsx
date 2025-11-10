import { StatCard } from "@/components/shared/StatCard";
import { Users, AlertCircle, Award, TrendingUp } from "lucide-react";
import { getClassStatistics } from "@/lib/actions/wali-kelas/students";
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
      statistics: {
        totalStudents: 0,
        totalViolations: 0,
        totalPrestations: 0,
        averagePoints: 0,
      },
      className: 'Tidak ada kelas',
      recentActivities: [],
    };
  }

  const teacherId = session.user.teacherId;

  // Get class info for active academic year
  const homeroomAssignment = await prisma.classHomeroomTeacher.findFirst({
    where: {
      teacherId,
      academicYear: {
        isActive: true,
      },
    },
    include: {
      class: true,
    },
  });

  const className = homeroomAssignment?.class.name || 'Tidak ada kelas';

  // Get class statistics
  const statsResult = await getClassStatistics();
  const statistics = statsResult.success ? statsResult.data! : {
    totalStudents: 0,
    totalViolations: 0,
    totalPrestations: 0,
    averagePoints: 0,
  };

  // Get recent activities (violations and permissions)
  const recentActivities = await prisma.violation.findMany({
    where: {
      student: {
        classId: homeroomAssignment?.classId,
      },
    },
    include: {
      student: {
        include: {
          user: true,
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
    statistics,
    className,
    recentActivities,
  };
}

export default async function WaliKelasDashboard() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Wali Kelas</h1>
          <p className="text-muted-foreground mt-2">
            Kelas {data.className}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/wali-kelas/students">
            <Button>
              <Users className="h-4 w-4 mr-2" />
              Lihat Siswa
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Siswa"
          value={data.statistics.totalStudents.toString()}
          description="Siswa di kelas"
          icon={Users}
        />
        <StatCard
          title="Pelanggaran"
          value={data.statistics.totalViolations.toString()}
          description="Total pelanggaran"
          icon={AlertCircle}
        />
        <StatCard
          title="Prestasi"
          value={data.statistics.totalPrestations.toString()}
          description="Total prestasi"
          icon={Award}
        />
        <StatCard
          title="Rata-rata Poin"
          value={data.statistics.averagePoints.toString()}
          description="Per siswa"
          icon={TrendingUp}
        />
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Aktivitas Terbaru</CardTitle>
          <CardDescription>
            5 aktivitas terakhir siswa di kelas Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentActivities.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Belum ada aktivitas yang tercatat
            </p>
          ) : (
            <div className="space-y-4">
              {data.recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{activity.student.user.fullName}</p>
                      <Badge variant={activity.violationType.type === 'PELANGGARAN' ? 'destructive' : 'default'}>
                        {activity.violationType.type === 'PELANGGARAN' ? 'Pelanggaran' : 'Prestasi'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {activity.violationType.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(activity.incidentDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${activity.points > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {activity.points > 0 ? '+' : ''}{activity.points}
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
