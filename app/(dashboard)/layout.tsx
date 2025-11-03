import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { DashboardLayoutWrapper } from "@/components/shared/DashboardLayoutWrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <ErrorBoundary>
      <DashboardLayoutWrapper role={session.user.role}>
        {children}
      </DashboardLayoutWrapper>
    </ErrorBoundary>
  );
}
