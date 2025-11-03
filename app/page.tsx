import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import {
  BookOpen,
  Users,
  ShieldCheck,
  Award,
  CheckCircle,
  TrendingUp,
  Clock,
  Target,
  Heart,
  GraduationCap,
  UserCheck,
  BarChart3,
  Star,
  ArrowRight
} from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">BK Sekolah</h1>
                <p className="text-xs text-gray-500">Sistem Bimbingan Konseling Digital</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="outline">Masuk</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Sistem BK Digital
            <span className="text-green-600"> Modern</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Platform bimbingan konseling komprehensif untuk mengelola layanan siswa,
            pelanggaran, prestasi, janji temu, dan jurnal dalam satu sistem.
          </p>
          <Link href="/login">
            <Button size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3">
              Masuk ke Sistem
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Fitur Utama
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Solusi lengkap untuk mengelola layanan bimbingan konseling
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Management Siswa */}
            <Card className="hover:shadow-md transition-shadow border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <CardTitle className="text-lg">Manajemen Siswa</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600">
                  Database siswa terpusat dengan tracking perkembangan
                </p>
              </CardContent>
            </Card>

            {/* Pelanggaran & Prestasi */}
            <Card className="hover:shadow-md transition-shadow border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center mb-3">
                  <Award className="h-5 w-5 text-amber-600" />
                </div>
                <CardTitle className="text-lg">Pelanggaran & Prestasi</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600">
                  Sistem pencatatan perilaku dan evaluasi otomatis
                </p>
              </CardContent>
            </Card>

            {/* Janji Temu */}
            <Card className="hover:shadow-md transition-shadow border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Janji Temu</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600">
                  Booking online konseling dengan notifikasi otomatis
                </p>
              </CardContent>
            </Card>

            {/* Jurnal Konseling */}
            <Card className="hover:shadow-md transition-shadow border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                </div>
                <CardTitle className="text-lg">Jurnal Konseling</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600">
                  Dokumentasi profesional setiap sesi konseling
                </p>
              </CardContent>
            </Card>

            {/* Manajemen Izin */}
            <Card className="hover:shadow-md transition-shadow border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center mb-3">
                  <ShieldCheck className="h-5 w-5 text-indigo-600" />
                </div>
                <CardTitle className="text-lg">Manajemen Izin</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600">
                  Form digital dan approval workflow untuk izin siswa
                </p>
              </CardContent>
            </Card>

            {/* Analytics */}
            <Card className="hover:shadow-md transition-shadow border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="h-10 w-10 rounded-lg bg-cyan-100 flex items-center justify-center mb-3">
                  <BarChart3 className="h-5 w-5 text-cyan-600" />
                </div>
                <CardTitle className="text-lg">Analytics Dashboard</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600">
                  Insight data dan statistik untuk pengambilan keputusan
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Role-Based Access Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Akses Berdasarkan Peran
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Setiap pengguna mendapatkan pengalaman yang disesuaikan dengan peran mereka
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Administrator */}
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Administrator</h3>
              <p className="text-sm text-gray-600">
                Manajemen sistem dan konfigurasi platform
              </p>
            </div>

            {/* Guru BK */}
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Guru BK</h3>
              <p className="text-sm text-gray-600">
                Layanan konseling dan monitoring siswa
              </p>
            </div>

            {/* Wali Kelas */}
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-teal-500 flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Wali Kelas</h3>
              <p className="text-sm text-gray-600">
                Monitoring kelas dan kolaborasi BK
              </p>
            </div>

            {/* Siswa */}
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-lime-500 flex items-center justify-center mx-auto mb-4">
                <UserCheck className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Siswa</h3>
              <p className="text-sm text-gray-600">
                Akses layanan BK dan perkembangan pribadi
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold">BK Sekolah</span>
          </div>
          <p className="text-gray-600 text-sm">
            Sistem manajemen bimbingan konseling modern untuk sekolah Indonesia
          </p>
          <p className="text-gray-500 text-xs mt-2">
            &copy; 2024 BK Sekolah. Semua hak dilindungi.
          </p>
        </div>
      </footer>
    </div>
  )
}
