import { UserForm } from '@/components/admin/UserForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';

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

export default async function NewUserPage() {
  const classes = await getClasses();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tambah Pengguna Baru</h1>
          <p className="text-muted-foreground mt-2">
            Buat akun pengguna baru
          </p>
        </div>
      </div>

      <UserForm mode="create" classes={classes} />
    </div>
  );
}
