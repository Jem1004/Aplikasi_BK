'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CounselorAvailability } from './CounselorAvailability';
import { createAppointment } from '@/lib/actions/siswa/appointments';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { CalendarIcon, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  appointmentDate: z.string().min(1, 'Tanggal harus dipilih'),
  startTime: z.string().min(1, 'Waktu harus dipilih'),
  endTime: z.string().min(1, 'Waktu harus dipilih'),
  reason: z.string().min(10, 'Alasan harus diisi minimal 10 karakter'),
});

type FormValues = z.infer<typeof formSchema>;

interface AppointmentBookingFormProps {
  counselorName?: string;
}

export function AppointmentBookingForm({ counselorName }: AppointmentBookingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedStartTime, setSelectedStartTime] = useState<string | undefined>();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      appointmentDate: '',
      startTime: '',
      endTime: '',
      reason: '',
    },
  });

  const handleSlotSelect = (date: Date, startTime: string, endTime: string) => {
    const dateString = format(date, 'yyyy-MM-dd');
    setSelectedDate(date);
    setSelectedStartTime(startTime);
    
    form.setValue('appointmentDate', dateString);
    form.setValue('startTime', startTime);
    form.setValue('endTime', endTime);
    
    // Clear any previous errors
    form.clearErrors('appointmentDate');
    form.clearErrors('startTime');
    form.clearErrors('endTime');
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('appointmentDate', values.appointmentDate);
      formData.append('startTime', values.startTime);
      formData.append('endTime', values.endTime);
      formData.append('reason', values.reason);

      const result = await createAppointment(formData);

      if (result.success) {
        toast({
          title: 'Berhasil',
          description: 'Janji temu berhasil dibuat. Menunggu persetujuan guru BK.',
        });
        router.push('/siswa/appointments');
        router.refresh();
      } else {
        if (result.errors) {
          // Set field-level errors
          Object.entries(result.errors).forEach(([field, messages]) => {
            form.setError(field as keyof FormValues, {
              message: messages?.[0],
            });
          });
        } else {
          setError(result.error || 'Terjadi kesalahan. Silakan coba lagi');
        }
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDateFormatted = selectedDate
    ? format(selectedDate, 'dd MMMM yyyy', { locale: localeId })
    : null;

  return (
    <div className="space-y-6">
      {/* Counselor Info */}
      {counselorName && (
        <Card>
          <CardHeader>
            <CardTitle>Guru BK Anda</CardTitle>
            <CardDescription>
              Anda akan membuat janji temu dengan guru BK berikut
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-semibold text-primary">
                  {counselorName.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-medium">{counselorName}</p>
                <p className="text-sm text-muted-foreground">Guru Bimbingan Konseling</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Availability Calendar */}
      <CounselorAvailability
        onSlotSelect={handleSlotSelect}
        selectedDate={selectedDate}
        selectedStartTime={selectedStartTime}
      />

      {/* Booking Form */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Janji Temu</CardTitle>
          <CardDescription>
            Lengkapi informasi janji temu Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Selected Date & Time Display */}
              {selectedDate && selectedStartTime && (
                <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Tanggal:</span>
                    <span>{selectedDateFormatted}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Waktu:</span>
                    <span>
                      {form.watch('startTime')} - {form.watch('endTime')}
                    </span>
                  </div>
                </div>
              )}

              {/* Reason Field */}
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alasan Konsultasi *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Jelaskan alasan Anda ingin berkonsultasi dengan guru BK..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Minimal 10 karakter. Informasi ini akan membantu guru BK mempersiapkan sesi konsultasi.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !selectedDate || !selectedStartTime}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Buat Janji Temu
                    </>
                  )}
                </Button>
              </div>

              {/* Info */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Janji temu Anda akan menunggu persetujuan dari guru BK. Anda akan menerima notifikasi
                  setelah guru BK menyetujui atau menolak permintaan Anda.
                </AlertDescription>
              </Alert>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
