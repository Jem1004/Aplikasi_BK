'use client';

import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  Calendar,
  User,
  Lock,
  ShieldCheck,
  Pencil,
  ArrowLeft,
  IdCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Journal = {
  id: string;
  studentId: string;
  studentName: string;
  studentNis: string;
  sessionDate: Date;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

type CounselingJournalViewerProps = {
  journal: Journal;
};

export function CounselingJournalViewer({ journal }: CounselingJournalViewerProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push('/guru-bk/journals')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Kembali ke Daftar Jurnal
      </Button>

      {/* Security Notice */}
      <Alert className="border-green-200 bg-green-50">
        <ShieldCheck className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-sm text-green-800">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="h-4 w-4" />
            <span className="font-semibold">Konten Terenkripsi</span>
          </div>
          <p>
            Jurnal ini telah didekripsi untuk Anda sebagai pembuat. Konten ini tidak dapat 
            diakses oleh admin atau pengguna lain.
          </p>
        </AlertDescription>
      </Alert>

      {/* Journal Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl">Jurnal Konseling</CardTitle>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Lock className="h-3 w-3 mr-1" />
                  Terenkripsi
                </Badge>
              </div>
              <CardDescription>
                Catatan sesi konseling privat
              </CardDescription>
            </div>
            <Button
              onClick={() => router.push(`/guru-bk/journals/${journal.id}/edit`)}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              Edit Jurnal
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Student Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Informasi Siswa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Nama Siswa</p>
              <p className="font-semibold">{journal.studentName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                <IdCard className="h-3 w-3" />
                NIS
              </p>
              <p className="font-semibold">{journal.studentNis}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Informasi Sesi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tanggal Sesi</p>
              <p className="font-semibold">
                {format(new Date(journal.sessionDate), 'PPP', { locale: idLocale })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Dibuat</p>
              <p className="font-semibold">
                {format(new Date(journal.createdAt), 'PPP', { locale: idLocale })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Terakhir Diperbarui</p>
              <p className="font-semibold">
                {format(new Date(journal.updatedAt), 'PPP', { locale: idLocale })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Journal Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Catatan Konseling</CardTitle>
          <CardDescription>
            Konten jurnal yang telah didekripsi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800">
                {journal.content}
              </pre>
            </div>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            {journal.content.length} karakter
          </div>
        </CardContent>
      </Card>

      {/* Security Footer */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-green-800">
                Keamanan & Privasi Terjamin
              </p>
              <p className="text-sm text-green-700">
                Jurnal ini disimpan dengan enkripsi AES-256-GCM. Hanya Anda sebagai pembuat 
                yang memiliki akses untuk membaca, mengedit, atau menghapus jurnal ini. 
                Sistem mencatat setiap akses ke jurnal untuk audit keamanan.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => router.push('/guru-bk/journals')}
        >
          Kembali ke Daftar
        </Button>
        <Button
          onClick={() => router.push(`/guru-bk/journals/${journal.id}/edit`)}
        >
          <Pencil className="h-4 w-4 mr-2" />
          Edit Jurnal
        </Button>
      </div>
    </div>
  );
}
