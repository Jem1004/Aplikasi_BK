import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MyAppointmentList } from '@/components/siswa/MyAppointmentList';
import { getMyAppointments } from '@/lib/actions/siswa/appointments';
import { Plus, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = {
  title: 'Janji Temu Saya | Aplikasi BK',
  description: 'Kelola janji temu konsultasi dengan guru BK',
};

async function AppointmentListContent() {
  const result = await getMyAppointments();

  if (!result.success) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
          <p className="text-sm text-destructive">{result.error}</p>
        </CardContent>
      </Card>
    );
  }

  return <MyAppointmentList appointments={result.data || []} />;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <div className="space-y-4 animate-pulse">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-muted" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="h-3 w-24 bg-muted rounded" />
                  </div>
                </div>
                <div className="h-6 w-20 bg-muted rounded" />
              </div>
              <div className="grid grid-cols-2 gap-4 py-3 border-y">
                <div className="h-12 bg-muted rounded" />
                <div className="h-12 bg-muted rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-16 bg-muted rounded" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AppointmentsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Janji Temu</h1>
          <p className="text-muted-foreground">
            Kelola janji temu konsultasi Anda dengan guru BK
          </p>
        </div>
        <Button asChild>
          <Link href="/siswa/appointments/new">
            <Plus className="mr-2 h-4 w-4" />
            Buat Janji Temu
          </Link>
        </Button>
      </div>

      {/* Appointments List */}
      <Suspense fallback={<LoadingSkeleton />}>
        <AppointmentListContent />
      </Suspense>
    </div>
  );
}
