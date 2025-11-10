import { PrismaClient, ViolationCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create School Info (only if not exists)
  console.log('Creating school info...');
  const existingSchool = await prisma.schoolInfo.findFirst();
  let schoolInfo;
  if (!existingSchool) {
    schoolInfo = await prisma.schoolInfo.create({
      data: {
        name: 'SMA Negeri 1 Jakarta',
        address: 'Jl. Sudirman No. 123, Jakarta Pusat, DKI Jakarta 10110',
        phone: '021-5551234',
        email: 'info@sman1jakarta.sch.id',
        website: 'https://www.sman1jakarta.sch.id',
        principalName: 'Dr. Ahmad Suryadi, M.Pd',
        principalNip: '196501011990031001'
      }
    });
    console.log(`✓ Created school info: ${schoolInfo.name}`);
  } else {
    schoolInfo = existingSchool;
    console.log(`✓ School info already exists: ${schoolInfo.name}`);
  }

  // Create Academic Year (only if not exists)
  console.log('Creating academic year...');
  const existingAcademicYear = await prisma.academicYear.findFirst({
    where: { name: '2024/2025' }
  });
  let academicYear;
  if (!existingAcademicYear) {
    academicYear = await prisma.academicYear.create({
      data: {
        name: '2024/2025',
        startDate: new Date('2024-07-01'),
        endDate: new Date('2025-06-30'),
        isActive: true
      }
    });
    console.log(`✓ Created academic year: ${academicYear.name}`);
  } else {
    academicYear = existingAcademicYear;
    console.log(`✓ Academic year already exists: ${academicYear.name}`);
  }

  // Create Admin User
  console.log('Creating admin user...');
  const adminPasswordHash = await bcrypt.hash('admin123', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@school.com' },
    update: {
      passwordHash: adminPasswordHash
    },
    create: {
      email: 'admin@school.com',
      username: 'admin',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      fullName: 'Administrator',
      isActive: true
    }
  });
  console.log(`✓ Admin user: ${adminUser.email}`);

  // Create Guru BK User
  console.log('Creating Guru BK user...');
  const guruBkUser = await prisma.user.upsert({
    where: { email: 'gurubk@school.com' },
    update: {},
    create: {
      email: 'gurubk@school.com',
      username: 'gurubk',
      passwordHash: await bcrypt.hash('gurubk123', 12),
      role: 'GURU_BK',
      fullName: 'Ibu Siti Nurhaliza',
      phone: '081234567890',
      isActive: true
    }
  });

  const guruBk = await prisma.teacher.upsert({
    where: { userId: guruBkUser.id },
    update: {},
    create: {
      userId: guruBkUser.id,
      nip: '198501012010012001',
      specialization: 'Bimbingan Konseling'
    }
  });
  console.log(`✓ Guru BK: ${guruBkUser.fullName}`);

  // Create Wali Kelas User
  console.log('Creating Wali Kelas user...');
  const waliKelasUser = await prisma.user.upsert({
    where: { email: 'walikelas@school.com' },
    update: {},
    create: {
      email: 'walikelas@school.com',
      username: 'walikelas',
      passwordHash: await bcrypt.hash('walikelas123', 12),
      role: 'WALI_KELAS',
      fullName: 'Bapak Ahmad Dahlan',
      phone: '081234567891',
      isActive: true
    }
  });

  const waliKelas = await prisma.teacher.upsert({
    where: { userId: waliKelasUser.id },
    update: {},
    create: {
      userId: waliKelasUser.id,
      nip: '198701012012011001',
      specialization: 'Matematika'
    }
  });
  console.log(`✓ Wali Kelas: ${waliKelasUser.fullName}`);

  // Create Classes
  console.log('Creating classes...');
  const class10A = await prisma.class.upsert({
    where: {
      name_academicYearId: {
        name: '10 IPA 1',
        academicYearId: academicYear.id
      }
    },
    update: {},
    create: {
      name: '10 IPA 1',
      gradeLevel: 10,
      academicYearId: academicYear.id
    }
  });

  const class10B = await prisma.class.upsert({
    where: {
      name_academicYearId: {
        name: '10 IPA 2',
        academicYearId: academicYear.id
      }
    },
    update: {},
    create: {
      name: '10 IPA 2',
      gradeLevel: 10,
      academicYearId: academicYear.id
    }
  });

  const class11A = await prisma.class.upsert({
    where: {
      name_academicYearId: {
        name: '11 IPA 1',
        academicYearId: academicYear.id
      }
    },
    update: {},
    create: {
      name: '11 IPA 1',
      gradeLevel: 11,
      academicYearId: academicYear.id
    }
  });
  console.log(`✓ Created/updated ${3} classes`);

  // Assign Wali Kelas to Class
  console.log('Assigning homeroom teacher...');
  await prisma.classHomeroomTeacher.upsert({
    where: {
      classId_academicYearId: {
        classId: class10A.id,
        academicYearId: academicYear.id
      }
    },
    update: {},
    create: {
      classId: class10A.id,
      teacherId: waliKelas.id,
      academicYearId: academicYear.id
    }
  });
  console.log(`✓ Assigned ${waliKelasUser.fullName} to ${class10A.name}`);

  // Create Student Users
  console.log('Creating student users...');
  const studentData = [
    {
      email: 'andi.wijaya@school.com',
      username: 'siswa001',
      fullName: 'Andi Wijaya',
      nis: '2024001',
      nisn: '0012345678',
      classId: class10A.id,
      dateOfBirth: new Date('2008-05-15'),
      address: 'Jl. Pendidikan No. 123',
      parentName: 'Bapak Wijaya',
      parentPhone: '081234567892'
    },
    {
      email: 'budi.santoso@school.com',
      username: 'siswa002',
      fullName: 'Budi Santoso',
      nis: '2024002',
      nisn: '0012345679',
      classId: class10A.id,
      dateOfBirth: new Date('2008-06-20'),
      address: 'Jl. Pendidikan No. 124',
      parentName: 'Bapak Santoso',
      parentPhone: '081234567893'
    },
    {
      email: 'citra.dewi@school.com',
      username: 'siswa003',
      fullName: 'Citra Dewi',
      nis: '2024003',
      nisn: '0012345680',
      classId: class10B.id,
      dateOfBirth: new Date('2008-07-10'),
      address: 'Jl. Pendidikan No. 125',
      parentName: 'Ibu Dewi',
      parentPhone: '081234567894'
    },
    {
      email: 'doni.pratama@school.com',
      username: 'siswa004',
      fullName: 'Doni Pratama',
      nis: '2024004',
      nisn: '0012345681',
      classId: class11A.id,
      dateOfBirth: new Date('2007-08-25'),
      address: 'Jl. Pendidikan No. 126',
      parentName: 'Bapak Pratama',
      parentPhone: '081234567895'
    }
  ];

  const students = [];
  for (const data of studentData) {
    const studentUser = await prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: {
        email: data.email,
        username: data.username,
        passwordHash: await bcrypt.hash('siswa123', 12),
        role: 'SISWA',
        fullName: data.fullName,
        isActive: true
      }
    });

    const student = await prisma.student.upsert({
      where: { userId: studentUser.id },
      update: {},
      create: {
        userId: studentUser.id,
        nis: data.nis,
        nisn: data.nisn,
        classId: data.classId,
        dateOfBirth: data.dateOfBirth,
        address: data.address,
        parentName: data.parentName,
        parentPhone: data.parentPhone
      }
    });

    students.push(student);
  }
  console.log(`✓ Created/updated ${students.length} students`);

  // Assign Students to Counselor
  console.log('Assigning students to counselor...');
  for (const student of students) {
    const existingAssignment = await prisma.studentCounselorAssignment.findFirst({
      where: {
        studentId: student.id,
        academicYearId: academicYear.id
      }
    });

    if (!existingAssignment) {
      await prisma.studentCounselorAssignment.create({
        data: {
          studentId: student.id,
          counselorId: guruBk.id,
          academicYearId: academicYear.id
        }
      });
    }
  }
  console.log(`✓ Assigned ${students.length} students to ${guruBkUser.fullName}`);

  // Create Violation Types
  console.log('Creating violation types...');
  const violationTypesData = [
    // Pelanggaran - Kedisiplinan
    {
      code: 'P001',
      name: 'Terlambat masuk kelas',
      description: 'Datang terlambat ke sekolah atau kelas',
      points: 5,
      type: 'PELANGGARAN',
      category: 'Kedisiplinan',
      isActive: true
    },
    {
      code: 'P002',
      name: 'Tidak memakai seragam lengkap',
      description: 'Tidak memakai atribut seragam sekolah dengan lengkap',
      points: 10,
      type: 'PELANGGARAN',
      category: 'Kedisiplinan',
      isActive: true
    },
    {
      code: 'P003',
      name: 'Bolos sekolah',
      description: 'Tidak hadir tanpa keterangan yang jelas',
      points: 25,
      type: 'PELANGGARAN',
      category: 'Kedisiplinan',
      isActive: true
    },
    // Pelanggaran - Akademik
    {
      code: 'P004',
      name: 'Tidak mengerjakan tugas',
      description: 'Tidak mengumpulkan tugas tepat waktu',
      points: 10,
      type: 'PELANGGARAN',
      category: 'Akademik',
      isActive: true
    },
    {
      code: 'P005',
      name: 'Mencontek saat ujian',
      description: 'Melakukan kecurangan saat ujian atau ulangan',
      points: 30,
      type: 'PELANGGARAN',
      category: 'Akademik',
      isActive: true
    },
    // Pelanggaran - Perilaku
    {
      code: 'P006',
      name: 'Berkelahi',
      description: 'Terlibat perkelahian dengan siswa lain',
      points: 50,
      type: 'PELANGGARAN',
      category: 'Perilaku',
      isActive: true
    },
    {
      code: 'P007',
      name: 'Merokok di area sekolah',
      description: 'Merokok atau membawa rokok di lingkungan sekolah',
      points: 40,
      type: 'PELANGGARAN',
      category: 'Perilaku',
      isActive: true
    },
    {
      code: 'P008',
      name: 'Membully teman',
      description: 'Melakukan perundungan terhadap siswa lain',
      points: 45,
      type: 'PELANGGARAN',
      category: 'Perilaku',
      isActive: true
    },
    // Prestasi - Akademik
    {
      code: 'PR001',
      name: 'Juara lomba akademik',
      description: 'Memenangkan lomba akademik tingkat sekolah atau lebih tinggi',
      points: -20,
      type: 'PRESTASI',
      category: 'Prestasi Akademik',
      isActive: true
    },
    {
      code: 'PR002',
      name: 'Nilai sempurna ujian',
      description: 'Mendapatkan nilai sempurna pada ujian',
      points: -10,
      type: 'PRESTASI',
      category: 'Prestasi Akademik',
      isActive: true
    },
    // Prestasi - Non-Akademik
    {
      code: 'PR003',
      name: 'Juara lomba olahraga',
      description: 'Memenangkan lomba olahraga tingkat sekolah atau lebih tinggi',
      points: -20,
      type: 'PRESTASI',
      category: 'Prestasi Non-Akademik',
      isActive: true
    },
    {
      code: 'PR004',
      name: 'Juara lomba seni',
      description: 'Memenangkan lomba seni tingkat sekolah atau lebih tinggi',
      points: -20,
      type: 'PRESTASI',
      category: 'Prestasi Non-Akademik',
      isActive: true
    },
    // Prestasi - Karakter
    {
      code: 'PR005',
      name: 'Membantu teman',
      description: 'Membantu teman yang kesulitan dalam belajar atau masalah lain',
      points: -5,
      type: 'PRESTASI',
      category: 'Karakter Positif',
      isActive: true
    },
    {
      code: 'PR006',
      name: 'Siswa teladan',
      description: 'Terpilih sebagai siswa teladan kelas atau sekolah',
      points: -30,
      type: 'PRESTASI',
      category: 'Karakter Positif',
      isActive: true
    }
  ];

  let createdViolationTypes = 0;
  for (const violationType of violationTypesData) {
    const existing = await prisma.violationType.findUnique({
      where: { code: violationType.code }
    });

    if (!existing) {
      await prisma.violationType.create({
        data: {
          ...violationType,
          type: violationType.type as ViolationCategory
        }
      });
      createdViolationTypes++;
    }
  }
  console.log(`✓ Created ${createdViolationTypes} new violation types`);

  console.log('\n✅ Database seeding completed successfully!');
  console.log('\n📝 Login credentials:');
  console.log('   Admin:');
  console.log('   - Email: admin@school.com');
  console.log('   - Password: admin123');
  console.log('\n   Guru BK:');
  console.log('   - Email: gurubk@school.com');
  console.log('   - Password: gurubk123');
  console.log('\n   Wali Kelas:');
  console.log('   - Email: walikelas@school.com');
  console.log('   - Password: walikelas123');
  console.log('\n   Siswa (all students):');
  console.log('   - Email: [andi.wijaya|budi.santoso|citra.dewi|doni.pratama]@school.com');
  console.log('   - Password: siswa123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
