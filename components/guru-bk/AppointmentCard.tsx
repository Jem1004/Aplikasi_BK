'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  User,
  GraduationCap,
  CheckCircle,
  XCircle,
  CalendarClock,
  CheckCheck,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  approveAppointment,
  rejectAppointment,
  rescheduleAppointment,
  completeAppointment,
} from '@/lib/actions/guru-bk/appointments';
import { useToast } from '@/hooks/use-toast';
import type { AppointmentStatus } from '@prisma/client';

type Appointment = {
  id: string;
  studentId: string;
  counselorId: string;
  appointmentDate: Date;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  reason: string;
  rejectionReason: string | null;
  notes: string | null;
  student: {
    id: string;
    nis: string;
    user: {
      fullName: string;
    };
    class: {
      name: string;
    } | null;
  };
};

type AppointmentCardProps = {
  appointment: Appointment;
};

const statusLabels: Record<AppointmentStatus, string> = {
  PENDING: 'Menunggu',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
  RESCHEDULED: 'Dijadwalkan Ulang',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

const statusColors: Record<AppointmentStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  APPROVED: 'bg-green-100 text-green-800 border-green-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
  RESCHEDULED: 'bg-blue-100 text-blue-800 border-blue-200',
  COMPLETED: 'bg-gray-100 text-gray-800 border-gray-200',
  CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
};

export function AppointmentCard({ appointment }: AppointmentCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rescheduleData, setRescheduleData] = useState({
    appointmentDate: format(new Date(appointment.appointmentDate), 'yyyy-MM-dd'),
    startTime: appointment.startTime.toISOString().substring(11, 16),
    endTime: appointment.endTime.toISOString().substring(11, 16),
  });

  async function handleApprove() {
    setIsProcessing(true);

    try {
      const result = await approveAppointment(appointment.id);

      if (result.success) {
        toast({
          title: 'Berhasil',
          description: 'Janji temu berhasil disetujui',
        });
        router.refresh();
      } else {
        toast({
          title: 'Gagal',
          description: result.error || 'Terjadi kesalahan',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Gagal',
        description: 'Terjadi kesalahan. Silakan coba lagi',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleReject() {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Gagal',
        description: 'Alasan penolakan harus diisi',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('rejectionReason', rejectionReason);

      const result = await rejectAppointment(appointment.id, formData);

      if (result.success) {
        toast({
          title: 'Berhasil',
          description: 'Janji temu berhasil ditolak',
        });
        setIsRejectDialogOpen(false);
        setRejectionReason('');
        router.refresh();
      } else {
        toast({
          title: 'Gagal',
          description: result.error || 'Terjadi kesalahan',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Gagal',
        description: 'Terjadi kesalahan. Silakan coba lagi',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleReschedule() {
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('appointmentDate', rescheduleData.appointmentDate);
      formData.append('startTime', rescheduleData.startTime);
      formData.append('endTime', rescheduleData.endTime);

      const result = await rescheduleAppointment(appointment.id, formData);

      if (result.success) {
        toast({
          title: 'Berhasil',
          description: 'Janji temu berhasil dijadwalkan ulang',
        });
        setIsRescheduleDialogOpen(false);
        router.refresh();
      } else {
        toast({
          title: 'Gagal',
          description: result.error || 'Terjadi kesalahan',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Gagal',
        description: 'Terjadi kesalahan. Silakan coba lagi',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleComplete() {
    setIsProcessing(true);

    try {
      const result = await completeAppointment(appointment.id);

      if (result.success) {
        toast({
          title: 'Berhasil',
          description: 'Janji temu berhasil diselesaikan',
        });
        router.refresh();
      } else {
        toast({
          title: 'Gagal',
          description: result.error || 'Terjadi kesalahan',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Gagal',
        description: 'Terjadi kesalahan. Silakan coba lagi',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }

  const isPending = appointment.status === 'PENDING';
  const isApprovedOrRescheduled = appointment.status === 'APPROVED' || appointment.status === 'RESCHEDULED';
  const canTakeAction = isPending || isApprovedOrRescheduled;

  return (
    <Card id={`appointment-${appointment.id}`} className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-lg">{appointment.student.user.fullName}</CardTitle>
              <Badge variant="outline" className={statusColors[appointment.status]}>
                {statusLabels[appointment.status]}
              </Badge>
            </div>
            <CardDescription className="space-y-1">
              <div className="flex items-center gap-2">
                <User className="h-3 w-3" />
                <span>NIS: {appointment.student.nis}</span>
                {appointment.student.class && (
                  <>
                    <span>•</span>
                    <GraduationCap className="h-3 w-3" />
                    <span>{appointment.student.class.name}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                <span>
                  {format(new Date(appointment.appointmentDate), 'EEEE, dd MMMM yyyy', {
                    locale: idLocale,
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>
                  {format(new Date(`2000-01-01T${appointment.startTime.toISOString().substring(11, 16)}`), 'HH:mm')} -{' '}
                  {format(new Date(`2000-01-01T${appointment.endTime.toISOString().substring(11, 16)}`), 'HH:mm')}
                </span>
              </div>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Reason */}
        <div>
          <Label className="text-sm font-medium">Alasan:</Label>
          <p className="text-sm text-muted-foreground mt-1">{appointment.reason}</p>
        </div>

        {/* Rejection Reason */}
        {appointment.status === 'REJECTED' && appointment.rejectionReason && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <Label className="text-sm font-medium text-red-800">Alasan Penolakan:</Label>
            <p className="text-sm text-red-700 mt-1">{appointment.rejectionReason}</p>
          </div>
        )}

        {/* Notes */}
        {appointment.notes && (
          <div>
            <Label className="text-sm font-medium">Catatan:</Label>
            <p className="text-sm text-muted-foreground mt-1">{appointment.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        {canTakeAction && (
          <div className="flex flex-wrap gap-2 pt-2">
            {isPending && (
              <>
                <Button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="gap-2"
                  size="sm"
                >
                  <CheckCircle className="h-4 w-4" />
                  Setujui
                </Button>

                <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="gap-2">
                      <XCircle className="h-4 w-4" />
                      Tolak
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Tolak Janji Temu</DialogTitle>
                      <DialogDescription>
                        Berikan alasan penolakan untuk janji temu dengan{' '}
                        {appointment.student.user.fullName}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="rejectionReason">Alasan Penolakan *</Label>
                        <Textarea
                          id="rejectionReason"
                          placeholder="Contoh: Jadwal bentrok dengan kegiatan lain"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          rows={4}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsRejectDialogOpen(false)}
                        disabled={isProcessing}
                      >
                        Batal
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleReject}
                        disabled={isProcessing}
                      >
                        Tolak Janji Temu
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={isRescheduleDialogOpen} onOpenChange={setIsRescheduleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <CalendarClock className="h-4 w-4" />
                      Jadwalkan Ulang
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Jadwalkan Ulang Janji Temu</DialogTitle>
                      <DialogDescription>
                        Ubah jadwal janji temu dengan {appointment.student.user.fullName}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="appointmentDate">Tanggal *</Label>
                        <Input
                          id="appointmentDate"
                          type="date"
                          value={rescheduleData.appointmentDate}
                          onChange={(e) =>
                            setRescheduleData({ ...rescheduleData, appointmentDate: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="startTime">Waktu Mulai *</Label>
                          <Input
                            id="startTime"
                            type="time"
                            value={rescheduleData.startTime}
                            onChange={(e) =>
                              setRescheduleData({ ...rescheduleData, startTime: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endTime">Waktu Selesai *</Label>
                          <Input
                            id="endTime"
                            type="time"
                            value={rescheduleData.endTime}
                            onChange={(e) =>
                              setRescheduleData({ ...rescheduleData, endTime: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsRescheduleDialogOpen(false)}
                        disabled={isProcessing}
                      >
                        Batal
                      </Button>
                      <Button onClick={handleReschedule} disabled={isProcessing}>
                        Simpan Jadwal Baru
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}

            {isApprovedOrRescheduled && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <CheckCheck className="h-4 w-4" />
                    Tandai Selesai
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Selesaikan Janji Temu?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tandai janji temu dengan {appointment.student.user.fullName} sebagai selesai.
                      Tindakan ini tidak dapat dibatalkan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleComplete} disabled={isProcessing}>
                      Tandai Selesai
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
