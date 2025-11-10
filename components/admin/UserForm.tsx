'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createUser, updateUser } from '@/lib/actions/admin/users';
import { Role } from '@prisma/client';
import { Loader2 } from 'lucide-react';
import { useNavigationHelper, REDIRECT_URLS } from '@/lib/utils/redirects';

const userFormSchema = z.object({
  email: z.string().email('Email tidak valid'),
  username: z.string().min(3, 'Username minimal 3 karakter'),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[a-zA-Z]/, 'Password harus mengandung huruf')
    .regex(/[0-9]/, 'Password harus mengandung angka')
    .optional()
    .or(z.literal('')),
  fullName: z.string().min(1, 'Nama lengkap harus diisi'),
  phone: z.string().optional(),
  role: z.nativeEnum(Role),
  // Teacher fields
  nip: z.string().optional(),
  specialization: z.string().optional(),
  // Student fields
  nis: z.string().optional(),
  nisn: z.string().optional(),
  classId: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

type UserFormProps = {
  mode: 'create' | 'edit';
  userId?: string;
  defaultValues?: Partial<UserFormValues>;
  classes?: Array<{ id: string; name: string }>;
};

const roleLabels: Record<Role, string> = {
  ADMIN: 'Admin',
  GURU_BK: 'Guru BK',
  WALI_KELAS: 'Wali Kelas',
  SISWA: 'Siswa',
};

export function UserForm({ mode, userId, defaultValues, classes = [] }: UserFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const navigationHelper = useNavigationHelper();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: defaultValues?.email || '',
      username: defaultValues?.username || '',
      password: '',
      fullName: defaultValues?.fullName || '',
      phone: defaultValues?.phone || '',
      role: defaultValues?.role || 'SISWA',
      nip: defaultValues?.nip || '',
      specialization: defaultValues?.specialization || '',
      nis: defaultValues?.nis || '',
      nisn: defaultValues?.nisn || '',
      classId: defaultValues?.classId || '',
      dateOfBirth: defaultValues?.dateOfBirth || '',
      address: defaultValues?.address || '',
      parentName: defaultValues?.parentName || '',
      parentPhone: defaultValues?.parentPhone || '',
    },
  });

  const selectedRole = form.watch('role');
  const isTeacher = selectedRole === 'GURU_BK' || selectedRole === 'WALI_KELAS';
  const isStudent = selectedRole === 'SISWA';

  async function onSubmit(values: UserFormValues) {
    setIsSubmitting(true);

    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        formData.append(key, value.toString());
      }
    });

    let result;
    if (mode === 'create') {
      result = await createUser(formData);
    } else if (userId) {
      result = await updateUser(userId, formData);
    }

    if (result?.success) {
      const successMessage = mode === 'create' ? 'Pengguna berhasil dibuat' : 'Pengguna berhasil diperbarui';
      await navigationHelper.handleSuccess(REDIRECT_URLS.USERS, successMessage);
    } else {
      navigationHelper.handleError(result?.error, 'Gagal memperbarui pengguna');
    }

    setIsSubmitting(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Dasar</CardTitle>
            <CardDescription>
              Informasi akun pengguna
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan nama lengkap" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {mode === 'create' && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Minimal 8 karakter" {...field} />
                    </FormControl>
                    <FormDescription>
                      Password harus mengandung huruf dan angka
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor Telepon (Opsional)</FormLabel>
                    <FormControl>
                      <Input placeholder="08123456789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={mode === 'edit'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(roleLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {mode === 'edit' && (
                      <FormDescription>
                        Role tidak dapat diubah setelah dibuat
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Teacher-specific fields */}
        {isTeacher && (
          <Card>
            <CardHeader>
              <CardTitle>Informasi Guru</CardTitle>
              <CardDescription>
                Informasi khusus untuk guru
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="nip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIP (Opsional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Nomor Induk Pegawai" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specialization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Spesialisasi (Opsional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Bimbingan Konseling" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Student-specific fields */}
        {isStudent && (
          <Card>
            <CardHeader>
              <CardTitle>Informasi Siswa</CardTitle>
              <CardDescription>
                Informasi khusus untuk siswa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NIS</FormLabel>
                      <FormControl>
                        <Input placeholder="Nomor Induk Siswa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nisn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NISN (Opsional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Nomor Induk Siswa Nasional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="classId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kelas (Opsional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kelas" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {classes.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}
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
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal Lahir (Opsional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alamat (Opsional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Alamat lengkap" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="parentName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Orang Tua (Opsional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Nama orang tua/wali" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parentPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telepon Orang Tua (Opsional)</FormLabel>
                      <FormControl>
                        <Input placeholder="08123456789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        )}

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
            {mode === 'create' ? 'Buat Pengguna' : 'Simpan Perubahan'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
