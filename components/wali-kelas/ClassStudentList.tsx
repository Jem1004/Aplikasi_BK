'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Eye } from 'lucide-react';
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

type ClassStudentListProps = {
  students: Student[];
};

export function ClassStudentList({ students }: ClassStudentListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'points'>('name');

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

  // Filter and sort students
  const filteredStudents = useMemo(() => {
    let filtered = studentsWithSummary.filter((student) => {
      // Search filter
      const matchesSearch =
        student.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.nis.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });

    // Sort
    if (sortBy === 'name') {
      filtered.sort((a, b) => a.user.fullName.localeCompare(b.user.fullName));
    } else if (sortBy === 'points') {
      filtered.sort((a, b) => b.summary.totalPoints - a.summary.totalPoints);
    }

    return filtered;
  }, [studentsWithSummary, searchQuery, sortBy]);

  return (
    <div className="space-y-4">
      {/* Search and Sort */}
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
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'name' | 'points')}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Urutkan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Nama (A-Z)</SelectItem>
            <SelectItem value="points">Poin (Tertinggi)</SelectItem>
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
              {searchQuery
                ? 'Tidak ada siswa yang sesuai dengan pencarian'
                : 'Belum ada siswa di kelas ini'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{student.user.fullName}</CardTitle>
                    <CardDescription className="mt-1">
                      NIS: {student.nis}
                    </CardDescription>
                  </div>
                  {student.summary.totalPoints > 50 && (
                    <Badge variant="destructive">Perhatian</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Violation Summary */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <p className={`text-2xl font-bold ${
                        student.summary.totalPoints > 50 
                          ? 'text-red-600' 
                          : student.summary.totalPoints > 0 
                          ? 'text-yellow-600' 
                          : 'text-gray-900'
                      }`}>
                        {student.summary.totalPoints}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Poin</p>
                    </div>
                    <div className="p-2 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">
                        {student.summary.violationCount}
                      </p>
                      <p className="text-xs text-muted-foreground">Pelanggaran</p>
                    </div>
                    <div className="p-2 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {student.summary.prestationCount}
                      </p>
                      <p className="text-xs text-muted-foreground">Prestasi</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <Link href={`/wali-kelas/students/${student.id}`} className="block">
                    <Button variant="outline" className="w-full" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Lihat Detail
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
