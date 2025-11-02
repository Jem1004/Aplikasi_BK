import { getPermissions } from '@/lib/actions/guru-bk/permissions';
import { Button } from '@/components/ui/button';
import { Plus, FileText } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export default async function PermissionsPage() {
  const result = await getPermissions();

  if (!result.success) {
    redirect('/unauthorized');
  }

  const permissions = result.data || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Izin</h1>
          <p className="text-muted-foreground mt-2">
            Kelola izin masuk dan keluar siswa
          </p>
        </div>
        <Link href="/guru-bk/permissions/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Buat Izin Baru
          </Button>
        </Link>
      </div>

      {/* Permissions Table */}
      <div className="bg-white rounded-lg border">
        {permissions.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Belum ada izin
            </h3>
            <p className="text-muted-foreground mb-4">
              Mulai dengan membuat izin baru untuk siswa
            </p>
            <Link href="/guru-bk/permissions/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Buat Izin Baru
              </Button>
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Siswa</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead>Alasan</TableHead>
                <TableHead>Tujuan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((permission) => (
                <TableRow key={permission.id}>
                  <TableCell>
                    {format(new Date(permission.permissionDate), 'dd MMM yyyy', {
                      locale: idLocale,
                    })}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {permission.student.user.fullName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {permission.student.nis}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {permission.student.class?.name || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        permission.permissionType === 'MASUK'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {permission.permissionType === 'MASUK'
                        ? 'Izin Masuk'
                        : 'Izin Keluar'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(`1970-01-01T${permission.startTime}`), 'HH:mm')}
                      {permission.endTime &&
                        ` - ${format(new Date(`1970-01-01T${permission.endTime}`), 'HH:mm')}`}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate text-sm">
                      {permission.reason}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {permission.destination || '-'}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Summary Stats */}
      {permissions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg border">
            <div className="text-sm text-muted-foreground">Total Izin</div>
            <div className="text-2xl font-bold mt-1">{permissions.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <div className="text-sm text-muted-foreground">Izin Masuk</div>
            <div className="text-2xl font-bold mt-1">
              {permissions.filter((p) => p.permissionType === 'MASUK').length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <div className="text-sm text-muted-foreground">Izin Keluar</div>
            <div className="text-2xl font-bold mt-1">
              {permissions.filter((p) => p.permissionType === 'KELUAR').length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
