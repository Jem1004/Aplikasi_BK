import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { getAuditLogs } from '@/lib/actions/admin/audit-logs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const AuditLogList = dynamic(
  () => import('@/components/admin/AuditLogList').then(mod => ({ default: mod.AuditLogList })),
  {
    loading: () => (
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }
);

// No caching for audit logs - always fetch fresh data
// Audit logs need to be real-time for security monitoring
export const revalidate = 0;

export const metadata = {
  title: 'Audit Logs - Admin',
  description: 'View system audit logs',
};

interface PageProps {
  searchParams: Promise<{
    entityType?: string;
    entityId?: string;
    action?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  }>;
}

export default async function AuditLogsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;

  const result = await getAuditLogs({
    entityType: params.entityType,
    entityId: params.entityId,
    action: params.action,
    userId: params.userId,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    page,
    pageSize: 50,
  });

  if (!result.success) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Audit Logs</h1>
        <p className="text-muted-foreground mt-2">
          View and search system audit logs
        </p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <AuditLogList
          logs={result.data?.logs || []}
          total={result.data?.total || 0}
          page={result.data?.page || 1}
          pageSize={result.data?.pageSize || 50}
          totalPages={result.data?.totalPages || 1}
        />
      </Suspense>
    </div>
  );
}
