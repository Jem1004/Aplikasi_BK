import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getViolationTypes } from '@/lib/actions/admin/master-data';
import { ViolationTypeActions } from '@/components/admin/ViolationTypeActions';

export const dynamic = 'force-dynamic';

// Cache violation types data for 5 minutes (300 seconds)
// Violation types change infrequently, so longer cache is appropriate
export const revalidate = 300;

export default async function ViolationTypesPage() {
  const result = await getViolationTypes();
  const violationTypes = result.success ? result.data : [];

  // Group by type and category
  const grouped = (violationTypes || []).reduce((acc: any, item: any) => {
    const type = item.type;
    if (!acc[type]) {
      acc[type] = {};
    }
    const category = item.category || 'Lainnya';
    if (!acc[type][category]) {
      acc[type][category] = [];
    }
    acc[type][category].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Jenis Pelanggaran & Prestasi</h1>
          <p className="text-muted-foreground">Kelola data jenis pelanggaran dan prestasi</p>
        </div>
        <Link href="/admin/master-data/violation-types/new">
          <Button>Tambah Jenis</Button>
        </Link>
      </div>

      {violationTypes && violationTypes.length > 0 ? (
        <div className="space-y-8">
          {/* Pelanggaran Section */}
          {grouped.PELANGGARAN && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-semibold">Pelanggaran</h2>
                <Badge variant="destructive">
                  {Object.values(grouped.PELANGGARAN).flat().length} item
                </Badge>
              </div>
              
              {Object.entries(grouped.PELANGGARAN).map(([category, items]: [string, any]) => (
                <div key={category} className="space-y-2">
                  <h3 className="text-lg font-medium text-muted-foreground">{category}</h3>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((item: any) => (
                      <Card key={item.id} className={!item.isActive ? 'opacity-60' : ''}>
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono text-xs">
                                  {item.code}
                                </Badge>
                                {!item.isActive && (
                                  <Badge variant="secondary" className="text-xs">
                                    Nonaktif
                                  </Badge>
                                )}
                              </div>
                              <CardTitle className="mt-2 text-base">{item.name}</CardTitle>
                              {item.description && (
                                <CardDescription className="mt-1 text-xs line-clamp-2">
                                  {item.description}
                                </CardDescription>
                              )}
                            </div>
                            <ViolationTypeActions violationType={item} />
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive" className="font-semibold">
                              {item.points} poin
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Prestasi Section */}
          {grouped.PRESTASI && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-semibold">Prestasi</h2>
                <Badge className="bg-green-600">
                  {Object.values(grouped.PRESTASI).flat().length} item
                </Badge>
              </div>
              
              {Object.entries(grouped.PRESTASI).map(([category, items]: [string, any]) => (
                <div key={category} className="space-y-2">
                  <h3 className="text-lg font-medium text-muted-foreground">{category}</h3>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((item: any) => (
                      <Card key={item.id} className={!item.isActive ? 'opacity-60' : ''}>
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono text-xs">
                                  {item.code}
                                </Badge>
                                {!item.isActive && (
                                  <Badge variant="secondary" className="text-xs">
                                    Nonaktif
                                  </Badge>
                                )}
                              </div>
                              <CardTitle className="mt-2 text-base">{item.name}</CardTitle>
                              {item.description && (
                                <CardDescription className="mt-1 text-xs line-clamp-2">
                                  {item.description}
                                </CardDescription>
                              )}
                            </div>
                            <ViolationTypeActions violationType={item} />
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-600 font-semibold">
                              +{item.points} poin
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">Belum ada jenis pelanggaran atau prestasi</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
