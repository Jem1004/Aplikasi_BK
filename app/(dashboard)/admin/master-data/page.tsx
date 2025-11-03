import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, School, AlertTriangle, Building2 } from 'lucide-react';

export default function MasterDataPage() {
  const masterDataSections = [
    {
      title: 'Informasi Sekolah',
      description: 'Kelola informasi dan logo sekolah',
      icon: Building2,
      href: '/admin/master-data/school-info',
      color: 'text-purple-600',
    },
    {
      title: 'Tahun Ajaran',
      description: 'Kelola data tahun ajaran sekolah',
      icon: Calendar,
      href: '/admin/master-data/academic-years',
      color: 'text-blue-600',
    },
    {
      title: 'Kelas',
      description: 'Kelola data kelas dan tingkatan',
      icon: School,
      href: '/admin/master-data/classes',
      color: 'text-green-600',
    },
    {
      title: 'Jenis Pelanggaran & Prestasi',
      description: 'Kelola jenis pelanggaran dan prestasi siswa',
      icon: AlertTriangle,
      href: '/admin/master-data/violation-types',
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Data Master</h1>
        <p className="text-muted-foreground">
          Kelola data master sistem Bimbingan Konseling
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {masterDataSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.href} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gray-100 ${section.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                  </div>
                </div>
                <CardDescription className="mt-2">
                  {section.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={section.href}>
                  <Button className="w-full">Kelola</Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
