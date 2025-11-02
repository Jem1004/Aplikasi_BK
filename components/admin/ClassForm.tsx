'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createClass, updateClass } from '@/lib/actions/admin/master-data';

interface ClassFormProps {
  classData?: {
    id: string;
    name: string;
    gradeLevel: number;
    academicYearId: string;
  };
  academicYears: Array<{
    id: string;
    name: string;
    isActive: boolean;
  }>;
  onSuccess?: () => void;
}

export function ClassForm({ classData, academicYears, onSuccess }: ClassFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [gradeLevel, setGradeLevel] = useState(classData?.gradeLevel?.toString() || '');
  const [academicYearId, setAcademicYearId] = useState(classData?.academicYearId || '');

  const isEdit = !!classData;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);

    try {
      const result = isEdit
        ? await updateClass(classData.id, formData)
        : await createClass(formData);

      if (result.success) {
        toast({
          title: 'Berhasil',
          description: `Kelas berhasil ${isEdit ? 'diupdate' : 'dibuat'}`,
        });
        
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/admin/master-data/classes');
          router.refresh();
        }
      } else {
        if (result.errors) {
          setErrors(result.errors);
        } else {
          toast({
            title: 'Error',
            description: result.error || 'Terjadi kesalahan',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan yang tidak terduga',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? 'Edit Kelas' : 'Tambah Kelas'}</CardTitle>
        <CardDescription>
          {isEdit ? 'Update informasi kelas' : 'Buat kelas baru'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Kelas</Label>
            <Input
              id="name"
              name="name"
              placeholder="10 IPA 1"
              defaultValue={classData?.name}
              required
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="gradeLevel">Tingkat Kelas</Label>
            <Select
              name="gradeLevel"
              value={gradeLevel}
              onValueChange={setGradeLevel}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih tingkat kelas" />
              </SelectTrigger>
              <SelectContent>
                {[...Array(12)].map((_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    Kelas {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.gradeLevel && (
              <p className="text-sm text-red-500">{errors.gradeLevel[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="academicYearId">Tahun Ajaran</Label>
            <Select
              name="academicYearId"
              value={academicYearId}
              onValueChange={setAcademicYearId}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih tahun ajaran" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.name} {year.isActive && '(Aktif)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.academicYearId && (
              <p className="text-sm text-red-500">{errors.academicYearId[0]}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Menyimpan...' : 'Simpan'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (onSuccess) {
                  onSuccess();
                } else {
                  router.back();
                }
              }}
              disabled={isLoading}
            >
              Batal
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
