'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon, Download } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type Permission = {
  id: string;
  permissionType: string;
  reason: string;
  permissionDate: Date;
  startTime: Date | string;
  endTime: Date | string | null;
  destination: string | null;
  notes: string | null;
  createdAt: Date;
  issuer: {
    user: {
      fullName: string;
    };
  };
};

type StudentPermissionViewProps = {
  permissions: Permission[];
  studentName: string;
};

export function StudentPermissionView({
  permissions,
  studentName,
}: StudentPermissionViewProps) {
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Filter permissions
  const filteredPermissions = useMemo(() => {
    return permissions.filter((permission) => {
      const permissionDate = new Date(permission.permissionDate);

      // Date filter
      if (dateFrom && permissionDate < dateFrom) {
        return false;
      }

      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (permissionDate > endOfDay) {
          return false;
        }
      }

      // Type filter
      if (typeFilter !== 'all' && permission.permissionType !== typeFilter) {
        return false;
      }

      return true;
    });
  }, [permissions, dateFrom, dateTo, typeFilter]);

  // Group permissions by month
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {};

    filteredPermissions.forEach((permission) => {
      const monthKey = format(new Date(permission.permissionDate), 'MMMM yyyy', {
        locale: idLocale,
      });

      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }

      groups[monthKey].push(permission);
    });

    return groups;
  }, [filteredPermissions]);

  // Export to CSV
  const handleExport = () => {
    const csvHeaders = ['Tanggal', 'Jenis', 'Waktu', 'Alasan', 'Tujuan', 'Dikeluarkan Oleh'];
    const csvRows = filteredPermissions.map((permission) => {
      const startTime = typeof permission.startTime === 'string' 
        ? permission.startTime 
        : format(permission.startTime, 'HH:mm');
      const endTime = permission.endTime 
        ? (typeof permission.endTime === 'string' 
          ? permission.endTime 
          : format(permission.endTime, 'HH:mm'))
        : '';
      
      return [
        format(new Date(permission.permissionDate), 'dd/MM/yyyy'),
        permission.permissionType,
        `${startTime}${endTime ? ` - ${endTime}` : ''}`,
        permission.reason,
        permission.destination || '-',
        permission.issuer.user.fullName,
      ];
    });

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `izin_${studentName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Total Izin</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{permissions.length}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Total izin yang dikeluarkan untuk {studentName}
          </p>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
          <CardDescription>
            Filter riwayat izin berdasarkan tanggal dan jenis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Date Range Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Dari Tanggal</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !dateFrom && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? (
                        format(dateFrom, 'PPP', { locale: idLocale })
                      ) : (
                        <span>Pilih tanggal</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Sampai Tanggal</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !dateTo && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? (
                        format(dateTo, 'PPP', { locale: idLocale })
                      ) : (
                        <span>Pilih tanggal</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Type Filter and Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Jenis Izin</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Jenis</SelectItem>
                    <SelectItem value="MASUK">Izin Masuk</SelectItem>
                    <SelectItem value="KELUAR">Izin Keluar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 items-end">
                {(dateFrom || dateTo || typeFilter !== 'all') && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDateFrom(undefined);
                      setDateTo(undefined);
                      setTypeFilter('all');
                    }}
                  >
                    Reset
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleExport}
                  disabled={filteredPermissions.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permission List (Read-only) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Riwayat Izin</CardTitle>
              <CardDescription>
                Menampilkan {filteredPermissions.length} dari {permissions.length} data (Hanya Baca)
              </CardDescription>
            </div>
            <Badge variant="secondary">Read-only</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPermissions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {dateFrom || dateTo || typeFilter !== 'all'
                ? 'Tidak ada data yang sesuai dengan filter'
                : 'Belum ada riwayat izin'}
            </p>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedPermissions).map(([month, monthPermissions]) => (
                <div key={month}>
                  <h3 className="text-lg font-semibold mb-4 text-gray-700">{month}</h3>
                  <div className="space-y-3">
                    {monthPermissions.map((permission) => (
                      <div
                        key={permission.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge
                                variant={
                                  permission.permissionType === 'MASUK'
                                    ? 'default'
                                    : 'secondary'
                                }
                              >
                                Izin {permission.permissionType}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(permission.permissionDate), 'PPP', {
                                  locale: idLocale,
                                })}
                              </span>
                            </div>

                            <p className="font-medium mb-1">{permission.reason}</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                              <div>
                                <span className="font-medium">Waktu:</span>{' '}
                                {typeof permission.startTime === 'string' 
                                  ? permission.startTime 
                                  : format(permission.startTime, 'HH:mm')}
                                {permission.endTime && ` - ${
                                  typeof permission.endTime === 'string' 
                                    ? permission.endTime 
                                    : format(permission.endTime, 'HH:mm')
                                }`}
                              </div>
                              {permission.destination && (
                                <div>
                                  <span className="font-medium">Tujuan:</span>{' '}
                                  {permission.destination}
                                </div>
                              )}
                            </div>

                            {permission.notes && (
                              <p className="text-sm text-muted-foreground mt-2">
                                <span className="font-medium">Catatan:</span> {permission.notes}
                              </p>
                            )}

                            <p className="text-xs text-muted-foreground mt-2">
                              Dikeluarkan oleh {permission.issuer.user.fullName}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
