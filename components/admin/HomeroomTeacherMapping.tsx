'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  assignHomeroomTeacher,
  removeHomeroomTeacher,
  getHomeroomTeacherAssignments,
  getHomeroomTeachers,
} from '@/lib/actions/admin/mappings';
import { Loader2, Trash2, UserCheck } from 'lucide-react';
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

const mappingFormSchema = z.object({
  classId: z.string().min(1, 'Kelas harus dipilih'),
  teacherId: z.string().min(1, 'Wali kelas harus dipilih'),
  academicYearId: z.string().min(1, 'Tahun ajaran harus dipilih'),
});

type MappingFormValues = z.infer<typeof mappingFormSchema>;

type HomeroomTeacherMappingProps = {
  academicYears: Array<{ id: string; name: string; isActive: boolean }>;
  classes: Array<{ id: string; name: string; gradeLevel: number }>;
};

export function HomeroomTeacherMapping({
  academicYears,
  classes,
}: HomeroomTeacherMappingProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const activeAcademicYear = academicYears.find((ay) => ay.isActive);

  const form = useForm<MappingFormValues>({
    resolver: zodResolver(mappingFormSchema),
    defaultValues: {
      classId: '',
      teacherId: '',
      academicYearId: activeAcademicYear?.id || '',
    },
  });

  const selectedAcademicYearId = form.watch('academicYearId');

  // Load teachers on mount
  useEffect(() => {
    loadTeachers();
  }, []);

  // Load assignments when academic year changes
  useEffect(() => {
    if (selectedAcademicYearId) {
      loadAssignments(selectedAcademicYearId);
    }
  }, [selectedAcademicYearId]);

  async function loadTeachers() {
    const result = await getHomeroomTeachers();
    if (result.success && result.data) {
      setTeachers(result.data);
    }
  }

  async function loadAssignments(academicYearId: string) {
    setIsLoading(true);
    const result = await getHomeroomTeacherAssignments({
      academicYearId,
    });
    if (result.success && result.data) {
      setAssignments(result.data);
    }
    setIsLoading(false);
  }

  async function onSubmit(values: MappingFormValues) {
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('classId', values.classId);
    formData.append('teacherId', values.teacherId);
    formData.append('academicYearId', values.academicYearId);

    const result = await assignHomeroomTeacher(formData);

    if (result.success) {
      toast({
        title: 'Berhasil',
        description: 'Wali kelas berhasil ditugaskan',
      });

      // Reset form and reload data
      form.reset({
        classId: '',
        teacherId: '',
        academicYearId: values.academicYearId,
      });
      loadAssignments(values.academicYearId);
    } else {
      toast({
        title: 'Gagal',
        description: result.error || 'Terjadi kesalahan',
        variant: 'destructive',
      });
    }

    setIsSubmitting(false);
  }

  async function handleDelete(assignmentId: string) {
    const result = await removeHomeroomTeacher(assignmentId);

    if (result.success) {
      toast({
        title: 'Berhasil',
        description: 'Assignment berhasil dihapus',
      });

      // Reload data
      if (selectedAcademicYearId) {
        loadAssignments(selectedAcademicYearId);
      }
    } else {
      toast({
        title: 'Gagal',
        description: result.error || 'Terjadi kesalahan',
        variant: 'destructive',
      });
    }

    setDeleteId(null);
  }

  // Get classes that are not yet assigned for the selected academic year
  const assignedClassIds = assignments.map((a) => a.classId);
  const availableClasses = classes.filter((c) => !assignedClassIds.includes(c.id));

  return (
    <div className="space-y-6">
      {/* Assignment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Tugaskan Wali Kelas
          </CardTitle>
          <CardDescription>
            Pilih kelas dan wali kelas untuk membuat assignment baru
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="academicYearId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tahun Ajaran</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tahun ajaran" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {academicYears.map((ay) => (
                          <SelectItem key={ay.id} value={ay.id}>
                            {ay.name} {ay.isActive && '(Aktif)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="classId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kelas</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kelas" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableClasses.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            Semua kelas sudah memiliki wali kelas
                          </div>
                        ) : (
                          availableClasses.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name} (Tingkat {cls.gradeLevel})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="teacherId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wali Kelas</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih wali kelas" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teachers.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.user.fullName}
                            {teacher.nip && ` (${teacher.nip})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting || availableClasses.length === 0}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Tugaskan Wali Kelas
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Current Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Assignment Saat Ini</CardTitle>
          <CardDescription>
            Daftar wali kelas yang sudah ditugaskan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada assignment untuk tahun ajaran ini
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Tingkat</TableHead>
                    <TableHead>Wali Kelas</TableHead>
                    <TableHead>NIP</TableHead>
                    <TableHead>Tanggal Assignment</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">
                        <Badge variant="outline">{assignment.class.name}</Badge>
                      </TableCell>
                      <TableCell>Tingkat {assignment.class.gradeLevel}</TableCell>
                      <TableCell>{assignment.teacher.user.fullName}</TableCell>
                      <TableCell>
                        {assignment.teacher.nip || (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(assignment.createdAt).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(assignment.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus assignment ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
