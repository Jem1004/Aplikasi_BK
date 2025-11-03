'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { getPermissions, getPermissionPrintData } from '@/lib/actions/guru-bk/permissions';
import type { PermissionPrintData } from '@/lib/actions/guru-bk/permissions';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Printer, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const PermissionReceiptView = dynamic(
  () => import('@/components/guru-bk/PermissionReceiptView').then(mod => ({ default: mod.PermissionReceiptView })),
  {
    loading: () => (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    ),
    ssr: false,
  }
);

// Utility function untuk format time dengan error handling
function formatTimeDisplay(timeString: string | null | undefined): string {
  if (!timeString) return 'Tidak ada waktu';

  try {
    // Validasi input type
    if (typeof timeString !== 'string') {
      return 'Format waktu tidak valid';
    }

    // Jika sudah format HH:mm, validasi dan return
    if (timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':');
      const hourNum = parseInt(hours, 10);
      const minuteNum = parseInt(minutes, 10);

      // Validasi range jam dan menit
      if (!isNaN(hourNum) && !isNaN(minuteNum) &&
          hourNum >= 0 && hourNum <= 23 &&
          minuteNum >= 0 && minuteNum <= 59) {
        return timeString;
      }
    }

    // Coba parsing dengan format lain
    const parsedTime = new Date(`1970-01-01T${timeString}`);
    if (isNaN(parsedTime.getTime())) {
      return timeString; // Return original jika parsing gagal
    }

    return format(parsedTime, 'HH:mm');
  } catch (error) {
    console.warn('Time formatting error:', error, 'for time:', timeString, 'type:', typeof timeString);
    return typeof timeString === 'string' ? timeString : 'Format waktu tidak valid';
  }
}

// Utility function untuk format date dengan error handling
function formatDateDisplay(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return 'Tanggal tidak tersedia';

  try {
    let date: Date;

    // Jika sudah Date object, gunakan langsung
    if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      // Jika string ISO format, parsing
      date = new Date(dateInput);

      // Jika parsing gagal dan bukan ISO, coba format lain
      if (isNaN(date.getTime()) && !dateInput.includes('T')) {
        date = new Date(`1970-01-01T${dateInput}`);
      }
    }

    // Validasi Date object
    if (isNaN(date.getTime())) {
      return typeof dateInput === 'string' ? dateInput : 'Format tanggal tidak valid';
    }

    return format(date, 'dd MMM yyyy', { locale: idLocale });
  } catch (error) {
    console.warn('Date formatting error:', error, 'for date:', dateInput);
    return 'Format tanggal tidak valid';
  }
}

// Utility function untuk sanitize data permission
function sanitizePermission(permission: any): any {
  if (!permission || typeof permission !== 'object') {
    return permission;
  }

  // Deep clone untuk menghindari object Date issues
  const sanitized = { ...permission };

  // Sanitize semua properti yang mungkin berisi object Date
  Object.keys(sanitized).forEach(key => {
    const value = sanitized[key];

    // Jika Date object, convert ke string
    if (value instanceof Date) {
      sanitized[key] = value.toISOString();
    }

    // Jika object nested, cek rekursif
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizePermission(value);
    }

    // Jika array, sanitize setiap item
    if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'object' && item !== null ? sanitizePermission(item) : item
      );
    }
  });

  return sanitized;
}

type Permission = {
  id: string;
  permissionDate: string | Date;
  permissionType: string;
  reason: string;
  startTime: string;
  endTime: string | null;
  destination: string | null;
  student: {
    nis: string;
    user: {
      fullName: string;
    };
    class: {
      name: string;
    } | null;
  };
};

type PermissionListProps = {
  schoolInfoMissing: boolean;
};

export function PermissionList({ schoolInfoMissing }: PermissionListProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [printData, setPrintData] = useState<PermissionPrintData | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        // Load permissions
        const result = await getPermissions();
        if (result.success && result.data) {
          const sanitized = result.data.map(permission => sanitizePermission(permission));
          setPermissions(sanitized);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const handlePrint = async (permissionId: string) => {
    setIsPrinting(true);
    try {
      const result = await getPermissionPrintData(permissionId);
      if (result.success && result.data) {
        setPrintData(result.data);
      }
    } catch (error) {
      console.error('Failed to load print data:', error);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleClosePrint = () => {
    setPrintData(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {/* Warning if school info is missing */}
      {schoolInfoMissing && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Informasi sekolah belum diatur. Kartu izin akan menggunakan placeholder text.
            Silakan hubungi administrator untuk mengatur informasi sekolah di Master Data.
          </AlertDescription>
        </Alert>
      )}

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
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions && permissions.length > 0 ? permissions.map((permission) => (
                <TableRow key={`permission-${permission.id || 'unknown'}`}>
                  <TableCell>
                    {formatDateDisplay(permission.permissionDate)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {permission.student?.user?.fullName || 'Tidak ada nama'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {permission.student?.nis || 'Tidak ada NIS'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {permission.student?.class?.name || '-'}
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
                      {formatTimeDisplay(permission.startTime)}
                      {permission.endTime && ` - ${formatTimeDisplay(permission.endTime)}`}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate text-sm">
                      {permission.reason || 'Tidak ada alasan'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {permission.destination || '-'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrint(permission.id)}
                      disabled={isPrinting}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Cetak
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Tidak ada data izin yang tersedia
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Summary Stats */}
      {permissions && permissions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg border">
            <div className="text-sm text-muted-foreground">Total Izin</div>
            <div className="text-2xl font-bold mt-1">{permissions.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <div className="text-sm text-muted-foreground">Izin Masuk</div>
            <div className="text-2xl font-bold mt-1">
              {permissions.filter((p) => p && p.permissionType === 'MASUK').length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <div className="text-sm text-muted-foreground">Izin Keluar</div>
            <div className="text-2xl font-bold mt-1">
              {permissions.filter((p) => p && p.permissionType === 'KELUAR').length}
            </div>
          </div>
        </div>
      )}

      {/* Print Dialog */}
      {printData && (
        <PermissionReceiptView printData={printData} onClose={handleClosePrint} />
      )}
    </>
  );
}
