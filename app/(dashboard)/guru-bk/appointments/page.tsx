import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { getMyAppointments } from '@/lib/actions/guru-bk/appointments';
import { AppointmentList } from '@/components/guru-bk/AppointmentList';
import { CalendarDays } from 'lucide-react';

// Cache appointments for 30 seconds
// Appointments change frequently, shorter cache
export const revalidate = 30;

export default async function AppointmentsPage() {
  const session = await auth();

  if (!session || session.user.role !== 'GURU_BK') {
    redirect('/unauthorized');
  }

  // Fetch all appointments
  const appointmentsResult = await getMyAppointments();

  if (!appointmentsResult.success) {
    return (
      <div className="p-6">
        <div className="text-center text-destructive">
          {appointmentsResult.error || 'Gagal memuat data janji temu'}
        </div>
      </div>
    );
  }

  const appointments = appointmentsResult.data || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <CalendarDays className="h-8 w-8 text-primary" />
            Manajemen Janji Temu
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola permintaan janji temu konseling dari siswa
          </p>
        </div>
      </div>

      {/* Appointment List */}
      <AppointmentList appointments={appointments} />
    </div>
  );
}
