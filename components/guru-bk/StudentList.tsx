'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Eye, Plus } from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Student = {
  id: string;
  nis: string;
  user: {
    fullName: string;
    email: string;
  };
  class: {
    id: string;
    name: string;
  } | null;
  violations: Array<{
    id: string;
    points: number;
    violationType: {
      type: string;
    };
  }>;
};

type StudentListProps = {
  students: Student[];
};

export function StudentList({ students }: StudentListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState<string>('all');

  // Get unique classes for filter
  const classes = useMemo(() => {
    const uniqueClasses = new Map<string, string>();
    students.forEach((student) => {
      if (student.class) {
        uniqueClasses.set(student.class.id, student.class.name);
      }
    });
    return Array.from(uniqueClasses.entries()).map(([id, name]) => ({ id, name }));
  }, [students]);

  // Calculate violation summary for each student
  const studentsWithSummary = useMemo(() => {
    return students.map((student) => {
      const totalPoints = student.violations.reduce((sum, v) => sum + v.points, 0);
      const violationCount = student.violations.filter(
        (v) => v.violationType.type === 'PELANGGARAN'
      ).length;
      const prestationCount = student.violations.filter(
        (v) => v.violationType.type === 'PRESTASI'
      ).length;

      return {
        ...student,
        summary: {
          totalPoints,
          violationCount,
          prestationCount,
        },
      };
    });
  }, [students]);

  // Filter students
  const filteredStudents = useMemo(() => {
    return studentsWithSummary.filter((student) => {
      // Search filter
      const matchesSearch =
        student.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.nis.toLowerCase().includes(searchQuery.toLowerCase());

      // Class filter
      const matchesClass =
        classFilter === 'all' || student.class?.id === classFilter;

      return matchesSearch && matchesClass;
    });
  }, [studentsWithSummary, searchQuery, classFilter]);

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama atau NIS siswa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter Kelas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kelas</SelectItem>
            {classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results Count */}
      <p className="text-sm text-muted-foreground">
        Menampilkan {filteredStudents.length} dari {students.length} siswa
      </p>

      {/* Student Cards */}
      {filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              {searchQuery || classFilter !== 'all'
                ? 'Tidak ada siswa yang sesuai dengan filter'
                : 'Belum ada siswa yang di-mapping'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{student.user.fullName}</CardTitle>
                    <CardDescription className="mt-1">
                      NIS: {student.nis}
                    </CardDescription>
                  </div>
                  {student.class && (
                    <Badge variant="outline" className="shrink-0">{student.class.name}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Violation Summary */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-gray-50 rounded-lg transition-colors duration-200 hover:bg-gray-100">
                      <p className="text-2xl font-bold text-gray-900">
                        {student.summary.totalPoints}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Poin</p>
                    </div>
                    <div className="p-2 bg-red-50 rounded-lg transition-colors duration-200 hover:bg-red-100">
                      <p className="text-2xl font-bold text-red-600">
                        {student.summary.violationCount}
                      </p>
                      <p className="text-xs text-muted-foreground">Pelanggaran</p>
                    </div>
                    <div className="p-2 bg-primary-50 rounded-lg transition-colors duration-200 hover:bg-primary-100">
                      <p className="text-2xl font-bold text-primary-600">
                        {student.summary.prestationCount}
                      </p>
                      <p className="text-xs text-muted-foreground">Prestasi</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link href={`/guru-bk/violations/${student.id}`} className="flex-1">
                      <Button variant="outline" className="w-full min-h-[44px]" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Lihat Detail
                      </Button>
                    </Link>
                    <Link href={`/guru-bk/violations/new?studentId=${student.id}`}>
                      <Button size="sm" className="min-h-[44px] bg-primary-500 hover:bg-primary-600">
                        <Plus className="h-4 w-4 mr-2" />
                        Catat
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
