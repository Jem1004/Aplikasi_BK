import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';
import { ImportStudentsForm } from '@/components/admin/ImportStudentsForm';

export default async function ImportUsersPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/unauthorized');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Import Siswa
          </h1>
          <p className="text-muted-foreground mt-1">
            Import data siswa dalam jumlah banyak menggunakan file Excel/CSV
          </p>
        </div>
      </div>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Panduan Import</CardTitle>
          <CardDescription>
            Ikuti langkah-langkah berikut untuk import siswa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                1
              </div>
              <div>
                <p className="font-medium text-gray-900">Download Template</p>
                <p className="text-sm text-gray-500">
                  Download template Excel/CSV yang sudah disediakan
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                2
              </div>
              <div>
                <p className="font-medium text-gray-900">Isi Data Siswa</p>
                <p className="text-sm text-gray-500">
                  Isi data siswa sesuai dengan kolom yang tersedia. Pastikan format data benar.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                3
              </div>
              <div>
                <p className="font-medium text-gray-900">Upload File</p>
                <p className="text-sm text-gray-500">
                  Upload file yang sudah diisi ke sistem untuk diproses
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Link href="/api/admin/users/template" download>
              <Button variant="outline" className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2" />
                Download Template Excel
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Import Form */}
      <Card>
        <CardHeader>
          <CardTitle>Upload File Import</CardTitle>
          <CardDescription>
            Upload file Excel (.xlsx) atau CSV (.csv) yang berisi data siswa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImportStudentsForm />
        </CardContent>
      </Card>

      {/* Format Information */}
      <Card>
        <CardHeader>
          <CardTitle>Format Data</CardTitle>
          <CardDescription>
            Kolom yang harus ada dalam file import
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 border rounded-lg">
                <p className="font-medium text-sm text-gray-900">email</p>
                <p className="text-xs text-gray-500">Email siswa (wajib, unique)</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="font-medium text-sm text-gray-900">username</p>
                <p className="text-xs text-gray-500">Username login (wajib, unique)</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="font-medium text-sm text-gray-900">fullName</p>
                <p className="text-xs text-gray-500">Nama lengkap siswa (wajib)</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="font-medium text-sm text-gray-900">nis</p>
                <p className="text-xs text-gray-500">Nomor Induk Siswa (wajib, unique)</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="font-medium text-sm text-gray-900">nisn</p>
                <p className="text-xs text-gray-500">NISN (opsional)</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="font-medium text-sm text-gray-900">className</p>
                <p className="text-xs text-gray-500">Nama kelas (opsional)</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="font-medium text-sm text-gray-900">dateOfBirth</p>
                <p className="text-xs text-gray-500">Tanggal lahir (YYYY-MM-DD, opsional)</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="font-medium text-sm text-gray-900">address</p>
                <p className="text-xs text-gray-500">Alamat lengkap (opsional)</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="font-medium text-sm text-gray-900">parentName</p>
                <p className="text-xs text-gray-500">Nama orang tua (opsional)</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="font-medium text-sm text-gray-900">parentPhone</p>
                <p className="text-xs text-gray-500">Telepon orang tua (opsional)</p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-2">Catatan Penting:</p>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Password default untuk semua siswa adalah: <code className="bg-blue-100 px-1 rounded">siswa123</code></li>
                <li>Siswa akan diminta mengganti password saat login pertama kali</li>
                <li>Email, username, dan NIS harus unique (tidak boleh duplikat)</li>
                <li>Format tanggal lahir: YYYY-MM-DD (contoh: 2008-05-15)</li>
                <li>Nama kelas harus sesuai dengan kelas yang sudah ada di sistem</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
