import { ClassStudentList } from "@/components/wali-kelas/ClassStudentList";
import { getMyClassStudents } from "@/lib/actions/wali-kelas/students";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export const dynamic = 'force-dynamic';

// Cache student list for 2 minutes (120 seconds)
// Student assignments change occasionally
export const revalidate = 120;

export default async function WaliKelasStudentsPage() {
  const result = await getMyClassStudents();

  if (!result.success) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Daftar Siswa</h1>
          <p className="text-muted-foreground mt-2">
            Siswa di kelas Anda
          </p>
        </div>

        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-lg font-semibold mb-2">Terjadi Kesalahan</p>
              <p className="text-muted-foreground">{result.error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const students = result.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Daftar Siswa</h1>
        <p className="text-muted-foreground mt-2">
          Siswa di kelas Anda
        </p>
      </div>

      <ClassStudentList students={students} />
    </div>
  );
}
