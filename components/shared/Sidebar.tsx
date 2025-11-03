"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  Calendar,
  ClipboardList,
  Settings,
  GraduationCap,
  UserCheck,
  AlertCircle,
  FileCheck,
  X,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarProps {
  role: string;
  isOpen?: boolean;
  onClose?: () => void;
}

const navigationByRole: Record<string, NavItem[]> = {
  ADMIN: [
    {
      title: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      title: "Manajemen Pengguna",
      href: "/admin/users",
      icon: Users,
    },
    {
      title: "Data Master",
      href: "/admin/master-data",
      icon: BookOpen,
    },
    {
      title: "Mapping",
      href: "/admin/mappings",
      icon: UserCheck,
    },
    {
      title: "Audit Logs",
      href: "/admin/audit-logs",
      icon: ClipboardList,
    },
  ],
  GURU_BK: [
    {
      title: "Dashboard",
      href: "/guru-bk",
      icon: LayoutDashboard,
    },
    {
      title: "Siswa",
      href: "/guru-bk/students",
      icon: GraduationCap,
    },
    {
      title: "Pelanggaran",
      href: "/guru-bk/violations",
      icon: AlertCircle,
    },
    {
      title: "Jurnal Konseling",
      href: "/guru-bk/journals",
      icon: FileText,
    },
    {
      title: "Izin",
      href: "/guru-bk/permissions",
      icon: FileCheck,
    },
    {
      title: "Janji Temu",
      href: "/guru-bk/appointments",
      icon: Calendar,
    },
  ],
  WALI_KELAS: [
    {
      title: "Dashboard",
      href: "/wali-kelas",
      icon: LayoutDashboard,
    },
    {
      title: "Siswa Kelas",
      href: "/wali-kelas/students",
      icon: GraduationCap,
    },
  ],
  SISWA: [
    {
      title: "Dashboard",
      href: "/siswa",
      icon: LayoutDashboard,
    },
    {
      title: "Profil",
      href: "/siswa/profile",
      icon: Users,
    },
    {
      title: "Pelanggaran",
      href: "/siswa/violations",
      icon: AlertCircle,
    },
    {
      title: "Izin",
      href: "/siswa/permissions",
      icon: FileCheck,
    },
    {
      title: "Janji Temu",
      href: "/siswa/appointments",
      icon: Calendar,
    },
  ],
};

export function Sidebar({ role, isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const navItems = navigationByRole[role] || [];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
          role="presentation"
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 border-r bg-white transition-transform duration-300 md:sticky md:top-16 md:z-30 md:h-[calc(100vh-4rem)] md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Mobile close button */}
        <div className="flex h-16 items-center justify-between border-b px-4 md:hidden">
          <h2 className="text-lg font-semibold text-primary-600">Menu</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="min-w-[44px] min-h-[44px]"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close menu</span>
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-4rem)] md:h-full">
          <nav className="flex flex-col gap-2 p-4" aria-label="Primary navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  onClick={onClose}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 min-h-[44px]",
                      isActive
                        ? "bg-primary-500 text-white hover:bg-primary-600"
                        : "hover:bg-primary-50"
                    )}
                    aria-label={item.title}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    <span>{item.title}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
      </aside>
    </>
  );
}
