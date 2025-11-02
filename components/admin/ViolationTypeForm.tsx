'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createViolationType, updateViolationType } from '@/lib/actions/admin/master-data';

interface ViolationTypeFormProps {
  violationType?: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    points: number;
    type: 'PELANGGARAN' | 'PRESTASI';
    category: string | null;
    isActive: boolean;
  };
  onSuccess?: () => void;
}

export function ViolationTypeForm({ violationType, onSuccess }: ViolationTypeFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [type, setType] = useState(violationType?.type || '');

  const isEdit = !!violationType;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);

    try {
      const result = isEdit
        ? await updateViolationType(violationType.id, formData)
        : await createViolationType(formData);

      if (result.success) {
        toast({
          title: 'Berhasil',
          description: `Jenis ${type === 'PELANGGARAN' ? 'pelanggaran' : 'prestasi'} berhasil ${isEdit ? 'diupdate' : 'dibuat'}`,
        });
        
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/admin/master-data/violation-types');
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
        <CardTitle>
          {isEdit ? 'Edit Jenis Pelanggaran/Prestasi' : 'Tambah Jenis Pelanggaran/Prestasi'}
        </CardTitle>
        <CardDescription>
          {isEdit ? 'Update informasi jenis pelanggaran/prestasi' : 'Buat jenis pelanggaran/prestasi baru'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Kode</Label>
              <Input
                id="code"
                name="code"
                placeholder="P001"
                defaultValue={violationType?.code}
                required
              />
              {errors.code && (
                <p className="text-sm text-red-500">{errors.code[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipe</Label>
              <Select
                name="type"
                value={type}
                onValueChange={setType}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PELANGGARAN">Pelanggaran</SelectItem>
                  <SelectItem value="PRESTASI">Prestasi</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-500">{errors.type[0]}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nama</Label>
            <Input
              id="name"
              name="name"
              placeholder="Terlambat masuk kelas"
              defaultValue={violationType?.name}
              required
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Deskripsi detail..."
              defaultValue={violationType?.description || ''}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="points">
                Poin {type === 'PRESTASI' && '(positif untuk prestasi)'}
              </Label>
              <Input
                id="points"
                name="points"
                type="number"
                placeholder={type === 'PRESTASI' ? '10' : '-5'}
                defaultValue={violationType?.points}
                required
              />
              <p className="text-xs text-muted-foreground">
                {type === 'PELANGGARAN' 
                  ? 'Gunakan angka negatif untuk pelanggaran (contoh: -5)'
                  : 'Gunakan angka positif untuk prestasi (contoh: 10)'}
              </p>
              {errors.points && (
                <p className="text-sm text-red-500">{errors.points[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Input
                id="category"
                name="category"
                placeholder="Kedisiplinan, Akademik, dll"
                defaultValue={violationType?.category || ''}
              />
              {errors.category && (
                <p className="text-sm text-red-500">{errors.category[0]}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              value="true"
              defaultChecked={violationType?.isActive ?? true}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Aktif
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
