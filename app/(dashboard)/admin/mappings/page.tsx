import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { prisma } from '@/lib/db/prisma';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const StudentCounselorMapping = dynamic(
  () => import('@/components/admin/StudentCounselorMapping').then(mod => ({ default: mod.StudentCounselorMapping })),
  {
    loading: () => (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }
);

const HomeroomTeacherMapping = dynamic(
  () => import('@/components/admin/HomeroomTeacherMapping').then(mod => ({ default: mod.HomeroomTeacherMapping })),
  {
    loading: () => (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }
);

// Cache mappings for 2 minutes (120 seconds)
// Mappings change occasionally, moderate cache duration
export const revalidate = 120;

export const metadata = {
  title: 'Mapping - Admin',
  description: 'Kelola mapping siswa ke guru BK dan wali kelas ke kelas',
};

async function getAcademicYears() {
  const academicYears = await prisma.academicYear.findMany({
    where: {
      },
    orderBy: {
      startDate: 'desc',
    },
    select: {
      id: true,
      name: true,
      isActive: true,
    },
  });

  return academicYears;
}

async function getClasses() {
  const classes = await prisma.class.findMany({
    where: {
      },
    orderBy: [
      {
        gradeLevel: 'asc',
      },
      {
        name: 'asc',
      },
    ],
    select: {
      id: true,
      name: true,
      gradeLevel: true,
    },
  });

  return classes;
}

export default async function MappingsPage() {
  const [academicYears, classes] = await Promise.all([
    getAcademicYears(),
    getClasses(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mapping</h1>
        <p className="text-muted-foreground">
          Kelola mapping siswa ke guru BK dan wali kelas ke kelas
        </p>
      </div>

      <Tabs defaultValue="student-counselor" className="space-y-4">
        <TabsList>
          <TabsTrigger value="student-counselor">Siswa - Guru BK</TabsTrigger>
          <TabsTrigger value="homeroom-teacher">Wali Kelas - Kelas</TabsTrigger>
        </TabsList>

        <TabsContent value="student-counselor" className="space-y-4">
          <StudentCounselorMapping academicYears={academicYears} />
        </TabsContent>

        <TabsContent value="homeroom-teacher" className="space-y-4">
          <HomeroomTeacherMapping academicYears={academicYears} classes={classes} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
