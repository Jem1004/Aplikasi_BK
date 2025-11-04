import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { auth } from '@/lib/auth/auth';

export async function GET() {
  try {
    // Check authorization
    const session = await auth();

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create template data
    const templateData = [
      {
        email: 'siswa1@example.com',
        username: 'siswa001',
        fullName: 'Contoh Nama Siswa 1',
        nis: '2024001',
        nisn: '0012345678',
        className: '10 IPA 1',
        dateOfBirth: '2008-05-15',
        address: 'Jl. Contoh No. 123',
        parentName: 'Nama Orang Tua',
        parentPhone: '081234567890',
      },
      {
        email: 'siswa2@example.com',
        username: 'siswa002',
        fullName: 'Contoh Nama Siswa 2',
        nis: '2024002',
        nisn: '0012345679',
        className: '10 IPA 2',
        dateOfBirth: '2008-06-20',
        address: 'Jl. Contoh No. 124',
        parentName: 'Nama Orang Tua',
        parentPhone: '081234567891',
      },
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 25 }, // email
      { wch: 15 }, // username
      { wch: 25 }, // fullName
      { wch: 12 }, // nis
      { wch: 15 }, // nisn
      { wch: 15 }, // className
      { wch: 15 }, // dateOfBirth
      { wch: 30 }, // address
      { wch: 20 }, // parentName
      { wch: 15 }, // parentPhone
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Import Siswa');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="template-import-siswa.xlsx"',
      },
    });
  } catch (error) {
    console.error('Template download error:', error);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}
