import dynamic from 'next/dynamic';
import { auth } from '@/lib/auth/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const ChangePasswordForm = dynamic(
  () => import('@/components/shared/ChangePasswordForm').then(mod => ({ default: mod.ChangePasswordForm })),
  {
    loading: () => (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    )
  }
);
import { User } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function AdminSettingsPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pengaturan</h1>
        <p className="text-muted-foreground mt-2">
          Kelola pengaturan akun Anda
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>Informasi Akun</CardTitle>
            </div>
            <CardDescription>
              Detail akun Anda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nama Lengkap</p>
              <p className="text-base font-medium">{session.user.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-base">{session.user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Role</p>
              <p className="text-base">{session.user.role}</p>
            </div>
          </CardContent>
        </Card>

        <ChangePasswordForm />
      </div>
    </div>
  );
}
