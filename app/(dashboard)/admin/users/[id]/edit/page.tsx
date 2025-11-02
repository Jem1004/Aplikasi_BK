import { UserForm } from '@/components/admin/UserForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getUserById } from '@/lib/actions/admin/users';
import { prisma } from '@/lib/db/prisma';
import { redirect } from 'next/navigation';

async function getClasses() {
  const classes = await prisma.class.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return classes;
}

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [userResult, classes] = await Promise.all([
    getUserById(id),
    getClasses(),
  ]);

  if (!userResult.success || !userResult.data) {
    redirect('/admin/users');
  }

  const user = userResult.data;

  // Prepare default values
  const defaultValues = {
    email: user.email,
    username: user.username,
    fullName: user.fullName,
    phone: user.phone || '',
    role: user.role,
    nip: user.teacher?.nip || '',
    specialization: user.teacher?.specialization || '',
    nis: user.student?.nis || '',
    nisn: user.student?.nisn || '',
    classId: user.student?.classId || '',
    dateOfBirth: user.student?.dateOfBirth
      ? new Date(user.student.dateOfBirth).toISOString().split('T')[0]
      : '',
    address: user.student?.address || '',
    parentName: user.student?.parentName || '',
    parentPhone: user.student?.parentPhone || '',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Pengguna</h1>
          <p className="text-muted-foreground mt-2">
            Perbarui informasi pengguna
          </p>
        </div>
      </div>

      <UserForm
        mode="edit"
        userId={id}
        defaultValues={defaultValues}
        classes={classes}
      />
    </div>
  );
}
