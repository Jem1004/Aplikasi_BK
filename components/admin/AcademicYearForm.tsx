'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createAcademicYear, updateAcademicYear } from '@/lib/actions/admin/master-data';

interface AcademicYearFormProps {
  academicYear?: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
  };
  onSuccess?: () => void;
}

export function AcademicYearForm({ academicYear, onSuccess }: AcademicYearFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const isEdit = !!academicYear;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);

    try {
      const result = isEdit
        ? await updateAcademicYear(academicYear.id, formData)
        : await createAcademicYear(formData);

      if (result.success) {
        toast({
          title: 'Berhasil',
          description: `Tahun ajaran berhasil ${isEdit ? 'diupdate' : 'dibuat'}`,
        });
        
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/admin/master-data/academic-years');
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

  const formatDateForInput = (date: Date) => {
    return new Date(date).toISOString().split('T')[0];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran'}</CardTitle>
        <CardDescription>
          {isEdit ? 'Update informasi tahun ajaran' : 'Buat tahun ajaran baru'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Tahun Ajaran</Label>
            <Input
              id="name"
              name="name"
              placeholder="2024/2025"
              defaultValue={academicYear?.name}
              required
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Tanggal Mulai</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={academicYear ? formatDateForInput(academicYear.startDate) : ''}
                required
              />
              {errors.startDate && (
                <p className="text-sm text-red-500">{errors.startDate[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Tanggal Selesai</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                defaultValue={academicYear ? formatDateForInput(academicYear.endDate) : ''}
                required
              />
              {errors.endDate && (
                <p className="text-sm text-red-500">{errors.endDate[0]}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              value="true"
              defaultChecked={academicYear?.isActive}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Tahun Ajaran Aktif
            </Label>
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
