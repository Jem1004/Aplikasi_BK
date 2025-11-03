'use client';

import { useEffect } from 'react';
import type { PermissionPrintData } from '@/lib/actions/guru-bk/permissions';
import { Button } from '@/components/ui/button';
import { X, Printer } from 'lucide-react';
import Image from 'next/image';

type PermissionReceiptViewProps = {
  printData: PermissionPrintData;
  onClose: () => void;
};

export function PermissionReceiptView({
  printData,
  onClose,
}: PermissionReceiptViewProps) {
  // Trigger print dialog when component mounts
  useEffect(() => {
    // Small delay to ensure content is rendered
    const timer = setTimeout(() => {
      window.print();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const { schoolInfo } = printData;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto">
        {/* Header - Hidden when printing */}
        <div className="flex items-center justify-between p-4 border-b print:hidden">
          <h2 className="text-lg font-semibold">Kartu Izin Siswa</h2>
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

        {/* Receipt Content - 80mm width */}
        <div className="receipt-container p-4">
          <div className="receipt-content">
            {/* School Logo */}
            {schoolInfo?.logoPath && (
              <div className="receipt-logo">
                <Image
                  src={schoolInfo.logoPath}
                  alt="Logo Sekolah"
                  width={60}
                  height={60}
                  className="object-contain"
                />
              </div>
            )}

            {/* School Header */}
            <div className="receipt-header">
              <h1 className="receipt-school-name">
                {schoolInfo?.name || 'NAMA SEKOLAH'}
              </h1>
              <p className="receipt-school-address">
                {schoolInfo?.address || 'Alamat Sekolah'}
              </p>
              <p className="receipt-school-phone">
                Telp: {schoolInfo?.phone || '021-XXXXXXX'}
              </p>
            </div>

            <div className="receipt-divider" />

            {/* Permission Title */}
            <div className="receipt-title">
              <h2>KARTU IZIN SISWA</h2>
              <p className="receipt-number">No: {printData.permissionNumber}</p>
            </div>

            <div className="receipt-divider" />

            {/* Student Information */}
            <div className="receipt-section">
              <div className="receipt-field">
                <span className="receipt-label">Nama</span>
                <span className="receipt-value">: {printData.studentName}</span>
              </div>
              <div className="receipt-field">
                <span className="receipt-label">NIS</span>
                <span className="receipt-value">: {printData.nis}</span>
              </div>
              <div className="receipt-field">
                <span className="receipt-label">Kelas</span>
                <span className="receipt-value">: {printData.className}</span>
              </div>
            </div>

            <div className="receipt-divider" />

            {/* Permission Details */}
            <div className="receipt-section">
              <div className="receipt-field">
                <span className="receipt-label">Jenis</span>
                <span className="receipt-value">: {printData.permissionType}</span>
              </div>
              <div className="receipt-field">
                <span className="receipt-label">Tanggal</span>
                <span className="receipt-value">: {printData.date}</span>
              </div>
              <div className="receipt-field">
                <span className="receipt-label">Waktu</span>
                <span className="receipt-value">
                  : {printData.startTime}
                  {printData.endTime && ` - ${printData.endTime}`}
                </span>
              </div>
              {printData.destination && (
                <div className="receipt-field">
                  <span className="receipt-label">Tujuan</span>
                  <span className="receipt-value">: {printData.destination}</span>
                </div>
              )}
            </div>

            <div className="receipt-divider" />

            {/* Reason */}
            <div className="receipt-section">
              <div className="receipt-field-block">
                <span className="receipt-label">Alasan:</span>
                <p className="receipt-reason">{printData.reason}</p>
              </div>
            </div>

            <div className="receipt-divider" />

            {/* Issuer Information */}
            <div className="receipt-section">
              <div className="receipt-field-block">
                <span className="receipt-label">Guru BK:</span>
                <p className="receipt-issuer">{printData.issuedBy}</p>
              </div>
              <div className="receipt-signature-space">
                <p className="receipt-signature-label">[Tanda Tangan Digital]</p>
              </div>
            </div>

            <div className="receipt-divider" />

            {/* Footer */}
            <div className="receipt-footer">
              <p>Dicetak: {printData.issuedAt}</p>
              <p>Ref: {printData.id.substring(0, 12)}</p>
            </div>
          </div>
        </div>

        {/* Footer Buttons - Hidden when printing */}
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

      {/* Thermal Printer Styles */}
      <style jsx global>{`
        /* Screen Styles */
        .receipt-container {
          font-family: 'Courier New', Courier, monospace;
          font-size: 10pt;
          line-height: 1.4;
          color: #000;
        }

        .receipt-content {
          max-width: 302px; /* 80mm at 96dpi */
          margin: 0 auto;
        }

        .receipt-logo {
          display: flex;
          justify-content: center;
          margin-bottom: 12px;
        }

        .receipt-header {
          text-align: center;
          margin-bottom: 12px;
        }

        .receipt-school-name {
          font-size: 14pt;
          font-weight: bold;
          margin-bottom: 4px;
          text-transform: uppercase;
        }

        .receipt-school-address {
          font-size: 9pt;
          margin-bottom: 2px;
        }

        .receipt-school-phone {
          font-size: 9pt;
        }

        .receipt-divider {
          border-top: 1px dashed #000;
          margin: 12px 0;
        }

        .receipt-title {
          text-align: center;
          margin-bottom: 12px;
        }

        .receipt-title h2 {
          font-size: 12pt;
          font-weight: bold;
          margin-bottom: 4px;
        }

        .receipt-number {
          font-size: 9pt;
        }

        .receipt-section {
          margin-bottom: 8px;
        }

        .receipt-field {
          display: flex;
          gap: 4px;
          margin-bottom: 4px;
          font-size: 10pt;
        }

        .receipt-label {
          min-width: 60px;
          font-weight: bold;
          flex-shrink: 0;
        }

        .receipt-value {
          flex: 1;
          word-wrap: break-word;
        }

        .receipt-field-block {
          margin-bottom: 8px;
        }

        .receipt-reason {
          margin-top: 4px;
          font-size: 10pt;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .receipt-issuer {
          margin-top: 4px;
          font-size: 10pt;
          font-weight: bold;
        }

        .receipt-signature-space {
          margin-top: 12px;
          text-align: center;
        }

        .receipt-signature-label {
          font-size: 9pt;
          font-style: italic;
          color: #666;
        }

        .receipt-footer {
          text-align: center;
          font-size: 8pt;
          color: #666;
        }

        .receipt-footer p {
          margin-bottom: 2px;
        }

        /* Print Styles */
        @media print {
          body * {
            visibility: hidden;
          }

          .receipt-container,
          .receipt-container * {
            visibility: visible;
          }

          .receipt-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            padding: 8px;
            font-size: 10pt;
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

          .max-w-md {
            max-width: 100% !important;
          }

          .overflow-auto {
            overflow: visible !important;
          }

          @page {
            size: 80mm auto;
            margin: 0;
          }

          .receipt-content {
            max-width: 100%;
          }

          .receipt-logo img {
            width: 60px !important;
            height: 60px !important;
          }

          .receipt-school-name {
            font-size: 14pt;
          }

          .receipt-school-address,
          .receipt-school-phone {
            font-size: 9pt;
          }

          .receipt-title h2 {
            font-size: 12pt;
          }

          .receipt-number {
            font-size: 9pt;
          }

          .receipt-field,
          .receipt-reason,
          .receipt-issuer {
            font-size: 10pt;
          }

          .receipt-signature-label {
            font-size: 9pt;
          }

          .receipt-footer {
            font-size: 8pt;
          }

          .receipt-divider {
            border-top: 1px dashed #000;
            margin: 8px 0;
          }
        }
      `}</style>
    </div>
  );
}
