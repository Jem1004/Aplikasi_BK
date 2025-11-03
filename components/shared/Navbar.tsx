'use client';

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Menu, User, Settings, Bell, ChevronDown } from "lucide-react";
import { InstallButton } from "./InstallButton";

interface NavbarProps {
  onMenuClick?: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <header className="sticky top-0 z-40 w-full border-b border-gray-200/60 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="flex h-16 items-center gap-4 px-4 md:px-6">
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>
      </header>
    );
  }

  if (!session?.user) {
    return null;
  }

  const { name, email, role } = session.user;

  // Get initials for avatar
  const initials = name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  // Role display names with styling
  const roleConfig: Record<string, { name: string; color: string }> = {
    ADMIN: { name: "Administrator", color: "bg-purple-100 text-purple-700" },
    GURU_BK: { name: "Guru BK", color: "bg-blue-100 text-blue-700" },
    WALI_KELAS: { name: "Wali Kelas", color: "bg-green-100 text-green-700" },
    SISWA: { name: "Siswa", color: "bg-orange-100 text-orange-700" },
  };

  const currentRole = roleConfig[role] || { name: role, color: "bg-gray-100 text-gray-700" };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200/60 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="flex h-16 items-center gap-4 px-4 md:px-6">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden min-w-[44px] min-h-[44px] hover:bg-gray-100 transition-colors"
          onClick={onMenuClick}
          aria-label="Buka menu navigasi"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Buka menu navigasi</span>
        </Button>

        {/* Left section - spacer */}
        <div className="flex-1" />

        {/* Right section */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="min-w-[44px] min-h-[44px] hover:bg-gray-100 transition-colors relative"
            aria-label="Notifikasi"
          >
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifikasi</span>
            <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-12 gap-3 px-3 min-w-[44px] min-h-[44px] hover:bg-gray-50 transition-colors group"
                aria-label="Menu pengguna"
              >
                <Avatar className="h-9 w-9 ring-2 ring-gray-200 group-hover:ring-primary-300 transition-all duration-200">
                  <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-600 text-white font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden flex-col items-start text-left lg:flex">
                  <span className="text-sm font-semibold text-gray-900">{name}</span>
                  <div className="flex items-center gap-1">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                      currentRole.color
                    )}>
                      {currentRole.name}
                    </span>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72" sideOffset={8}>
              <DropdownMenuLabel className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-600 text-white font-semibold text-lg">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-semibold text-gray-900">{name}</p>
                    <p className="text-xs text-gray-500 truncate">{email}</p>
                    <span className={cn(
                      "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                      currentRole.color
                    )}>
                      {currentRole.name}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-3 py-3 px-4 cursor-pointer hover:bg-gray-50 transition-colors">
                <User className="h-4 w-4 text-gray-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Profil Saya</p>
                  <p className="text-xs text-gray-500">Kelola informasi akun</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-3 py-3 px-4 cursor-pointer hover:bg-gray-50 transition-colors">
                <Settings className="h-4 w-4 text-gray-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Pengaturan</p>
                  <p className="text-xs text-gray-500">Preferensi aplikasi</p>
                </div>
              </DropdownMenuItem>
              <InstallButton />
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-3 py-3 px-4 cursor-pointer hover:bg-red-50 transition-colors text-red-600"
                onClick={() => signOut({ callbackUrl: '/login' })}
              >
                <LogOut className="h-4 w-4" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">Keluar</p>
                  <p className="text-xs opacity-70">Sign out dari akun</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
