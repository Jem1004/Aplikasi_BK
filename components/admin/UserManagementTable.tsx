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
import { Pencil, Trash2, Search, RotateCcw, Users, CheckSquare, Square } from 'lucide-react';
import Link from 'next/link';
import { deleteUser, reactivateUser, bulkDeleteUsers } from '@/lib/actions/admin/users';
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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);
  const [userToReactivate, setUserToReactivate] = useState<string | null>(null);
  const [isReactivating, setIsReactivating] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Filter users based on search, role, and status
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
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
        description: 'Pengguna berhasil dinonaktifkan',
      });
      // Update user in local state instead of removing
      setUsers(users.map((u) =>
        u.id === userToDelete ? { ...u, isActive: false } : u
      ));
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
      // Update user in local state
      setUsers(users.map((u) =>
        u.id === userToReactivate ? { ...u, isActive: true } : u
      ));
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

  // Bulk selection handlers
  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(user => user.id)));
    }
  };

  const handleBulkDeleteClick = () => {
    if (selectedUsers.size === 0) return;
    setBulkDeleteDialogOpen(true);
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedUsers.size === 0) return;

    setIsBulkDeleting(true);

    try {
      const userIds = Array.from(selectedUsers);
      const result = await bulkDeleteUsers(userIds);

      if (result.success) {
        toast({
          title: 'Berhasil',
          description: `${result.data!.success} pengguna berhasil dinonaktifkan${result.data!.failed > 0 ? ` dan ${result.data!.failed} gagal` : ''}`,
        });

        // Update users in local state
        setUsers(users.map((u) =>
          userIds.includes(u.id) ? { ...u, isActive: false } : u
        ));
        setSelectedUsers(new Set());
        router.refresh();
      } else {
        toast({
          title: 'Gagal',
          description: result.error || 'Terjadi kesalahan saat menonaktifkan pengguna',
          variant: 'destructive',
        });

        // Show detailed errors if available
        if (result.data?.errors && result.data.errors.length > 0) {
          console.error('Bulk delete errors:', result.data.errors);
        }
      }
    } catch (error) {
      toast({
        title: 'Gagal',
        description: 'Terjadi kesalahan saat menonaktifkan pengguna',
        variant: 'destructive',
      });
    }

    setIsBulkDeleting(false);
    setBulkDeleteDialogOpen(false);
  };

  const isAllSelected = filteredUsers.length > 0 && selectedUsers.size === filteredUsers.length;
  const hasActiveUsersSelected = Array.from(selectedUsers).some(userId =>
    users.find(user => user.id === userId)?.isActive
  );

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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="inactive">Nonaktif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions Bar */}
      {selectedUsers.size > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-blue-900">
              {selectedUsers.size} pengguna dipilih
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDeleteClick}
              disabled={!hasActiveUsersSelected}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Nonaktifkan ({selectedUsers.size})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedUsers(new Set())}
            >
              Batal Pilih
            </Button>
          </div>
        </div>
      )}

      {/* Table - Desktop view with horizontal scroll */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center justify-center w-full"
                  title={isAllSelected ? "Batalkan pilih semua" : "Pilih semua"}
                >
                  {isAllSelected ? (
                    <CheckSquare className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Square className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </TableHead>
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
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Tidak ada data pengguna
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <button
                      onClick={() => handleSelectUser(user.id)}
                      className="flex items-center justify-center w-full"
                      title="Pilih/batal pilih pengguna"
                    >
                      {selectedUsers.has(user.id) ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Square className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </TableCell>
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
                      {user.isActive ? (
                        <>
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
                            aria-label={`Nonaktifkan ${user.fullName}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleReactivateClick(user.id)}
                            className="min-w-[44px] min-h-[44px]"
                            aria-label={`Aktifkan ${user.fullName}`}
                        >
                          <RotateCcw className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 items-center justify-between pt-4 border-t">
        <div className="text-sm text-muted-foreground">
          Menampilkan {filteredUsers.length} dari {users.length} pengguna
        </div>
        <Link href="/admin/users/trash">
          <Button variant="outline" className="min-h-[44px]">
            <Users className="mr-2 h-4 w-4" />
            Lihat Pengguna Terhapus
          </Button>
        </Link>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nonaktifkan Pengguna</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menonaktifkan pengguna ini? Pengguna tidak akan bisa login tetapi data tetap tersimpan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Menonaktifkan...' : 'Nonaktifkan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nonaktifkan {selectedUsers.size} Pengguna</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menonaktifkan {selectedUsers.size} pengguna yang dipilih?
              Pengguna tidak akan bisa login tetapi data tetap tersimpan.
            </AlertDialogDescription>
            <div className="mt-4">
              <strong className="text-sm">Daftar pengguna:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                {Array.from(selectedUsers).map(userId => {
                  const user = users.find(u => u.id === userId);
                  return user ? (
                    <li key={userId}>
                      • {user.fullName} ({user.email}) - {roleLabels[user.role]}
                    </li>
                  ) : null;
                })}
              </ul>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteConfirm}
              disabled={isBulkDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBulkDeleting ? 'Menonaktifkan...' : `Nonaktifkan ${selectedUsers.size} Pengguna`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
