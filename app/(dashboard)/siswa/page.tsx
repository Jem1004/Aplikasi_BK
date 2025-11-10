import { StatCard } from "@/components/shared/StatCard";
import { AlertCircle, Award, Calendar, User, Edit } from "lucide-react";
import { getMyProfile, getMyViolationSummary } from "@/lib/actions/siswa/profile";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Implement stale-while-revalidate for dashboard statistics
// Cache for 1 minute (60 seconds) - dashboard stats should be relatively fresh
export const revalidate = 60;

async function getDashboardData() {
  const session = await auth();
  
  if (!session?.user?.studentId) {
    return {
      profile: null,
      violationSummary: {
        totalPoints: 0,
        violationCount: 0,
        prestationCount: 0,
      },
      upcomingAppointments: [],
    };
  }

  const studentId = session.user.studentId;

  // Get profile
  const profileResult = await getMyProfile();
  const profile = profileResult.success ? profileResult.data : null;

  // Get violation summary
  const summaryResult = await getMyViolationSummary();
  const violationSummary = summaryResult.success && summaryResult.data ? summaryResult.data : {
    totalPoints: 0,
    violationCount: 0,
    prestationCount: 0,
  };

  // Get upcoming appointments
  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      studentId,
      status: {
        in: ['PENDING', 'APPROVED'],
      }
    },
    include: {
      counselor: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      appointmentDate: 'asc',
    },
    take: 3,
  });

  return {
    profile,
    violationSummary,
    upcomingAppointments,
  };
}

export default async function SiswaDashboard() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Siswa</h1>
        <p className="text-muted-foreground mt-2">
          Pantau perkembangan dan aktivitas Anda
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Poin"
          value={data.violationSummary.totalPoints.toString()}
          description="Akumulasi poin"
          icon={AlertCircle}
        />
        <StatCard
          title="Pelanggaran"
          value={data.violationSummary.violationCount.toString()}
          description="Jumlah pelanggaran"
          icon={AlertCircle}
        />
        <StatCard
          title="Prestasi"
          value={data.violationSummary.prestationCount.toString()}
          description="Jumlah prestasi"
          icon={Award}
        />
        <StatCard
          title="Janji Temu"
          value={data.upcomingAppointments.length.toString()}
          description="Janji temu aktif"
          icon={Calendar}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Profil Saya</CardTitle>
              <Link href="/siswa/profile">
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.profile ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary-100 text-primary-700 text-xl">
                      {data.profile.user.fullName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{data.profile.user.fullName}</h3>
                    <p className="text-sm text-muted-foreground">NIS: {data.profile.nis}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kelas:</span>
                    <span className="font-medium">{data.profile.class?.name || 'Belum ada kelas'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{data.profile.user.email}</span>
                  </div>
                  {data.profile.counselorAssignments.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Guru BK:</span>
                      <span className="font-medium">
                        {data.profile.counselorAssignments[0].counselor.user.fullName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Data profil tidak ditemukan
              </p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Janji Temu Mendatang</CardTitle>
            <CardDescription>
              Jadwal konseling dengan Guru BK
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.upcomingAppointments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Belum ada janji temu
              </p>
            ) : (
              <div className="space-y-3">
                {data.upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{appointment.counselor.user.fullName}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(appointment.appointmentDate).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {appointment.startTime.toString().slice(0, 5)} - {appointment.endTime.toString().slice(0, 5)}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        appointment.status === 'APPROVED' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {appointment.status === 'APPROVED' ? 'Disetujui' : 'Menunggu'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Aksi Cepat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Link href="/siswa/violations">
              <Button variant="outline" className="w-full justify-start">
                <AlertCircle className="h-4 w-4 mr-2" />
                Lihat Riwayat Pelanggaran
              </Button>
            </Link>
            <Link href="/siswa/permissions">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Lihat Riwayat Izin
              </Button>
            </Link>
            <Link href="/siswa/appointments">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Buat Janji Temu
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
