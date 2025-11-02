'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ClassFilterProps {
  academicYears: Array<{
    id: string;
    name: string;
    isActive: boolean;
  }>;
}

export function ClassFilter({ academicYears }: ClassFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentAcademicYearId = searchParams.get('academicYearId') || '';

  const handleAcademicYearChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === 'all') {
      params.delete('academicYearId');
    } else {
      params.set('academicYearId', value);
    }
    router.push(`/admin/master-data/classes?${params.toString()}`);
  };

  return (
    <div className="flex items-end gap-4">
      <div className="space-y-2 w-64">
        <Label>Filter Tahun Ajaran</Label>
        <Select
          value={currentAcademicYearId || 'all'}
          onValueChange={handleAcademicYearChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Semua tahun ajaran" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tahun Ajaran</SelectItem>
            {academicYears.map((year) => (
              <SelectItem key={year.id} value={year.id}>
                {year.name} {year.isActive && '(Aktif)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
