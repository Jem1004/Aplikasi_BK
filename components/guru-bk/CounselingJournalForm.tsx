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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { CalendarIcon, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { createCounselingJournal, updateCounselingJournal } from '@/lib/actions/guru-bk/journals';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

const formSchema = z.object({
  studentId: z.string().min(1, 'Siswa harus dipilih'),
  sessionDate: z.date({
    required_error: 'Tanggal sesi harus diisi',
  }),
  content: z.string().min(10, 'Konten jurnal minimal 10 karakter'),
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

type CounselingJournalFormProps = {
  students: Student[];
  defaultValues?: {
    id: string;
    studentId: string;
    sessionDate: Date;
    content: string;
  };
  mode?: 'create' | 'edit';
};

export function CounselingJournalForm({
  students,
  defaultValues,
  mode = 'create',
}: CounselingJournalFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentId: defaultValues?.studentId || '',
      sessionDate: defaultValues?.sessionDate || new Date(),
      content: defaultValues?.content || '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('studentId', values.studentId);
      formData.append('sessionDate', values.sessionDate.toISOString().split('T')[0]);
      formData.append('content', values.content);

      let result;
      if (mode === 'edit' && defaultValues?.id) {
        result = await updateCounselingJournal(defaultValues.id, formData);
      } else {
        result = await createCounselingJournal(formData);
      }

      if (result.success) {
        toast({
          title: 'Berhasil',
          description: mode === 'edit' 
            ? 'Jurnal konseling berhasil diperbarui' 
            : 'Jurnal konseling berhasil disimpan',
        });
        router.push('/guru-bk/journals');
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
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <Alert className="border-green-200 bg-green-50">
        <ShieldCheck className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-sm text-green-800">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="h-4 w-4" />
            <span className="font-semibold">Jurnal Privat & Terenkripsi</span>
          </div>
          <p>
            Konten jurnal ini akan dienkripsi dengan AES-256-GCM sebelum disimpan. 
            Hanya Anda sebagai pembuat yang dapat mengakses dan membaca jurnal ini. 
            Admin dan pengguna lain tidak memiliki akses ke konten jurnal konseling.
          </p>
        </AlertDescription>
      </Alert>

      {/* Encryption Status Badge */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <Lock className="h-3 w-3 mr-1" />
          Enkripsi Aktif
        </Badge>
        <span className="text-sm text-muted-foreground">
          Data akan dienkripsi secara otomatis
        </span>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Student Selection */}
          <FormField
            control={form.control}
            name="studentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Siswa</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={mode === 'edit'}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih siswa yang di-assign ke Anda" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.user.fullName} - {student.nis}
                        {student.class && ` (${student.class.name})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Hanya siswa yang di-assign ke Anda yang dapat dipilih
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Session Date */}
          <FormField
            control={form.control}
            name="sessionDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Tanggal Sesi Konseling</FormLabel>
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
                        date > new Date() || date < new Date('1900-01-01')
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Tanggal saat sesi konseling dilakukan
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Content - Rich Text Area */}
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Catatan Konseling</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tuliskan catatan detail sesi konseling di sini...&#10;&#10;Contoh:&#10;- Topik yang dibahas&#10;- Kondisi emosional siswa&#10;- Hasil diskusi&#10;- Rencana tindak lanjut&#10;- Rekomendasi"
                    className="resize-none min-h-[300px] font-mono text-sm"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Minimal 10 karakter. Catatan ini akan dienkripsi dan hanya dapat diakses oleh Anda.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Character Count */}
          <div className="text-sm text-muted-foreground text-right">
            {form.watch('content')?.length || 0} karakter
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'edit' ? 'Perbarui' : 'Simpan'} Jurnal
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
