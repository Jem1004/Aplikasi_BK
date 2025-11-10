"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users,
  FileText,
  Calendar,
  GraduationCap,
  UserCheck,
  AlertCircle,
  FileCheck,
  X,
  Home,
  BookMarked,
  ShieldCheck,
  Menu,
  LogOut,
  ChevronLeft,
  Settings,
  BookOpen,
  School,
  Trash2,
} from "lucide-react";

interface SchoolInfo {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  principalName: string;
  principalNip: string;
  logoPath?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
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
    { title: "Dashboard", href: "/admin", icon: Home },
    { title: "Pengguna", href: "/admin/users", icon: Users },
    { title: "Data Master", href: "/admin/master-data", icon: BookMarked },
    { title: "Mapping", href: "/admin/mappings", icon: UserCheck },
    { title: "Audit Logs", href: "/admin/audit-logs", icon: ShieldCheck },
    { title: "Pengaturan", href: "/admin/settings", icon: Settings },
  ],
  GURU_BK: [
    { title: "Dashboard", href: "/guru-bk", icon: Home },
    { title: "Siswa", href: "/guru-bk/students", icon: GraduationCap },
    { title: "Pelanggaran", href: "/guru-bk/violations", icon: AlertCircle },
    { title: "Jurnal", href: "/guru-bk/journals", icon: FileText },
    { title: "Izin", href: "/guru-bk/permissions", icon: FileCheck },
    { title: "Janji Temu", href: "/guru-bk/appointments", icon: Calendar },
    { title: "Pengaturan", href: "/guru-bk/settings", icon: Settings },
  ],
  WALI_KELAS: [
    { title: "Dashboard", href: "/wali-kelas", icon: Home },
    { title: "Siswa Kelas", href: "/wali-kelas/students", icon: GraduationCap },
    { title: "Pengaturan", href: "/wali-kelas/settings", icon: Settings },
  ],
  SISWA: [
    { title: "Dashboard", href: "/siswa", icon: Home },
    { title: "Profil", href: "/siswa/profile", icon: Users },
    { title: "Pelanggaran", href: "/siswa/violations", icon: AlertCircle },
    { title: "Izin", href: "/siswa/permissions", icon: FileCheck },
    { title: "Janji Temu", href: "/siswa/appointments", icon: Calendar },
  ],
};

export function Sidebar({
  role,
  isOpen = true,
  onClose,
  isMinimized = false,
  onToggleMinimized,
}: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navItems = navigationByRole[role] || [];
  const sidebarRef = useRef<HTMLElement>(null);

  // Fetch school information
  useEffect(() => {
    const fetchSchoolInfo = async () => {
      try {
        const response = await fetch('/api/school-info', {
          credentials: 'include', // Ensure cookies are sent with the request
        });

        if (response.ok) {
          const data = await response.json();
          setSchoolInfo(data);
        } else if (response.status === 401 || response.redirected) {
          // Handle authentication errors or redirects gracefully
          console.log('School info requires authentication or redirect detected - using fallback');
        } else {
          console.error('Failed to fetch school info:', response.status, response.statusText);
        }
      } catch (error) {
        // Don't log JSON parsing errors as they're expected when authentication fails
        if (error instanceof SyntaxError && error.message.includes('JSON')) {
          console.log('School info fetch returned non-JSON response, likely due to authentication');
        } else {
          console.error('Failed to fetch school info:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchoolInfo();
  }, []);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile Backdrop with improved animation */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-300 ease-in-out"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar with green system colors */}
      <aside
        ref={sidebarRef}
        className={cn(
          "fixed left-0 top-0 z-50 h-screen flex flex-col bg-gradient-to-b from-green-50 to-white border-r border-green-200/60 transition-all duration-300 ease-in-out shadow-xl",
          // Mobile
          "w-80",
          isOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop
          "md:relative md:translate-x-0 md:shadow-lg",
          isMinimized ? "md:w-20" : "md:w-72"
        )}
      >
        {/* Header with school information and book icon */}
        <div
          className={cn(
            "flex items-center border-b border-green-200/60 transition-all duration-300 bg-gradient-to-r from-green-600 to-green-700",
            isMinimized ? "md:justify-center md:px-3 md:h-16" : "px-6 h-20"
          )}
        >
          {!isMinimized && (
            <>
              <div className="flex items-center gap-4 flex-1">
                <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/30">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-lg font-bold text-white">
                    {isLoading ? "Aplikasi BK" : (schoolInfo?.name || "Aplikasi BK")}
                  </h1>
                  <p className="text-xs text-green-100 font-medium">
                    {isLoading ? "Sistem Manajemen" : "Sistem Informasi BK"}
                  </p>
                </div>
              </div>

              {/* Desktop minimize button */}
              <button
                onClick={onToggleMinimized}
                className="hidden md:flex h-9 w-9 items-center justify-center rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50 group"
                aria-label={isMinimized ? "Perluas sidebar" : "Minimize sidebar"}
                title={`${isMinimized ? "Perluas sidebar" : "Minimize sidebar"} (Ctrl/Cmd+M)`}
              >
                <ChevronLeft className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  isMinimized && "rotate-180"
                )} />
              </button>

              {/* Mobile close button */}
              <button
                onClick={onClose}
                className="md:hidden h-9 w-9 flex items-center justify-center rounded-xl hover:bg-white/20 text-white/80 transition-all duration-200 hover:scale-105"
              >
                <X className="h-5 w-5" />
              </button>
            </>
          )}

          {isMinimized && (
            <button
              onClick={onToggleMinimized}
              className="hidden md:flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 transition-all duration-200 hover:scale-105 shadow-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 group"
              aria-label="Perluas sidebar"
              title="Perluas sidebar (Ctrl/Cmd+M)"
            >
              <BookOpen className="h-6 w-6 text-white" />
            </button>
          )}
        </div>

        {/* Navigation with improved styling */}
        <ScrollArea className="flex-1 py-6">
          <nav className={cn("space-y-2", isMinimized ? "md:px-2" : "px-4")}>
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <div
                  key={item.href}
                  className={cn(
                    "relative",
                    isMinimized && "md:flex md:justify-center"
                  )}
                >
                  {/* Active indicator line */}
                  {isActive && !isMinimized && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-green-600 to-green-700 rounded-r-full" />
                  )}

                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "group flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 relative overflow-hidden",
                      isMinimized && "md:justify-center md:px-0 md:w-16 md:h-16 md:mx-auto",
                      isActive
                        ? "bg-gradient-to-r from-green-50 to-green-100 text-green-700 shadow-sm border border-green-200/50"
                        : "text-gray-600 hover:bg-green-50 hover:text-green-700 hover:scale-[1.02] hover:shadow-sm"
                    )}
                    title={isMinimized ? item.title : undefined}
                    style={{
                      animationDelay: `${index * 50}ms`
                    }}
                  >
                    {/* Background effect on hover */}
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-r from-green-500/5 to-green-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                      isActive && "opacity-100"
                    )} />

                    <Icon className={cn(
                      "h-5 w-5 flex-shrink-0 relative z-10 transition-colors duration-200",
                      isActive ? "text-green-600" : "text-gray-500 group-hover:text-green-600"
                    )} />

                    {!isMinimized && (
                      <span className="relative z-10">{item.title}</span>
                    )}

                    {/* Active indicator for minimized state */}
                    {isMinimized && isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-700 rounded-xl opacity-10" />
                    )}
                  </Link>
                </div>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Footer with green user section */}
        <div
          className={cn(
            "border-t border-green-200/60 p-4 bg-gradient-to-t from-green-50/50 to-transparent",
            isMinimized && "md:flex md:flex-col md:items-center md:p-3"
          )}
        >
          {/* User Info with green theme */}
          {!isMinimized && session?.user && (
            <div className="flex items-center gap-4 mb-4 p-3 rounded-xl bg-white/70 backdrop-blur-sm border border-green-200/50">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md">
                <span className="text-sm font-bold text-white">
                  {session.user.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {session.user.name}
                </p>
                <p className="text-xs text-gray-500 truncate font-medium">
                  {role === "ADMIN"
                    ? "Administrator"
                    : role === "GURU_BK"
                    ? "Guru BK"
                    : role === "WALI_KELAS"
                    ? "Wali Kelas"
                    : "Siswa"}
                </p>
              </div>
            </div>
          )}

          {isMinimized && session?.user && (
            <div className="hidden md:flex h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 items-center justify-center mb-4 shadow-md">
              <span className="text-sm font-bold text-white">
                {session.user.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2) || "U"}
              </span>
            </div>
          )}

          {/* School Info in footer when not minimized - available for all roles */}
          {!isMinimized && schoolInfo && (
            <div className="mb-4 p-3 rounded-xl bg-green-50/50 border border-green-200/30 min-h-[90px] max-h-[140px] overflow-hidden transition-all duration-300 group hover:bg-green-100/50 hover:border-green-300/50 hover:shadow-sm">
              <div className="flex items-start gap-2 mb-2">
                <School className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0 group-hover:text-green-700 transition-colors" />
                <p className="text-xs font-semibold text-green-800 leading-tight group-hover:text-green-900 transition-colors">
                  Informasi Sekolah
                </p>
              </div>
              <div className="space-y-1">
                <p
                  className="text-xs text-gray-700 font-medium leading-tight break-words hyphens-auto"
                  title={schoolInfo.name}
                >
                  {schoolInfo.name}
                </p>
                <p
                  className="text-xs text-gray-600 leading-tight break-words hyphens-auto line-clamp-2"
                  title={schoolInfo.address}
                >
                  {schoolInfo.address}
                </p>
                {schoolInfo.phone && (
                  <p
                    className="text-xs text-gray-500 leading-tight flex items-center gap-1"
                    title={schoolInfo.phone}
                  >
                    <span className="h-3 w-3 rounded-full bg-green-200"></span>
                    {schoolInfo.phone}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Logout Button with green hover */}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 hover:scale-[1.02] hover:shadow-sm border border-transparent hover:border-red-200/50 w-full",
              isMinimized && "md:justify-center md:w-12 md:h-12 md:p-0"
            )}
            title={isMinimized ? "Keluar" : undefined}
          >
            <LogOut className={cn(
              "h-4 w-4 transition-colors duration-200",
              isMinimized && "h-5 w-5"
            )} />
            {!isMinimized && <span>Keluar</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
