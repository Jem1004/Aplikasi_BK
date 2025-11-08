'use client';

import { useState, useEffect } from 'react';
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
import { CalendarIcon, Loader2 } from 'lucide-react';
import { createViolation } from '@/lib/actions/guru-bk/violations';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  studentId: z.string().min(1, 'Siswa harus dipilih'),
  violationTypeId: z.string().min(1, 'Jenis pelanggaran harus dipilih'),
  incidentDate: z.date({
    required_error: 'Tanggal kejadian harus diisi',
  }),
  description: z.string().optional(),
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

type ViolationType = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  points: number;
  type: string;
  category: string | null;
};

type ViolationFormProps = {
  students: Student[];
  violationTypes: ViolationType[];
  defaultStudentId?: string;
};

export function ViolationForm({
  students,
  violationTypes,
  defaultStudentId,
}: ViolationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedViolationType, setSelectedViolationType] = useState<ViolationType | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentId: defaultStudentId || '',
      violationTypeId: '',
      incidentDate: new Date(),
      description: '',
    },
  });

  // Update selected violation type when form value changes
  useEffect(() => {
    const violationTypeId = form.watch('violationTypeId');
    const violationType = violationTypes.find((vt) => vt.id === violationTypeId);
    setSelectedViolationType(violationType || null);
  }, [form.watch('violationTypeId'), violationTypes]);

  // Group violation types by category
  const groupedViolationTypes = violationTypes.reduce((acc, vt) => {
    const category = vt.category || 'Lainnya';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(vt);
    return acc;
  }, {} as Record<string, ViolationType[]>);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('studentId', values.studentId);
      formData.append('violationTypeId', values.violationTypeId);
      formData.append('incidentDate', values.incidentDate.toISOString().split('T')[0]);
      if (values.description) {
        formData.append('description', values.description);
      }

      const result = await createViolation(formData);

      if (result.success) {
        toast({
          title: 'Berhasil',
          description: 'Data pelanggaran berhasil dicatat',
        });

        // Add a small delay to ensure the toast is shown before redirect
        setTimeout(() => {
          router.push(`/guru-bk/violations/${values.studentId}`);
        }, 500);
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
      <form onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit(onSubmit)(e);
      }} className="space-y-6">
        {/* Student Selection */}
        <FormField
          control={form.control}
          name="studentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Siswa</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih siswa" />
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
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Violation Type Selection */}
        <FormField
          control={form.control}
          name="violationTypeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jenis Pelanggaran/Prestasi</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(groupedViolationTypes).map(([category, types]) => (
                    <div key={category}>
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                        {category}
                      </div>
                      {types.map((vt) => (
                        <SelectItem key={vt.id} value={vt.id}>
                          <div className="flex items-center gap-2">
                            <span>{vt.name}</span>
                            <Badge
                              variant={vt.type === 'PELANGGARAN' ? 'destructive' : 'default'}
                              className="text-xs"
                            >
                              {vt.points > 0 ? '+' : ''}
                              {vt.points}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Display selected violation type details */}
        {selectedViolationType && (
          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">{selectedViolationType.name}</h4>
              <Badge
                variant={selectedViolationType.type === 'PELANGGARAN' ? 'destructive' : 'default'}
              >
                {selectedViolationType.type === 'PELANGGARAN' ? 'Pelanggaran' : 'Prestasi'}
              </Badge>
            </div>
            {selectedViolationType.description && (
              <p className="text-sm text-muted-foreground">
                {selectedViolationType.description}
              </p>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Poin:</span>
              <span
                className={`text-lg font-bold ${
                  selectedViolationType.points > 0 ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {selectedViolationType.points > 0 ? '+' : ''}
                {selectedViolationType.points}
              </span>
            </div>
          </div>
        )}

        {/* Incident Date */}
        <FormField
          control={form.control}
          name="incidentDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Tanggal Kejadian</FormLabel>
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
                Tanggal saat kejadian terjadi
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Keterangan (Opsional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tambahkan keterangan detail tentang kejadian..."
                  className="resize-none"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Jelaskan detail kejadian jika diperlukan
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
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan
          </Button>
        </div>
      </form>
    </Form>
  );
}
