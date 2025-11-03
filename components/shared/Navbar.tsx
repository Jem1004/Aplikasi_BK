import { auth, signOut } from "@/lib/auth/auth";
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
import { LogOut, Menu, User } from "lucide-react";
import { InstallButton } from "./InstallButton";

interface NavbarProps {
  onMenuClick?: () => void;
}

async function handleSignOut() {
  "use server";
  await signOut({ redirectTo: "/login" });
}

export async function Navbar({ onMenuClick }: NavbarProps) {
  const session = await auth();

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

  // Role display names
  const roleNames: Record<string, string> = {
    ADMIN: "Administrator",
    GURU_BK: "Guru BK",
    WALI_KELAS: "Wali Kelas",
    SISWA: "Siswa",
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="flex h-16 items-center gap-4 px-4 md:px-6">
        {/* Mobile menu button - larger touch target */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden min-w-[44px] min-h-[44px]"
          onClick={onMenuClick}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        {/* Logo/Title */}
        <div className="flex items-center gap-2">
          <h1 className="text-base sm:text-lg font-semibold text-primary-600">
            Aplikasi BK
          </h1>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="relative h-10 gap-2 px-2 min-w-[44px] min-h-[44px]"
              aria-label="User menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary-100 text-primary-700">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start text-left md:flex">
                <span className="text-sm font-medium">{name}</span>
                <span className="text-xs text-muted-foreground">
                  {roleNames[role] || role}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{name}</p>
                <p className="text-xs text-muted-foreground">{email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profil</span>
            </DropdownMenuItem>
            <InstallButton />
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <form action={handleSignOut} className="w-full">
                <button type="submit" className="flex w-full items-center min-h-[44px]">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Keluar</span>
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
