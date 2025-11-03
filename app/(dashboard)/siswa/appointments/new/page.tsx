import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { AppointmentBookingForm } from '@/components/siswa/AppointmentBookingForm';
import { getMyCounselor } from '@/lib/actions/siswa/appointments';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Buat Janji Temu | Aplikasi BK',
  description: 'Buat janji temu konsultasi dengan guru BK',
};

async function BookingFormContent() {
  const result = await getMyCounselor();

  if (!result.success) {
    return (
      <Card>
        <CardContent className="py-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Tidak Dapat Membuat Janji Temu</AlertTitle>
            <AlertDescription className="mt-2">
              {result.error || 'Anda belum memiliki guru BK yang ditugaskan'}
            </AlertDescription>
          </Alert>
          <div className="flex justify-center mt-6">
            <Button asChild variant="outline">
              <Link href="/siswa/appointments">Kembali</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const counselor = result.data;

  return (
    <AppointmentBookingForm counselorName={counselor?.user.fullName} />
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Counselor Info Skeleton */}
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-muted" />
              <div className="space-y-2">
                <div className="h-4 w-40 bg-muted rounded" />
                <div className="h-3 w-32 bg-muted rounded" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-64 bg-muted rounded" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 bg-muted rounded" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form Skeleton */}
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
            <div className="flex gap-4">
              <div className="h-10 flex-1 bg-muted rounded" />
              <div className="h-10 flex-1 bg-muted rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewAppointmentPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Buat Janji Temu</h1>
        <p className="text-muted-foreground">
          Pilih tanggal dan waktu untuk konsultasi dengan guru BK
        </p>
      </div>

      {/* Booking Form */}
      <Suspense fallback={<LoadingSkeleton />}>
        <BookingFormContent />
      </Suspense>
    </div>
  );
}
