'use client';

import { useEffect } from 'react';
import type { PermissionPrintData } from '@/lib/actions/guru-bk/permissions';
import { Button } from '@/components/ui/button';
import { X, Printer } from 'lucide-react';

type PermissionPrintViewProps = {
  printData: PermissionPrintData;
  onClose: () => void;
};

export function PermissionPrintView({
  printData,
  onClose,
}: PermissionPrintViewProps) {
  // Trigger print dialog when component mounts
  useEffect(() => {
    // Small delay to ensure content is rendered
    const timer = setTimeout(() => {
      window.print();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header - Hidden when printing */}
        <div className="flex items-center justify-between p-4 border-b print:hidden">
          <h2 className="text-lg font-semibold">Surat Izin</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4 mr-2" />
              Cetak Ulang
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Print Content */}
        <div className="p-8 print:p-0">
          <div className="space-y-6">
            {/* School Header */}
            <div className="text-center border-b-2 border-gray-800 pb-4">
              <h1 className="text-2xl font-bold uppercase">
                SMA Negeri 1 [Nama Sekolah]
              </h1>
              <p className="text-sm mt-1">
                Jl. [Alamat Sekolah], Telp: [Nomor Telepon]
              </p>
              <p className="text-sm">
                Email: [email@sekolah.sch.id] | Website: [www.sekolah.sch.id]
              </p>
            </div>

            {/* Permission Title */}
            <div className="text-center">
              <h2 className="text-xl font-bold uppercase underline">
                Surat Izin {printData.permissionType}
              </h2>
              <p className="text-sm mt-2">
                Nomor: {printData.permissionNumber}
              </p>
            </div>

            {/* Permission Details */}
            <div className="space-y-3">
              <p className="text-sm">
                Yang bertanda tangan di bawah ini:
              </p>

              <div className="ml-8 space-y-2 text-sm">
                <div className="grid grid-cols-[120px_10px_1fr]">
                  <span>Nama</span>
                  <span>:</span>
                  <span className="font-medium">{printData.issuedBy}</span>
                </div>
                <div className="grid grid-cols-[120px_10px_1fr]">
                  <span>Jabatan</span>
                  <span>:</span>
                  <span className="font-medium">Guru Bimbingan Konseling</span>
                </div>
              </div>

              <p className="text-sm mt-4">
                Dengan ini memberikan izin kepada:
              </p>

              <div className="ml-8 space-y-2 text-sm">
                <div className="grid grid-cols-[120px_10px_1fr]">
                  <span>Nama Siswa</span>
                  <span>:</span>
                  <span className="font-medium">{printData.studentName}</span>
                </div>
                <div className="grid grid-cols-[120px_10px_1fr]">
                  <span>NIS</span>
                  <span>:</span>
                  <span className="font-medium">{printData.nis}</span>
                </div>
                <div className="grid grid-cols-[120px_10px_1fr]">
                  <span>Kelas</span>
                  <span>:</span>
                  <span className="font-medium">{printData.className}</span>
                </div>
              </div>

              <p className="text-sm mt-4">
                Untuk:
              </p>

              <div className="ml-8 space-y-2 text-sm">
                <div className="grid grid-cols-[120px_10px_1fr]">
                  <span>Jenis Izin</span>
                  <span>:</span>
                  <span className="font-medium">{printData.permissionType}</span>
                </div>
                <div className="grid grid-cols-[120px_10px_1fr]">
                  <span>Tanggal</span>
                  <span>:</span>
                  <span className="font-medium">{printData.date}</span>
                </div>
                <div className="grid grid-cols-[120px_10px_1fr]">
                  <span>Waktu</span>
                  <span>:</span>
                  <span className="font-medium">
                    {printData.startTime}
                    {printData.endTime && ` - ${printData.endTime}`}
                  </span>
                </div>
                {printData.destination && (
                  <div className="grid grid-cols-[120px_10px_1fr]">
                    <span>Tujuan</span>
                    <span>:</span>
                    <span className="font-medium">{printData.destination}</span>
                  </div>
                )}
                <div className="grid grid-cols-[120px_10px_1fr]">
                  <span>Alasan</span>
                  <span>:</span>
                  <span className="font-medium">{printData.reason}</span>
                </div>
              </div>

              <p className="text-sm mt-4">
                Demikian surat izin ini dibuat untuk dapat dipergunakan sebagaimana mestinya.
              </p>
            </div>

            {/* Signature Section */}
            <div className="mt-8 flex justify-end">
              <div className="text-center space-y-16 w-48">
                <div>
                  <p className="text-sm">Dikeluarkan di: [Kota]</p>
                  <p className="text-sm">Tanggal: {printData.issuedAt}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">{printData.issuedBy}</p>
                  <p className="text-sm">Guru BK</p>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="mt-8 pt-4 border-t border-dashed text-xs text-gray-500 text-center">
              <p>
                Surat izin ini dicetak secara otomatis dari Sistem Bimbingan Konseling
              </p>
              <p className="mt-1">
                Nomor Referensi: {printData.id}
              </p>
            </div>
          </div>
        </div>

        {/* Footer - Hidden when printing */}
        <div className="p-4 border-t bg-gray-50 print:hidden">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Tutup
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              Cetak
            </Button>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          .fixed {
            position: static !important;
          }
          .bg-black\\/50 {
            background: transparent !important;
          }
          .rounded-lg,
          .shadow-xl {
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          .max-w-2xl {
            max-width: 100% !important;
          }
          .overflow-auto {
            overflow: visible !important;
          }
          .p-8 {
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
