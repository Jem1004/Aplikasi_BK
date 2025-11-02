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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CalendarIcon, Edit, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { deleteViolation } from '@/lib/actions/guru-bk/violations';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

type Violation = {
  id: string;
  incidentDate: Date;
  description: string | null;
  points: number;
  createdAt: Date;
  violationType: {
    id: string;
    name: string;
    type: string;
    category: string | null;
  };
  recorder: {
    user: {
      fullName: string;
    };
  };
};

type ViolationHistoryProps = {
  violations: Violation[];
  studentName: string;
  canEdit?: boolean;
};

export function ViolationHistory({
  violations,
  studentName,
  canEdit = false,
}: ViolationHistoryProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Calculate summary
  const summary = useMemo(() => {
    const totalPoints = violations.reduce((sum, v) => sum + v.points, 0);
    const violationCount = violations.filter(
      (v) => v.violationType.type === 'PELANGGARAN'
    ).length;
    const prestationCount = violations.filter(
      (v) => v.violationType.type === 'PRESTASI'
    ).length;

    return { totalPoints, violationCount, prestationCount };
  }, [violations]);

  // Filter violations by date range
  const filteredViolations = useMemo(() => {
    return violations.filter((violation) => {
      const incidentDate = new Date(violation.incidentDate);

      if (dateFrom && incidentDate < dateFrom) {
        return false;
      }

      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (incidentDate > endOfDay) {
          return false;
        }
      }

      return true;
    });
  }, [violations, dateFrom, dateTo]);

  // Group violations by month
  const groupedViolations = useMemo(() => {
    const groups: Record<string, Violation[]> = {};

    filteredViolations.forEach((violation) => {
      const monthKey = format(new Date(violation.incidentDate), 'MMMM yyyy', {
        locale: idLocale,
      });

      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }

      groups[monthKey].push(violation);
    });

    return groups;
  }, [filteredViolations]);

  async function handleDelete(violationId: string) {
    setDeletingId(violationId);

    try {
      const result = await deleteViolation(violationId);

      if (result.success) {
        toast({
          title: 'Berhasil',
          description: 'Data pelanggaran berhasil dihapus',
        });
        router.refresh();
      } else {
        toast({
          title: 'Gagal',
          description: result.error || 'Terjadi kesalahan',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Gagal',
        description: 'Terjadi kesalahan. Silakan coba lagi',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Poin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.totalPoints}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Akumulasi poin {studentName}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pelanggaran</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {summary.violationCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total pelanggaran tercatat
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Prestasi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {summary.prestationCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total prestasi tercatat
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Tanggal</CardTitle>
          <CardDescription>
            Filter riwayat berdasarkan rentang tanggal
          </CardDescription>
        </CardHeader>
        <CardContent>
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

            {(dateFrom || dateTo) && (
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDateFrom(undefined);
                    setDateTo(undefined);
                  }}
                >
                  Reset
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pelanggaran & Prestasi</CardTitle>
          <CardDescription>
            Menampilkan {filteredViolations.length} dari {violations.length} data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredViolations.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {dateFrom || dateTo
                ? 'Tidak ada data pada rentang tanggal yang dipilih'
                : 'Belum ada riwayat pelanggaran atau prestasi'}
            </p>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedViolations).map(([month, monthViolations]) => (
                <div key={month}>
                  <h3 className="text-lg font-semibold mb-4 text-gray-700">{month}</h3>
                  <div className="space-y-4">
                    {monthViolations.map((violation, index) => (
                      <div
                        key={violation.id}
                        className="relative pl-8 pb-4 border-l-2 border-gray-200 last:border-l-0 last:pb-0"
                      >
                        {/* Timeline dot */}
                        <div
                          className={cn(
                            'absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white',
                            violation.violationType.type === 'PELANGGARAN'
                              ? 'bg-red-500'
                              : 'bg-green-500'
                          )}
                        />

                        {/* Content */}
                        <div className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold">
                                  {violation.violationType.name}
                                </h4>
                                <Badge
                                  variant={
                                    violation.violationType.type === 'PELANGGARAN'
                                      ? 'destructive'
                                      : 'default'
                                  }
                                >
                                  {violation.violationType.type === 'PELANGGARAN'
                                    ? 'Pelanggaran'
                                    : 'Prestasi'}
                                </Badge>
                                {violation.violationType.category && (
                                  <Badge variant="outline">
                                    {violation.violationType.category}
                                  </Badge>
                                )}
                              </div>

                              {violation.description && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  {violation.description}
                                </p>
                              )}

                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>
                                  {format(new Date(violation.incidentDate), 'PPP', {
                                    locale: idLocale,
                                  })}
                                </span>
                                <span>•</span>
                                <span>Dicatat oleh {violation.recorder.user.fullName}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <p
                                  className={cn(
                                    'text-2xl font-bold',
                                    violation.points > 0 ? 'text-red-600' : 'text-green-600'
                                  )}
                                >
                                  {violation.points > 0 ? '+' : ''}
                                  {violation.points}
                                </p>
                                <p className="text-xs text-muted-foreground">poin</p>
                              </div>

                              {canEdit && (
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() =>
                                      router.push(`/guru-bk/violations/edit/${violation.id}`)
                                    }
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>

                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        disabled={deletingId === violation.id}
                                      >
                                        {deletingId === violation.id ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <Trash2 className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Hapus Data?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Apakah Anda yakin ingin menghapus data pelanggaran ini?
                                          Tindakan ini tidak dapat dibatalkan.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Batal</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDelete(violation.id)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Hapus
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              )}
                            </div>
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
