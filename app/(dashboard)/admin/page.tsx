import { StatCard } from "@/components/shared/StatCard";
import { Users, GraduationCap, UserCheck, BookOpen, UserPlus, FolderPlus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

// Implement stale-while-revalidate for dashboard statistics
// Cache for 1 minute (60 seconds) - dashboard stats should be relatively fresh
export const revalidate = 60;

async function getAdminStats() {
  const [totalUsers, totalStudents, totalGuruBK, totalClasses] = await Promise.all([
    prisma.user.count({
      where: { deletedAt: null, isActive: true },
    }),
    prisma.user.count({
      where: { role: 'SISWA', deletedAt: null, isActive: true },
    }),
    prisma.user.count({
      where: { role: 'GURU_BK', deletedAt: null, isActive: true },
    }),
    prisma.class.count({
      where: { deletedAt: null },
    }),
  ]);

  return {
    totalUsers,
    totalStudents,
    totalGuruBK,
    totalClasses,
  };
}

export default async function AdminDashboard() {
  const stats = await getAdminStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
        <p className="text-muted-foreground mt-2">
          Selamat datang di Aplikasi Bimbingan Konseling
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Pengguna"
          value={stats.totalUsers.toString()}
          description="Semua pengguna aktif"
          icon={Users}
        />
        <StatCard
          title="Total Siswa"
          value={stats.totalStudents.toString()}
          description="Siswa terdaftar"
          icon={GraduationCap}
        />
        <StatCard
          title="Guru BK"
          value={stats.totalGuruBK.toString()}
          description="Guru BK aktif"
          icon={UserCheck}
        />
        <StatCard
          title="Kelas"
          value={stats.totalClasses.toString()}
          description="Kelas tahun ini"
          icon={BookOpen}
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Aksi Cepat</CardTitle>
          <CardDescription>
            Akses cepat ke fitur manajemen utama
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/admin/users/new">
              <Button className="w-full h-auto flex flex-col items-center gap-2 py-6" variant="outline">
                <UserPlus className="h-8 w-8 text-primary" />
                <div className="text-center">
                  <div className="font-semibold">Tambah Pengguna</div>
                  <div className="text-xs text-muted-foreground">Buat akun baru</div>
                </div>
              </Button>
            </Link>
            
            <Link href="/admin/users">
              <Button className="w-full h-auto flex flex-col items-center gap-2 py-6" variant="outline">
                <Users className="h-8 w-8 text-primary" />
                <div className="text-center">
                  <div className="font-semibold">Kelola Pengguna</div>
                  <div className="text-xs text-muted-foreground">Lihat & edit pengguna</div>
                </div>
              </Button>
            </Link>
            
            <Link href="/admin/master-data">
              <Button className="w-full h-auto flex flex-col items-center gap-2 py-6" variant="outline">
                <FolderPlus className="h-8 w-8 text-primary" />
                <div className="text-center">
                  <div className="font-semibold">Data Master</div>
                  <div className="text-xs text-muted-foreground">Kelola kelas & pelanggaran</div>
                </div>
              </Button>
            </Link>
            
            <Link href="/admin/mappings">
              <Button className="w-full h-auto flex flex-col items-center gap-2 py-6" variant="outline">
                <Settings className="h-8 w-8 text-primary" />
                <div className="text-center">
                  <div className="font-semibold">Mapping</div>
                  <div className="text-xs text-muted-foreground">Atur relasi siswa & guru</div>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
