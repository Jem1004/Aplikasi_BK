'use client';

import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { CalendarIcon, Loader2, Printer } from 'lucide-react';
import { createPermission } from '@/lib/actions/guru-bk/permissions';
import { useToast } from '@/hooks/use-toast';
import type { PermissionPrintData } from '@/lib/actions/guru-bk/permissions';

const formSchema = z.object({
  studentId: z.string().min(1, 'Siswa harus dipilih'),
  permissionType: z.enum(['MASUK', 'KELUAR'], {
    required_error: 'Jenis izin harus dipilih',
  }),
  reason: z.string().min(1, 'Alasan harus diisi'),
  permissionDate: z.date({
    required_error: 'Tanggal izin harus diisi',
  }),
  startTime: z.string().min(1, 'Waktu mulai harus diisi'),
  endTime: z.string().optional(),
  destination: z.string().optional(),
  notes: z.string().optional(),
});

type Student = {
  id: string;
  nis: string;
  user: {
    fullName: string;
  };
  class: {
    name: string;
  } | null;
};

type PermissionFormProps = {
  students: Student[];
  onPrintReady?: (printData: PermissionPrintData) => void;
};

export function PermissionForm({ students, onPrintReady }: PermissionFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentId: '',
      permissionType: undefined,
      reason: '',
      permissionDate: new Date(),
      startTime: '',
      endTime: '',
      destination: '',
      notes: '',
    },
  });

  // Filter students based on search query
  const filteredStudents = students.filter((student) => {
    const query = searchQuery.toLowerCase();
    return (
      student.user.fullName.toLowerCase().includes(query) ||
      student.nis.toLowerCase().includes(query) ||
      student.class?.name.toLowerCase().includes(query)
    );
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('studentId', values.studentId);
      formData.append('permissionType', values.permissionType);
      formData.append('reason', values.reason);
      formData.append('permissionDate', values.permissionDate.toISOString().split('T')[0]);
      formData.append('startTime', values.startTime);
      if (values.endTime) {
        formData.append('endTime', values.endTime);
      }
      if (values.destination) {
        formData.append('destination', values.destination);
      }
      if (values.notes) {
        formData.append('notes', values.notes);
      }

      const result = await createPermission(formData);

      if (result.success && result.data) {
        toast({
          title: 'Berhasil',
          description: 'Izin berhasil dibuat',
        });

        // Trigger print dialog
        if (onPrintReady) {
          onPrintReady(result.data.printData);
        }

        // Reset form
        form.reset();
        setSearchQuery('');
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
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Student Selection with Search */}
        <FormField
          control={form.control}
          name="studentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Siswa</FormLabel>
              <div className="space-y-2">
                <Input
                  placeholder="Cari siswa (nama, NIS, atau kelas)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-2"
                />
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih siswa" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredStudents.length === 0 ? (
                      <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                        Tidak ada siswa ditemukan
                      </div>
                    ) : (
                      filteredStudents.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.user.fullName} - {student.nis}
                          {student.class && ` (${student.class.name})`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <FormDescription>
                Cari dan pilih siswa yang memerlukan izin
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Permission Type Selection */}
        <FormField
          control={form.control}
          name="permissionType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jenis Izin</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis izin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="MASUK">Izin Masuk</SelectItem>
                  <SelectItem value="KELUAR">Izin Keluar</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Pilih jenis izin yang sesuai
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Permission Date */}
        <FormField
          control={form.control}
          name="permissionDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Tanggal Izin</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? (
                        format(field.value, 'PPP', { locale: idLocale })
                      ) : (
                        <span>Pilih tanggal</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                Tanggal berlakunya izin
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Time Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Waktu Mulai</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormDescription>
                  Waktu mulai izin
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Waktu Selesai (Opsional)</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormDescription>
                  Waktu selesai izin
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Reason */}
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alasan</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Masukkan alasan izin..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Jelaskan alasan pemberian izin
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Destination (for KELUAR type) */}
        <FormField
          control={form.control}
          name="destination"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tujuan (Opsional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Contoh: Rumah Sakit, Rumah, dll."
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Tujuan siswa (khususnya untuk izin keluar)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Catatan (Opsional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tambahkan catatan tambahan jika diperlukan..."
                  className="resize-none"
                  rows={2}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Catatan tambahan untuk izin ini
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={isSubmitting}
          >
            Reset
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {!isSubmitting && <Printer className="mr-2 h-4 w-4" />}
            Simpan & Cetak
          </Button>
        </div>
      </form>
    </Form>
  );
}
