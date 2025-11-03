'use client';

import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getCounselorAvailableSlots, type TimeSlot } from '@/lib/actions/siswa/appointments';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';

interface CounselorAvailabilityProps {
  onSlotSelect: (date: Date, startTime: string, endTime: string) => void;
  selectedDate?: Date;
  selectedStartTime?: string;
}

export function CounselorAvailability({
  onSlotSelect,
  selectedDate,
  selectedStartTime,
}: CounselorAvailabilityProps) {
  const [date, setDate] = useState<Date | undefined>(selectedDate);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available slots when date changes
  useEffect(() => {
    if (date) {
      fetchAvailableSlots(date);
    } else {
      setSlots([]);
    }
  }, [date]);

  const fetchAvailableSlots = async (selectedDate: Date) => {
    setLoading(true);
    setError(null);

    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      const result = await getCounselorAvailableSlots(dateString);

      if (result.success && result.data) {
        setSlots(result.data);
      } else {
        setError(result.error || 'Gagal memuat jadwal tersedia');
        setSlots([]);
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat jadwal');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
  };

  const handleSlotClick = (slot: TimeSlot) => {
    if (slot.isAvailable && date) {
      onSlotSelect(date, slot.startTime, slot.endTime);
    }
  };

  const isSlotSelected = (slot: TimeSlot) => {
    return (
      date &&
      selectedDate &&
      format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') &&
      slot.startTime === selectedStartTime
    );
  };

  // Disable past dates
  const disabledDates = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle>Pilih Tanggal</CardTitle>
          <CardDescription>
            Pilih tanggal untuk melihat jadwal yang tersedia
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            disabled={disabledDates}
            locale={localeId}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      {/* Time Slots */}
      <Card>
        <CardHeader>
          <CardTitle>Waktu Tersedia</CardTitle>
          <CardDescription>
            {date
              ? `Jadwal untuk ${format(date, 'dd MMMM yyyy', { locale: localeId })}`
              : 'Pilih tanggal terlebih dahulu'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!date && (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <Clock className="h-12 w-12 mb-4 opacity-50" />
              <p>Silakan pilih tanggal untuk melihat jadwal tersedia</p>
            </div>
          )}

          {date && loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {date && error && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <XCircle className="h-12 w-12 mb-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchAvailableSlots(date)}
                className="mt-4"
              >
                Coba Lagi
              </Button>
            </div>
          )}

          {date && !loading && !error && slots.length > 0 && (
            <div className="space-y-2">
              {slots.map((slot) => (
                <Button
                  key={`${slot.startTime}-${slot.endTime}`}
                  variant={isSlotSelected(slot) ? 'default' : 'outline'}
                  className="w-full justify-between"
                  disabled={!slot.isAvailable}
                  onClick={() => handleSlotClick(slot)}
                >
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {slot.startTime} - {slot.endTime}
                  </span>
                  {slot.isAvailable ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Tersedia
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                      <XCircle className="h-3 w-3 mr-1" />
                      Penuh
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          )}

          {date && !loading && !error && slots.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <XCircle className="h-12 w-12 mb-4 opacity-50" />
              <p>Tidak ada jadwal tersedia untuk tanggal ini</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
