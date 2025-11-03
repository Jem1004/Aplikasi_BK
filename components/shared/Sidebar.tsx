"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  Calendar,
  ClipboardList,
  GraduationCap,
  UserCheck,
  AlertCircle,
  FileCheck,
  X,
  Home,
  BookMarked,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Book,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

interface SidebarProps {
  role: string;
  isOpen?: boolean;
  onClose?: () => void;
  isMinimized?: boolean;
  onToggleMinimized?: () => void;
}

const navigationByRole: Record<string, NavItem[]> = {
  ADMIN: [
    {
      title: "Dashboard",
      href: "/admin",
      icon: Home,
      description: "Ringkasan sistem",
    },
    {
      title: "Manajemen Pengguna",
      href: "/admin/users",
      icon: Users,
      description: "Kelola akun pengguna",
    },
    {
      title: "Data Master",
      href: "/admin/master-data",
      icon: BookMarked,
      description: "Data induk sekolah",
    },
    {
      title: "Mapping",
      href: "/admin/mappings",
      icon: UserCheck,
      description: "Penugasan staf",
    },
    {
      title: "Audit Logs",
      href: "/admin/audit-logs",
      icon: ShieldCheck,
      description: "Log aktivitas sistem",
    },
  ],
  GURU_BK: [
    {
      title: "Dashboard",
      href: "/guru-bk",
      icon: Home,
      description: "Ringkasan aktivitas",
    },
    {
      title: "Siswa",
      href: "/guru-bk/students",
      icon: GraduationCap,
      description: "Data siswa bimbingan",
    },
    {
      title: "Pelanggaran",
      href: "/guru-bk/violations",
      icon: AlertCircle,
      description: "Catatan pelanggaran",
    },
    {
      title: "Jurnal Konseling",
      href: "/guru-bk/journals",
      icon: FileText,
      description: "Catatan pribadi",
    },
    {
      title: "Izin",
      href: "/guru-bk/permissions",
      icon: FileCheck,
      description: "Surat izin siswa",
    },
    {
      title: "Janji Temu",
      href: "/guru-bk/appointments",
      icon: Calendar,
      description: "Jadwal konseling",
    },
  ],
  WALI_KELAS: [
    {
      title: "Dashboard",
      href: "/wali-kelas",
      icon: Home,
      description: "Ringkasan kelas",
    },
    {
      title: "Siswa Kelas",
      href: "/wali-kelas/students",
      icon: GraduationCap,
      description: "Data siswa kelas",
    },
  ],
  SISWA: [
    {
      title: "Dashboard",
      href: "/siswa",
      icon: Home,
      description: "Ringkasan pribadi",
    },
    {
      title: "Profil",
      href: "/siswa/profile",
      icon: Users,
      description: "Data pribadi",
    },
    {
      title: "Pelanggaran",
      href: "/siswa/violations",
      icon: AlertCircle,
      description: "Riwayat pelanggaran",
    },
    {
      title: "Izin",
      href: "/siswa/permissions",
      icon: FileCheck,
      description: "Status izin",
    },
    {
      title: "Janji Temu",
      href: "/siswa/appointments",
      icon: Calendar,
      description: "Jadwal konseling",
    },
  ],
};

export function Sidebar({ role, isOpen = true, onClose, isMinimized = false, onToggleMinimized }: SidebarProps) {
  const pathname = usePathname();
  const navItems = navigationByRole[role] || [];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden animate-in fade-in duration-200"
          onClick={onClose}
          role="presentation"
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-full border-r border-gray-200/60 bg-white/95 backdrop-blur-sm transition-all duration-300 ease-in-out md:relative md:z-20 md:h-full md:translate-x-0",
          isMinimized ? "w-16" : "w-72",
          isOpen ? "translate-x-0 shadow-2xl md:shadow-lg" : "-translate-x-full"
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Mobile header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200/60 bg-white/80 backdrop-blur-sm px-4 md:hidden">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <Home className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Menu Navigasi</h2>
              <p className="text-xs text-gray-500">Kelola aplikasi</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] hover:bg-gray-100 transition-colors"
            aria-label="Tutup menu navigasi"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Tutup menu navigasi</span>
          </Button>
        </div>

        {/* Desktop branding area - only on desktop */}
        <div className="hidden md:flex items-center justify-between px-3 py-4 border-b border-gray-200/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md transition-transform hover:scale-105 duration-200">
              <Book className="h-5 w-5 text-white" />
            </div>
            {!isMinimized && (
              <div className="flex flex-col">
                <h2 className="text-sm font-semibold text-gray-900">Aplikasi BK</h2>
                <p className="text-xs text-gray-500">Sekolah Indonesia</p>
              </div>
            )}
          </div>

          {/* Minimize toggle button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleMinimized}
            className="min-w-[36px] min-h-[36px] hover:bg-gray-100 transition-colors"
            aria-label={isMinimized ? "Perluas sidebar" : "Minimalis sidebar"}
          >
            {isMinimized ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
            <span className="sr-only">
              {isMinimized ? "Perluas sidebar" : "Minimalis sidebar"}
            </span>
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <nav className={cn("flex flex-col gap-1", isMinimized ? "p-2" : "p-4 md:p-6")} aria-label="Primary navigation">
            {/* Navigation items */}
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  aria-current={isActive ? "page" : undefined}
                  className="group"
                >
                  <div
                    className={cn(
                      "relative flex items-center rounded-xl text-sm font-medium transition-all duration-200 ease-in-out",
                      "hover:scale-[1.02] active:scale-[0.98]",
                      "animate-in slide-in-from-left duration-300",
                      isMinimized ? "px-2 py-3 justify-center" : "gap-4 px-4 py-3",
                      `delay-${index * 50}`,
                      isActive
                        ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    {/* Background shine effect on hover */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500 opacity-0 group-hover:opacity-100" />

                    {/* Icon */}
                    <div
                      className={cn(
                        "flex items-center justify-center rounded-lg transition-all duration-200",
                        isMinimized ? "h-10 w-10" : "h-10 w-10",
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-gray-100 text-gray-600 group-hover:bg-gray-200 group-hover:text-gray-800"
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>

                    {/* Content - hidden when minimized */}
                    {!isMinimized && (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="truncate font-semibold">{item.title}</p>
                          {isActive && (
                            <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                          )}
                        </div>
                        {item.description && (
                          <p
                            className={cn(
                              "text-xs truncate mt-0.5",
                              isActive ? "text-white/80" : "text-gray-500"
                            )}
                          >
                            {item.description}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className={cn("hidden md:block border-t border-gray-200/30 bg-white/50 backdrop-blur-sm", isMinimized ? "px-2 py-3" : "px-6 py-4")}>
          <div className={cn("flex items-center", isMinimized ? "justify-center" : "justify-between")}>
            {!isMinimized && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-gray-600 font-medium">Sistem Online</span>
              </div>
            )}
            <div className="text-xs text-gray-400">
              v1.0.0
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
