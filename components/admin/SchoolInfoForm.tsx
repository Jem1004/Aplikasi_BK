'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  upsertSchoolInfo,
  uploadSchoolLogo,
  deleteSchoolLogo,
} from '@/lib/actions/admin/school-info';
import {
  schoolInfoSchema,
  type SchoolInfoFormData,
} from '@/lib/validations/school-info';
import type { SchoolInfo } from '@prisma/client';
import { Loader2, Upload, X, Building2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SchoolInfoFormProps {
  initialData?: SchoolInfo | null;
}

export function SchoolInfoForm({ initialData }: SchoolInfoFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isDeletingLogo, setIsDeletingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    initialData?.logoPath || null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<SchoolInfoFormData>({
    resolver: zodResolver(schoolInfoSchema),
    defaultValues: {
      name: initialData?.name || '',
      address: initialData?.address || '',
      phone: initialData?.phone || '',
      email: initialData?.email || '',
      website: initialData?.website || '',
      principalName: initialData?.principalName || '',
      principalNip: initialData?.principalNip || '',
    },
  });

  // Handle logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      toast({
        title: 'Error',
        description: 'File harus berformat PNG, JPG, atau JPEG',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Ukuran file maksimal 2MB',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle logo upload
  const handleLogoUpload = async () => {
    if (!selectedFile) return;

    setIsUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append('logo', selectedFile);

      const result = await uploadSchoolLogo(formData);

      if (result.success) {
        toast({
          title: 'Berhasil',
          description: 'Logo sekolah berhasil diunggah',
        });
        setSelectedFile(null);
        router.refresh();
      } else {
        toast({
          title: 'Gagal',
          description: result.error || 'Gagal mengunggah logo',
          variant: 'destructive',
        });
        // Revert preview
        setLogoPreview(initialData?.logoPath || null);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat mengunggah logo',
        variant: 'destructive',
      });
      setLogoPreview(initialData?.logoPath || null);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Handle logo deletion
  const handleLogoDelete = async () => {
    if (!initialData?.logoPath) return;

    setIsDeletingLogo(true);

    try {
      const result = await deleteSchoolLogo();

      if (result.success) {
        toast({
          title: 'Berhasil',
          description: 'Logo sekolah berhasil dihapus',
        });
        setLogoPreview(null);
        setSelectedFile(null);
        router.refresh();
      } else {
        toast({
          title: 'Gagal',
          description: result.error || 'Gagal menghapus logo',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat menghapus logo',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingLogo(false);
    }
  };

  // Handle form submission
  async function onSubmit(values: SchoolInfoFormData) {
    setIsSubmitting(true);

    try {
      const result = await upsertSchoolInfo(values);

      if (result.success) {
        toast({
          title: 'Berhasil',
          description: initialData
            ? 'Informasi sekolah berhasil diperbarui'
            : 'Informasi sekolah berhasil dibuat',
        });
        router.refresh();
      } else {
        if (result.errors) {
          // Set field errors
          Object.entries(result.errors).forEach(([field, messages]) => {
            form.setError(field as keyof SchoolInfoFormData, {
              type: 'manual',
              message: messages[0],
            });
          });
        } else {
          toast({
            title: 'Gagal',
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
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Logo Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Logo Sekolah</CardTitle>
            <CardDescription>
              Upload logo sekolah (opsional). Format: PNG, JPG, JPEG. Maksimal 2MB.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!initialData && (
              <Alert>
                <AlertDescription>
                  Simpan informasi sekolah terlebih dahulu sebelum mengunggah logo.
                </AlertDescription>
              </Alert>
            )}

            {initialData && (
              <>
                <div className="flex flex-col items-center gap-4">
                  {/* Logo Preview */}
                  <div className="relative w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                    {logoPreview ? (
                      <Image
                        src={logoPreview}
                        alt="Logo Sekolah"
                        width={120}
                        height={120}
                        className="object-contain"
                      />
                    ) : (
                      <Building2 className="w-12 h-12 text-gray-400" />
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <div className="relative">
                      <Input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={handleLogoChange}
                        className="hidden"
                        id="logo-upload"
                        disabled={isUploadingLogo || isDeletingLogo}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('logo-upload')?.click()}
                        disabled={isUploadingLogo || isDeletingLogo}
                        className="w-full sm:w-auto"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Pilih Logo
                      </Button>
                    </div>

                    {selectedFile && (
                      <Button
                        type="button"
                        onClick={handleLogoUpload}
                        disabled={isUploadingLogo || isDeletingLogo}
                        className="w-full sm:w-auto"
                      >
                        {isUploadingLogo && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Upload
                      </Button>
                    )}

                    {logoPreview && !selectedFile && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleLogoDelete}
                        disabled={isUploadingLogo || isDeletingLogo}
                        className="w-full sm:w-auto"
                      >
                        {isDeletingLogo ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <X className="mr-2 h-4 w-4" />
                        )}
                        Hapus Logo
                      </Button>
                    )}
                  </div>

                  {selectedFile && (
                    <p className="text-sm text-gray-600">
                      File dipilih: {selectedFile.name}
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Dasar</CardTitle>
            <CardDescription>
              Informasi umum tentang sekolah
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Sekolah</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="SMA Negeri 1 Jakarta"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Minimal 5 karakter, maksimal 200 karakter
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Jl. Sudirman No. 123, Jakarta Pusat, DKI Jakarta 10110"
                      rows={3}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Minimal 10 karakter, maksimal 500 karakter
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor Telepon</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="021-1234567 atau 08123456789"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="info@sekolah.sch.id"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website (Opsional)</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://www.sekolah.sch.id"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Principal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Kepala Sekolah</CardTitle>
            <CardDescription>
              Data kepala sekolah yang sedang menjabat
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="principalName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Kepala Sekolah</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Dr. Ahmad Suryadi, M.Pd"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Minimal 3 karakter, maksimal 100 karakter
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="principalNip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NIP Kepala Sekolah</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="196501011990031001"
                      maxLength={18}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    18 digit angka
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
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
            {initialData ? 'Simpan Perubahan' : 'Buat Informasi Sekolah'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
