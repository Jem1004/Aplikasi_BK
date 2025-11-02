import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudentCounselorMapping } from '@/components/admin/StudentCounselorMapping';
import { HomeroomTeacherMapping } from '@/components/admin/HomeroomTeacherMapping';
import { prisma } from '@/lib/db/prisma';

export const metadata = {
  title: 'Mapping - Admin',
  description: 'Kelola mapping siswa ke guru BK dan wali kelas ke kelas',
};

async function getAcademicYears() {
  const academicYears = await prisma.academicYear.findMany({
    where: {
      deletedAt: null,
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
      deletedAt: null,
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
