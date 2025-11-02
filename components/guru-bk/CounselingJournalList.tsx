'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  Calendar,
  Eye,
  Pencil,
  Trash2,
  Lock,
  ShieldCheck,
  Filter,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { deleteCounselingJournal } from '@/lib/actions/guru-bk/journals';
import { useToast } from '@/hooks/use-toast';

type Journal = {
  id: string;
  studentId: string;
  studentName: string;
  sessionDate: Date;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

type Student = {
  id: string;
  user: {
    fullName: string;
  };
};

type CounselingJournalListProps = {
  journals: Journal[];
  students: Student[];
};

export function CounselingJournalList({ journals, students }: CounselingJournalListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter journals
  const filteredJournals = journals.filter((journal) => {
    const matchesStudent = selectedStudent === 'all' || journal.studentId === selectedStudent;
    const matchesSearch =
      searchQuery === '' ||
      journal.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      journal.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStudent && matchesSearch;
  });

  async function handleDelete(id: string) {
    setIsDeleting(id);

    try {
      const result = await deleteCounselingJournal(id);

      if (result.success) {
        toast({
          title: 'Berhasil',
          description: 'Jurnal konseling berhasil dihapus',
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
      setIsDeleting(null);
    }
  }

  function truncateContent(content: string, maxLength: number = 150): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            <CardTitle className="text-base text-green-800">Jurnal Privat & Terenkripsi</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-700">
            Semua jurnal konseling di bawah ini terenkripsi dan hanya dapat diakses oleh Anda. 
            Konten jurnal tidak dapat dilihat oleh admin atau pengguna lain.
          </p>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari berdasarkan nama siswa atau konten..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="w-full sm:w-[250px]">
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter siswa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Siswa</SelectItem>
              {students.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.user.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Journal Count */}
      <div className="text-sm text-muted-foreground">
        Menampilkan {filteredJournals.length} dari {journals.length} jurnal
      </div>

      {/* Journal Cards */}
      {filteredJournals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {journals.length === 0
                ? 'Belum ada jurnal konseling. Buat jurnal pertama Anda.'
                : 'Tidak ada jurnal yang sesuai dengan filter.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredJournals.map((journal) => (
            <Card key={journal.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{journal.studentName}</CardTitle>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <Lock className="h-3 w-3 mr-1" />
                        Terenkripsi
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(journal.sessionDate), 'PPP', { locale: idLocale })}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/guru-bk/journals/${journal.id}`)}
                      title="Lihat detail"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/guru-bk/journals/${journal.id}/edit`)}
                      title="Edit jurnal"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Hapus jurnal"
                          disabled={isDeleting === journal.id}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Jurnal Konseling?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tindakan ini tidak dapat dibatalkan. Jurnal konseling untuk{' '}
                            <span className="font-semibold">{journal.studentName}</span> akan dihapus
                            secara permanen.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(journal.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {truncateContent(journal.content)}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Dibuat: {format(new Date(journal.createdAt), 'PPP', { locale: idLocale })}
                    </span>
                    {journal.updatedAt !== journal.createdAt && (
                      <span>
                        Diperbarui: {format(new Date(journal.updatedAt), 'PPP', { locale: idLocale })}
                      </span>
                    )}
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
