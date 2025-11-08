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
import { CalendarIcon, Loader2, ArrowLeft } from 'lucide-react';
import { updateViolation } from '@/lib/actions/guru-bk/violations';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  violationTypeId: z.string().min(1, 'Jenis pelanggaran harus dipilih'),
  incidentDate: z.date({
    required_error: 'Tanggal kejadian harus diisi',
  }),
  description: z.string().optional(),
});

type ViolationType = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  points: number;
  type: string;
  category: string | null;
};

type Violation = {
  id: string;
  studentId: string;
  violationTypeId: string;
  incidentDate: Date;
  description: string | null;
  points: number;
  student: {
    user: {
      fullName: string;
    };
    class: {
      name: string;
    } | null;
  };
  violationType: ViolationType;
};

type EditViolationFormProps = {
  violation: Violation;
  violationTypes: ViolationType[];
};

export function EditViolationForm({
  violation,
  violationTypes,
}: EditViolationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedViolationType, setSelectedViolationType] = useState<ViolationType | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      violationTypeId: violation.violationTypeId,
      incidentDate: new Date(violation.incidentDate),
      description: violation.description || '',
    },
  });

  // Update selected violation type when form value changes
  useEffect(() => {
    const violationTypeId = form.watch('violationTypeId');
    const violationType = violationTypes.find((vt) => vt.id === violationTypeId);
    setSelectedViolationType(violationType || null);
  }, [form.watch('violationTypeId'), violationTypes]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('violationTypeId', values.violationTypeId);
      formData.append('incidentDate', values.incidentDate.toISOString());
      formData.append('description', values.description || '');

      const result = await updateViolation(violation.id, formData);

      if (result.success) {
        toast({
          title: 'Berhasil',
          description: 'Data pelanggaran/prestasi berhasil diperbarui',
        });

        // Add delay and redirect to student page
        setTimeout(() => {
          router.push(`/guru-bk/violations/${violation.studentId}`);
        }, 500);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Terjadi kesalahan',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating violation:', error);
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const goBack = () => {
    router.back();
  };

  // Group violation types by type and category
  const groupedViolationTypes = violationTypes.reduce((acc, vt) => {
    const type = vt.type || 'OTHER';
    const category = vt.category || 'Tanpa Kategori';

    if (!acc[type]) {
      acc[type] = {};
    }

    if (!acc[type][category]) {
      acc[type][category] = [];
    }

    acc[type][category].push(vt);
    return acc;
  }, {} as Record<string, Record<string, ViolationType[]>>);

  const getViolationTypeColor = (type: string) => {
    switch (type) {
      case 'VIOLATION':
        return 'destructive';
      case 'ACHIEVEMENT':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Student Info Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-900">Siswa</h3>
            <p className="text-blue-700">{violation.student.user.fullName}</p>
            {violation.student.class && (
              <p className="text-blue-600 text-sm">{violation.student.class.name}</p>
            )}
          </div>
          <div className="text-right">
            <Badge variant={getViolationTypeColor(violation.violationType.type)}>
              {violation.violationType.type === 'VIOLATION' ? 'Pelanggaran' : 'Prestasi'}
            </Badge>
            <p className="text-sm text-gray-600 mt-1">
              {violation.violationType.points > 0 ? '+' : ''}{violation.violationType.points} poin
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="violationTypeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jenis Pelanggaran/Prestasi</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis pelanggaran/prestasi" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(groupedViolationTypes).map(([type, categories]) => (
                      <div key={type}>
                        <div className="px-2 py-1.5 text-sm font-semibold text-gray-700">
                          {type === 'VIOLATION' ? 'Pelanggaran' : type === 'ACHIEVEMENT' ? 'Prestasi' : 'Lainnya'}
                        </div>
                        {Object.entries(categories).map(([category, items]) => (
                          <div key={`${type}-${category}`}>
                            <div className="px-4 py-1 text-xs text-gray-500 italic">
                              {category}
                            </div>
                            {items.map((vt) => (
                              <SelectItem key={vt.id} value={vt.id}>
                                <div className="flex items-center gap-2">
                                  <span>{vt.code} - {vt.name}</span>
                                  <span className="text-xs text-gray-500">
                                    ({vt.points > 0 ? '+' : ''}{vt.points})
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Pilih jenis pelanggaran atau prestasi yang sesuai
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedViolationType && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Detail Jenis:</h4>
              <p className="text-sm text-gray-700">{selectedViolationType.name}</p>
              {selectedViolationType.description && (
                <p className="text-sm text-gray-600 mt-1">{selectedViolationType.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={getViolationTypeColor(selectedViolationType.type)}>
                  {selectedViolationType.type === 'VIOLATION' ? 'Pelanggaran' : 'Prestasi'}
                </Badge>
                {selectedViolationType.category && (
                  <Badge variant="outline">{selectedViolationType.category}</Badge>
                )}
                <span className="text-sm font-medium text-gray-700">
                  {selectedViolationType.points > 0 ? '+' : ''}{selectedViolationType.points} poin
                </span>
              </div>
            </div>
          )}

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
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: idLocale })
                        ) : (
                          <span>Pilih tanggal kejadian</span>
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
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Pilih tanggal ketika pelanggaran/prestasi terjadi
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Keterangan</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Masukkan keterangan tambahan (opsional)"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Tambahkan keterangan detail mengenai kejadian (opsional)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}