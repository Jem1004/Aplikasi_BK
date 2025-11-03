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
  assignStudentToCounselor,
  removeStudentFromCounselor,
  getStudentCounselorAssignments,
  getCounselors,
  getUnassignedStudents,
} from '@/lib/actions/admin/mappings';
import { Loader2, Trash2, UserPlus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
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
  studentIds: z.array(z.string()).min(1, 'Pilih minimal satu siswa'),
  counselorId: z.string().min(1, 'Guru BK harus dipilih'),
  academicYearId: z.string().min(1, 'Tahun ajaran harus dipilih'),
});

type MappingFormValues = z.infer<typeof mappingFormSchema>;

type StudentCounselorMappingProps = {
  academicYears: Array<{ id: string; name: string; isActive: boolean }>;
};

export function StudentCounselorMapping({ academicYears }: StudentCounselorMappingProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [counselors, setCounselors] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const activeAcademicYear = academicYears.find((ay) => ay.isActive);

  const form = useForm<MappingFormValues>({
    resolver: zodResolver(mappingFormSchema),
    defaultValues: {
      studentIds: [],
      counselorId: '',
      academicYearId: activeAcademicYear?.id || '',
    },
  });

  const selectedAcademicYearId = form.watch('academicYearId');

  // Load counselors on mount
  useEffect(() => {
    loadCounselors();
  }, []);

  // Load students and assignments when academic year changes
  useEffect(() => {
    if (selectedAcademicYearId) {
      loadStudents(selectedAcademicYearId);
      loadAssignments(selectedAcademicYearId);
    }
  }, [selectedAcademicYearId]);

  async function loadCounselors() {
    const result = await getCounselors();
    if (result.success && result.data) {
      setCounselors(result.data);
    }
  }

  async function loadStudents(academicYearId: string) {
    setIsLoading(true);
    const result = await getUnassignedStudents(academicYearId);
    if (result.success && result.data) {
      setStudents(result.data);
    }
    setIsLoading(false);
  }

  async function loadAssignments(academicYearId: string) {
    const result = await getStudentCounselorAssignments({
      academicYearId,
    });
    if (result.success && result.data) {
      setAssignments(result.data);
    }
  }

  function toggleStudentSelection(studentId: string) {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  }

  function toggleAllStudents() {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map((s) => s.id));
    }
  }

  async function onSubmit(values: MappingFormValues) {
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('studentIds', JSON.stringify(selectedStudents));
    formData.append('counselorId', values.counselorId);
    formData.append('academicYearId', values.academicYearId);

    const result = await assignStudentToCounselor(formData);

    if (result.success) {
      toast({
        title: 'Berhasil',
        description: 'Siswa berhasil ditugaskan ke Guru BK',
      });
      
      // Reset form and reload data
      setSelectedStudents([]);
      form.reset({
        studentIds: [],
        counselorId: '',
        academicYearId: values.academicYearId,
      });
      loadStudents(values.academicYearId);
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
    const result = await removeStudentFromCounselor(assignmentId);

    if (result.success) {
      toast({
        title: 'Berhasil',
        description: 'Assignment berhasil dihapus',
      });
      
      // Reload data
      if (selectedAcademicYearId) {
        loadStudents(selectedAcademicYearId);
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

  return (
    <div className="space-y-6">
      {/* Assignment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Tugaskan Siswa ke Guru BK
          </CardTitle>
          <CardDescription>
            Pilih siswa dan guru BK untuk membuat assignment baru
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
                name="counselorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guru BK</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Guru BK" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {counselors.map((counselor) => (
                          <SelectItem key={counselor.id} value={counselor.id}>
                            {counselor.user.fullName}
                            {counselor.nip && ` (${counselor.nip})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Student Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Pilih Siswa</label>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : students.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Semua siswa sudah ditugaskan untuk tahun ajaran ini
                  </div>
                ) : (
                  <div className="border rounded-md">
                    <div className="p-3 border-b bg-muted/50">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedStudents.length === students.length}
                          onCheckedChange={toggleAllStudents}
                        />
                        <span className="text-sm font-medium">
                          Pilih Semua ({selectedStudents.length}/{students.length})
                        </span>
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {students.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center space-x-2 p-3 hover:bg-muted/50 border-b last:border-b-0"
                        >
                          <Checkbox
                            checked={selectedStudents.includes(student.id)}
                            onCheckedChange={() => toggleStudentSelection(student.id)}
                          />
                          <div className="flex-1">
                            <div className="font-medium">{student.user.fullName}</div>
                            <div className="text-sm text-muted-foreground">
                              NIS: {student.nis}
                              {student.class && ` • ${student.class.name}`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedStudents.length === 0 && !isLoading && students.length > 0 && (
                  <p className="text-sm text-destructive">Pilih minimal satu siswa</p>
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting || selectedStudents.length === 0}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Tugaskan Siswa
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
            Daftar siswa yang sudah ditugaskan ke Guru BK
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada assignment untuk tahun ajaran ini
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Siswa</TableHead>
                    <TableHead>NIS</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Guru BK</TableHead>
                    <TableHead>Tanggal Assignment</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">
                        {assignment.student.user.fullName}
                      </TableCell>
                      <TableCell>{assignment.student.nis}</TableCell>
                      <TableCell>
                        {assignment.student.class ? (
                          <Badge variant="outline">{assignment.student.class.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{assignment.counselor.user.fullName}</TableCell>
                      <TableCell>
                        {new Date(assignment.assignedAt).toLocaleDateString('id-ID')}
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
