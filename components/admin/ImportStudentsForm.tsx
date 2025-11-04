'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { importStudents } from '@/lib/actions/admin/import-students';

export function ImportStudentsForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    success: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
      ];
      
      if (!validTypes.includes(selectedFile.type) && 
          !selectedFile.name.endsWith('.xlsx') && 
          !selectedFile.name.endsWith('.xls') && 
          !selectedFile.name.endsWith('.csv')) {
        toast({
          title: 'File tidak valid',
          description: 'Hanya file Excel (.xlsx, .xls) atau CSV (.csv) yang diperbolehkan',
          variant: 'destructive',
        });
        return;
      }

      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({
          title: 'File terlalu besar',
          description: 'Ukuran file maksimal 5MB',
          variant: 'destructive',
        });
        return;
      }

      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast({
        title: 'File belum dipilih',
        description: 'Silakan pilih file Excel atau CSV terlebih dahulu',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const formData = new FormData();
      formData.append('file', file);

      const response = await importStudents(formData);

      clearInterval(progressInterval);
      setProgress(100);

      if (response.success && response.data) {
        setResult(response.data);
        
        if (response.data.failed === 0) {
          toast({
            title: 'Import berhasil!',
            description: `${response.data.success} siswa berhasil diimport`,
          });
          
          // Redirect after 2 seconds
          setTimeout(() => {
            router.push('/admin/users');
            router.refresh();
          }, 2000);
        } else {
          toast({
            title: 'Import selesai dengan error',
            description: `${response.data.success} berhasil, ${response.data.failed} gagal`,
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Import gagal',
          description: response.error || 'Terjadi kesalahan saat import',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat upload file',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setProgress(0);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file">File Excel/CSV</Label>
          <div className="flex gap-2">
            <Input
              id="file"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              disabled={isUploading}
              className="cursor-pointer"
            />
            {file && !isUploading && (
              <Button type="button" variant="outline" onClick={handleReset}>
                Reset
              </Button>
            )}
          </div>
          {file && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileSpreadsheet className="h-4 w-4" />
              <span>{file.name}</span>
              <span className="text-gray-400">
                ({(file.size / 1024).toFixed(2)} KB)
              </span>
            </div>
          )}
        </div>

        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Mengupload dan memproses...</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <Button type="submit" disabled={!file || isUploading} className="w-full">
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? 'Mengupload...' : 'Upload dan Import'}
        </Button>
      </form>

      {/* Result Summary */}
      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Alert className="border-emerald-200 bg-emerald-50">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-900">
                <span className="font-semibold">{result.success}</span> siswa berhasil diimport
              </AlertDescription>
            </Alert>

            {result.failed > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <span className="font-semibold">{result.failed}</span> siswa gagal diimport
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Error Details */}
          {result.errors && result.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold mb-2">Detail Error:</p>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {result.errors.map((error, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium">Baris {error.row}:</span> {error.error}
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {result.failed === 0 && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-900">
                Import berhasil! Anda akan diarahkan ke halaman pengguna...
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
