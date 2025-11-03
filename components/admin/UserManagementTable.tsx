'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Pencil, Trash2, Search } from 'lucide-react';
import { deleteUser } from '@/lib/actions/admin/users';
import { useToast } from '@/hooks/use-toast';
import { Role } from '@prisma/client';
import { ResetPasswordDialog } from './ResetPasswordDialog';

type User = {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  teacher?: {
    nip: string | null;
  } | null;
  student?: {
    nis: string;
    class?: {
      name: string;
    } | null;
  } | null;
};

type UserManagementTableProps = {
  users: User[];
};

const roleLabels: Record<Role, string> = {
  ADMIN: 'Admin',
  GURU_BK: 'Guru BK',
  WALI_KELAS: 'Wali Kelas',
  SISWA: 'Siswa',
};

const roleColors: Record<Role, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ADMIN: 'destructive',
  GURU_BK: 'default',
  WALI_KELAS: 'secondary',
  SISWA: 'outline',
};

export function UserManagementTable({ users: initialUsers }: UserManagementTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter users based on search and role
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const handleEdit = (userId: string) => {
    router.push(`/admin/users/${userId}/edit`);
  };

  const handleDeleteClick = (userId: string) => {
    setUserToDelete(userId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    const result = await deleteUser(userToDelete);

    if (result.success) {
      toast({
        title: 'Berhasil',
        description: 'Pengguna berhasil dihapus',
      });
      // Remove user from local state
      setUsers(users.filter((u) => u.id !== userToDelete));
      router.refresh();
    } else {
      toast({
        title: 'Gagal',
        description: result.error || 'Terjadi kesalahan',
        variant: 'destructive',
      });
    }

    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, email, atau username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Role</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="GURU_BK">Guru BK</SelectItem>
            <SelectItem value="WALI_KELAS">Wali Kelas</SelectItem>
            <SelectItem value="SISWA">Siswa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table - Desktop view with horizontal scroll */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Nama</TableHead>
              <TableHead className="whitespace-nowrap">Email</TableHead>
              <TableHead className="whitespace-nowrap">Username</TableHead>
              <TableHead className="whitespace-nowrap">Role</TableHead>
              <TableHead className="whitespace-nowrap">Info Tambahan</TableHead>
              <TableHead className="whitespace-nowrap">Status</TableHead>
              <TableHead className="text-right whitespace-nowrap">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Tidak ada data pengguna
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium whitespace-nowrap">{user.fullName}</TableCell>
                  <TableCell className="whitespace-nowrap">{user.email}</TableCell>
                  <TableCell className="whitespace-nowrap">{user.username}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant={roleColors[user.role]}>
                      {roleLabels[user.role]}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {user.teacher?.nip && (
                      <span className="text-sm text-muted-foreground">
                        NIP: {user.teacher.nip}
                      </span>
                    )}
                    {user.student && (
                      <div className="text-sm text-muted-foreground">
                        <div>NIS: {user.student.nis}</div>
                        {user.student.class && (
                          <div>Kelas: {user.student.class.name}</div>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant={user.isActive ? 'default' : 'secondary'}>
                      {user.isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex justify-end gap-2">
                      <ResetPasswordDialog 
                        userId={user.id}
                        userName={user.fullName}
                        userRole={roleLabels[user.role]}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(user.id)}
                        className="min-w-[44px] min-h-[44px]"
                        aria-label={`Edit ${user.fullName}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(user.id)}
                        className="min-w-[44px] min-h-[44px]"
                        aria-label={`Hapus ${user.fullName}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pengguna</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
