import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { DashboardLayout as DashboardLayoutComponent } from "@/components/shared/DashboardLayout";
import { Navbar } from "@/components/shared/Navbar";

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
    <DashboardLayoutComponent role={session.user.role} navbar={<Navbar />}>
      {children}
    </DashboardLayoutComponent>
  );
}
