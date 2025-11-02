'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  Calendar as CalendarIcon,
  Clock,
  Filter,
  User,
  CalendarDays,
  List,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppointmentCard } from './AppointmentCard';
import type { AppointmentStatus } from '@prisma/client';

type Appointment = {
  id: string;
  studentId: string;
  counselorId: string;
  appointmentDate: Date;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  reason: string;
  rejectionReason: string | null;
  notes: string | null;
  student: {
    id: string;
    nis: string;
    user: {
      fullName: string;
    };
    class: {
      name: string;
    } | null;
  };
};

type AppointmentListProps = {
  appointments: Appointment[];
};

const statusLabels: Record<AppointmentStatus, string> = {
  PENDING: 'Menunggu',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
  RESCHEDULED: 'Dijadwalkan Ulang',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

const statusColors: Record<AppointmentStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  APPROVED: 'bg-green-100 text-green-800 border-green-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
  RESCHEDULED: 'bg-blue-100 text-blue-800 border-blue-200',
  COMPLETED: 'bg-gray-100 text-gray-800 border-gray-200',
  CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
};

export function AppointmentList({ appointments }: AppointmentListProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Filter appointments by status
  const filteredAppointments = appointments.filter((appointment) => {
    if (selectedStatus === 'all') return true;
    return appointment.status === selectedStatus;
  });

  // Group appointments by date for calendar view
  const appointmentsByDate = filteredAppointments.reduce((acc, appointment) => {
    const dateKey = format(new Date(appointment.appointmentDate), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(appointment);
    return acc;
  }, {} as Record<string, Appointment[]>);

  // Sort dates
  const sortedDates = Object.keys(appointmentsByDate).sort();

  // Count by status
  const statusCounts = appointments.reduce((acc, appointment) => {
    acc[appointment.status] = (acc[appointment.status] || 0) + 1;
    return acc;
  }, {} as Record<AppointmentStatus, number>);

  const pendingCount = statusCounts.PENDING || 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Janji Temu</CardDescription>
            <CardTitle className="text-3xl">{appointments.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardDescription className="text-yellow-700">Menunggu Persetujuan</CardDescription>
            <CardTitle className="text-3xl text-yellow-800">{pendingCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardDescription className="text-green-700">Disetujui</CardDescription>
            <CardTitle className="text-3xl text-green-800">
              {statusCounts.APPROVED || 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="w-full sm:w-[250px]">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="PENDING">Menunggu</SelectItem>
              <SelectItem value="APPROVED">Disetujui</SelectItem>
              <SelectItem value="REJECTED">Ditolak</SelectItem>
              <SelectItem value="RESCHEDULED">Dijadwalkan Ulang</SelectItem>
              <SelectItem value="COMPLETED">Selesai</SelectItem>
              <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'calendar')}>
          <TabsList>
            <TabsTrigger value="list" className="gap-2">
              <List className="h-4 w-4" />
              Daftar
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Kalender
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Appointment Count */}
      <div className="text-sm text-muted-foreground">
        Menampilkan {filteredAppointments.length} dari {appointments.length} janji temu
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {filteredAppointments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  {appointments.length === 0
                    ? 'Belum ada janji temu.'
                    : 'Tidak ada janji temu yang sesuai dengan filter.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredAppointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          )}
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="space-y-6">
          {sortedDates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  {appointments.length === 0
                    ? 'Belum ada janji temu.'
                    : 'Tidak ada janji temu yang sesuai dengan filter.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            sortedDates.map((dateKey) => {
              const dateAppointments = appointmentsByDate[dateKey];
              const date = new Date(dateKey);

              return (
                <Card key={dateKey}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">
                        {format(date, 'EEEE, dd MMMM yyyy', { locale: idLocale })}
                      </CardTitle>
                      <Badge variant="outline">{dateAppointments.length} janji temu</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {dateAppointments
                      .sort((a, b) => {
                        const timeA = a.startTime.toISOString();
                        const timeB = b.startTime.toISOString();
                        return timeA.localeCompare(timeB);
                      })
                      .map((appointment) => (
                        <div
                          key={appointment.id}
                          className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent transition-colors"
                        >
                          <div className="flex-shrink-0 w-20 text-center">
                            <div className="text-sm font-medium">
                              {format(new Date(`2000-01-01T${appointment.startTime.toISOString().substring(11, 16)}`), 'HH:mm')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(`2000-01-01T${appointment.endTime.toISOString().substring(11, 16)}`), 'HH:mm')}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="font-medium truncate">
                                {appointment.student.user.fullName}
                              </span>
                              <Badge
                                variant="outline"
                                className={statusColors[appointment.status]}
                              >
                                {statusLabels[appointment.status]}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {appointment.reason}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // This will be handled by AppointmentCard
                                const card = document.getElementById(`appointment-${appointment.id}`);
                                card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }}
                            >
                              Detail
                            </Button>
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
