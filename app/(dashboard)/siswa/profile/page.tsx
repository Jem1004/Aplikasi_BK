import dynamic from 'next/dynamic';
import { getMyProfile } from '@/lib/actions/siswa/profile';
import { StudentProfile } from '@/components/siswa/StudentProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { redirect } from 'next/navigation';

const StudentProfileForm = dynamic(
  () => import('@/components/siswa/StudentProfileForm').then(mod => ({ default: mod.StudentProfileForm })),
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

// Cache profile for 1 minute (60 seconds)
// Profile data changes occasionally
export const revalidate = 60;

export default async function ProfilePage() {
  const result = await getMyProfile();

  if (!result.success || !result.data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profil Saya</h1>
          <p className="text-muted-foreground mt-2">
            Lihat dan edit informasi profil Anda
          </p>
        </div>

        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              {result.error || 'Data profil tidak ditemukan'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const profile = result.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profil Saya</h1>
        <p className="text-muted-foreground mt-2">
          Lihat dan edit informasi profil Anda
        </p>
      </div>

      <Tabs defaultValue="view" className="space-y-6">
        <TabsList>
          <TabsTrigger value="view">Lihat Profil</TabsTrigger>
          <TabsTrigger value="edit">Edit Profil</TabsTrigger>
          <TabsTrigger value="password">Ubah Password</TabsTrigger>
        </TabsList>

        <TabsContent value="view" className="space-y-6">
          <StudentProfile profile={profile} />
        </TabsContent>

        <TabsContent value="edit" className="space-y-6">
          <StudentProfileForm profile={profile} />
        </TabsContent>

        <TabsContent value="password" className="space-y-6">
          <ChangePasswordForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
