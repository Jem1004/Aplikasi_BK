import { getMyProfile } from '@/lib/actions/siswa/profile';
import { StudentProfile } from '@/components/siswa/StudentProfile';
import { StudentProfileForm } from '@/components/siswa/StudentProfileForm';
import { ChangePasswordForm } from '@/components/shared/ChangePasswordForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { redirect } from 'next/navigation';

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
