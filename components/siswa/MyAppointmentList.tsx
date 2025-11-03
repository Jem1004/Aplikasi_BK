'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cancelAppointment } from '@/lib/actions/siswa/appointments';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  User,
  MessageSquare,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CalendarX,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { AppointmentStatus } from '@prisma/client';

interface Appointment {
  id: string;
  appointmentDate: Date;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  reason: string;
  rejectionReason?: string | null;
  counselor: {
    user: {
      fullName: string;
    };
  };
}

interface MyAppointmentListProps {
  appointments: Appointment[];
}

const statusConfig = {
  PENDING: {
    label: 'Menunggu',
    variant: 'secondary' as const,
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800',
  },
  APPROVED: {
    label: 'Disetujui',
    variant: 'default' as const,
    icon: CheckCircle2,
    color: 'bg-green-100 text-green-800',
  },
  REJECTED: {
    label: 'Ditolak',
    variant: 'destructive' as const,
    icon: XCircle,
    color: 'bg-red-100 text-red-800',
  },
  RESCHEDULED: {
    label: 'Dijadwalkan Ulang',
    variant: 'secondary' as const,
    icon: Calendar,
    color: 'bg-blue-100 text-blue-800',
  },
  COMPLETED: {
    label: 'Selesai',
    variant: 'outline' as const,
    icon: CheckCircle2,
    color: 'bg-gray-100 text-gray-800',
  },
  CANCELLED: {
    label: 'Dibatalkan',
    variant: 'outline' as const,
    icon: CalendarX,
    color: 'bg-gray-100 text-gray-800',
  },
};

export function MyAppointmentList({ appointments: initialAppointments }: MyAppointmentListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState(initialAppointments);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const filteredAppointments = appointments.filter((appointment) => {
    if (statusFilter === 'all') return true;
    return appointment.status === statusFilter;
  });

  const handleCancelClick = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedAppointmentId) return;

    setIsCancelling(true);

    try {
      const result = await cancelAppointment(selectedAppointmentId);

      if (result.success) {
        toast({
          title: 'Berhasil',
          description: 'Janji temu berhasil dibatalkan',
        });

        // Update local state
        setAppointments((prev) =>
          prev.map((apt) =>
            apt.id === selectedAppointmentId
              ? { ...apt, status: 'CANCELLED' as AppointmentStatus }
              : apt
          )
        );

        router.refresh();
      } else {
        toast({
          title: 'Gagal',
          description: result.error || 'Gagal membatalkan janji temu',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan. Silakan coba lagi',
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(false);
      setCancelDialogOpen(false);
      setSelectedAppointmentId(null);
    }
  };

  const formatTime = (date: Date) => {
    return format(new Date(date), 'HH:mm');
  };

  const formatDate = (date: Date) => {
    return format(new Date(date), 'dd MMMM yyyy', { locale: localeId });
  };

  if (appointments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Belum Ada Janji Temu</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Anda belum memiliki janji temu dengan guru BK
          </p>
          <Button onClick={() => router.push('/siswa/appointments/new')}>
            Buat Janji Temu
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Daftar Janji Temu</CardTitle>
              <CardDescription>
                Kelola janji temu konsultasi Anda dengan guru BK
              </CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="PENDING">Menunggu</SelectItem>
                <SelectItem value="APPROVED">Disetujui</SelectItem>
                <SelectItem value="REJECTED">Ditolak</SelectItem>
                <SelectItem value="RESCHEDULED">Dijadwalkan Ulang</SelectItem>
                <SelectItem value="COMPLETED">Selesai</SelectItem>
                <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-sm text-muted-foreground">
              Tidak ada janji temu dengan status yang dipilih
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredAppointments.map((appointment) => {
            const config = statusConfig[appointment.status];
            const StatusIcon = config.icon;
            const canCancel = appointment.status === 'PENDING';

            return (
              <Card key={appointment.id}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">
                            {appointment.counselor.user.fullName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Guru Bimbingan Konseling
                          </p>
                        </div>
                      </div>
                      <Badge className={config.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4 py-3 border-y">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Tanggal</p>
                          <p className="font-medium">
                            {formatDate(appointment.appointmentDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Waktu</p>
                          <p className="font-medium">
                            {formatTime(appointment.startTime)} -{' '}
                            {formatTime(appointment.endTime)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        Alasan Konsultasi
                      </div>
                      <p className="text-sm text-muted-foreground pl-6">
                        {appointment.reason}
                      </p>
                    </div>

                    {/* Rejection Reason */}
                    {appointment.status === 'REJECTED' && appointment.rejectionReason && (
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Alasan Penolakan:</strong> {appointment.rejectionReason}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Actions */}
                    {canCancel && (
                      <div className="flex justify-end pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelClick(appointment.id)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Batalkan Janji Temu
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Janji Temu?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin membatalkan janji temu ini? Tindakan ini tidak dapat
              dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Tidak</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Membatalkan...
                </>
              ) : (
                'Ya, Batalkan'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
