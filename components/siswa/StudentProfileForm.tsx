'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { updateMyProfile } from '@/lib/actions/siswa/profile';
import { Loader2 } from 'lucide-react';

type StudentProfileFormProps = {
  profile: {
    user: {
      phone: string | null;
    };
    address: string | null;
    parentPhone: string | null;
  };
};

export function StudentProfileForm({ profile }: StudentProfileFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await updateMyProfile(formData);

      if (result.success) {
        toast({
          title: 'Berhasil',
          description: 'Profil berhasil diperbarui',
        });
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
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profil</CardTitle>
        <CardDescription>
          Perbarui informasi kontak Anda. Hanya beberapa field yang dapat diubah.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Nomor Telepon</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Contoh: 081234567890"
              defaultValue={profile.user.phone || ''}
            />
            <p className="text-sm text-muted-foreground">
              Nomor telepon yang dapat dihubungi
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Alamat</Label>
            <Textarea
              id="address"
              name="address"
              placeholder="Masukkan alamat lengkap"
              rows={3}
              defaultValue={profile.address || ''}
            />
            <p className="text-sm text-muted-foreground">
              Alamat tempat tinggal saat ini
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentPhone">Nomor Telepon Orang Tua</Label>
            <Input
              id="parentPhone"
              name="parentPhone"
              type="tel"
              placeholder="Contoh: 081234567890"
              defaultValue={profile.parentPhone || ''}
            />
            <p className="text-sm text-muted-foreground">
              Nomor telepon orang tua/wali yang dapat dihubungi
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Perubahan
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
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
