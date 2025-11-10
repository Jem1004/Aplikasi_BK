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
import {
  RotateCcw,
  Trash2,
  Search,
  AlertTriangle,
  Users,
  ArrowLeft
} from 'lucide-react';
import { reactivateUser, permanentDeleteUser } from '@/lib/actions/admin/users';
import { useToast } from '@/hooks/use-toast';
import { Role } from '@prisma/client';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

type DeletedUser = {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  deletedAt: Date | null;
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

type DeletedUsersTableProps = {
  users: DeletedUser[];
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

export function DeletedUsersTable({ users: initialUsers }: DeletedUsersTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);
  const [permanentDeleteDialogOpen, setPermanentDeleteDialogOpen] = useState(false);
  const [userToReactivate, setUserToReactivate] = useState<string | null>(null);
  const [userToPermanentDelete, setUserToPermanentDelete] = useState<string | null>(null);
  const [isReactivating, setIsReactivating] = useState(false);
  const [isPermanentDeleting, setIsPermanentDeleting] = useState(false);

  // Filter deleted users based on search and role
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const handleReactivateClick = (userId: string) => {
    setUserToReactivate(userId);
    setReactivateDialogOpen(true);
  };

  const handleReactivateConfirm = async () => {
    if (!userToReactivate) return;

    setIsReactivating(true);
    const result = await reactivateUser(userToReactivate);

    if (result.success) {
      toast({
        title: 'Berhasil',
        description: 'Pengguna berhasil diaktifkan kembali',
      });
      // Remove from local state since it's no longer deleted
      setUsers(users.filter((u) => u.id !== userToReactivate));
      router.refresh();
    } else {
      toast({
        title: 'Gagal',
        description: result.error || 'Terjadi kesalahan',
        variant: 'destructive',
      });
    }

    setIsReactivating(false);
    setReactivateDialogOpen(false);
    setUserToReactivate(null);
  };

  const handlePermanentDeleteClick = (userId: string) => {
    setUserToPermanentDelete(userId);
    setPermanentDeleteDialogOpen(true);
  };

  const handlePermanentDeleteConfirm = async () => {
    if (!userToPermanentDelete) return;

    setIsPermanentDeleting(true);
    const result = await permanentDeleteUser(userToPermanentDelete);

    if (result.success) {
      toast({
        title: 'Berhasil',
        description: 'Pengguna berhasil dihapus secara permanent',
      });
      // Remove from local state
      setUsers(users.filter((u) => u.id !== userToPermanentDelete));
      router.refresh();
    } else {
      toast({
        title: 'Gagal',
        description: result.error || 'Terjadi kesalahan',
        variant: 'destructive',
      });
    }

    setIsPermanentDeleting(false);
    setPermanentDeleteDialogOpen(false);
    setUserToPermanentDelete(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="min-h-[44px]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-red-600" />
            Pengguna Terhapus
          </h2>
          <p className="text-muted-foreground">
            Daftar pengguna yang telah dinonaktifkan dan dapat diaktifkan kembali atau dihapus permanent
          </p>
        </div>
      </div>

      {/* Alert */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-semibold">Perhatian!</span>
        </div>
        <p className="text-red-700 text-sm mt-1">
          Pengguna dalam daftar ini telah dinonaktifkan. Anda dapat mengaktifkan kembali atau menghapus secara permanent.
          Tindakan permanent tidak dapat dibatalkan.
        </p>
      </div>

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
          <SelectTrigger className="w-full sm:w-[150px]">
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

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Nama</TableHead>
              <TableHead className="whitespace-nowrap">Email</TableHead>
              <TableHead className="whitespace-nowrap">Username</TableHead>
              <TableHead className="whitespace-nowrap">Role</TableHead>
              <TableHead className="whitespace-nowrap">Info Tambahan</TableHead>
              <TableHead className="whitespace-nowrap">Tanggal Dihapus</TableHead>
              <TableHead className="text-right whitespace-nowrap">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {users.length === 0 ? (
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-8 w-8 text-muted-foreground" />
                      <p>Belum ada pengguna yang dihapus</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-8 w-8 text-muted-foreground" />
                      <p>Tidak ada pengguna yang cocok dengan filter</p>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} className="bg-red-50/50">
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
                    <div className="text-sm">
                      <div className="font-medium">
                        {user.deletedAt ? format(new Date(user.deletedAt), 'dd MMM yyyy', { locale: id }) : 'N/A'}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {user.deletedAt ? format(new Date(user.deletedAt), 'HH:mm', { locale: id }) : ''}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReactivateClick(user.id)}
                        className="min-h-[36px] text-green-600 border-green-600 hover:bg-green-50"
                        aria-label={`Aktifkan ${user.fullName}`}
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span className="hidden sm:inline ml-1">Aktifkan</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handlePermanentDeleteClick(user.id)}
                        className="min-h-[36px]"
                        aria-label={`Hapus permanent ${user.fullName}`}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline ml-1">Permanent</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Reactivate Confirmation Dialog */}
      <AlertDialog open={reactivateDialogOpen} onOpenChange={setReactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aktifkan Kembali Pengguna</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin mengaktifkan kembali pengguna ini? Pengguna akan bisa login kembali.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReactivating}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReactivateConfirm}
              disabled={isReactivating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isReactivating ? 'Mengaktifkan...' : 'Aktifkan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent Delete Confirmation Dialog */}
      <AlertDialog open={permanentDeleteDialogOpen} onOpenChange={setPermanentDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Hapus Permanent</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-red-600 font-semibold">
                ⚠️ PERINGATAN: Tindakan ini tidak dapat dibatalkan!
              </div>
              <div className="text-sm text-muted-foreground">
                Apakah Anda yakin ingin menghapus pengguna ini secara permanent? Semua data terkait
                (pelanggaran, izin, jurnal, dll) akan dihapus selamanya dari sistem.
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPermanentDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePermanentDeleteConfirm}
              disabled={isPermanentDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPermanentDeleting ? 'Menghapus...' : 'Hapus Permanent'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}