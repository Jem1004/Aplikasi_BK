'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { resetUserPassword } from '@/lib/actions/admin/reset-password';
import { KeyRound, AlertTriangle, Copy, Check } from 'lucide-react';

interface ResetPasswordDialogProps {
  userId: string;
  userName: string;
  userRole: string;
}

export function ResetPasswordDialog({ userId, userName, userRole }: ResetPasswordDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  async function handleReset() {
    setIsLoading(true);
    
    try {
      const result = await resetUserPassword(userId);
      
      if (result.success && result.data) {
        const password = (result.data as { newPassword: string }).newPassword;
        
        setNewPassword(password);
        
        toast({
          title: 'Berhasil',
          description: 'Password berhasil direset',
        });
      } else {
        toast({
          title: 'Gagal',
          description: result.error || 'Gagal mereset password',
          variant: 'destructive',
        });
        setOpen(false);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat mereset password',
        variant: 'destructive',
      });
      setOpen(false);
    } finally {
      setIsLoading(false);
    }
  }

  function handleCopy() {
    if (newPassword) {
      navigator.clipboard.writeText(newPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: 'Tersalin',
        description: 'Password telah disalin ke clipboard',
      });
    }
  }

  function handleClose() {
    setOpen(false);
    setNewPassword(null);
    setCopied(false);
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        handleClose();
      } else {
        setOpen(true);
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <KeyRound className="h-4 w-4 mr-2" />
          Reset Password
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Reset Password User</DialogTitle>
          <DialogDescription>
            Reset password untuk <strong>{userName}</strong> ({userRole})
          </DialogDescription>
        </DialogHeader>

        {!newPassword ? (
          <>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Password akan direset ke password default berdasarkan role user.
                User akan diminta untuk mengganti password saat login pertama kali.
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Batal
              </Button>
              <Button onClick={handleReset} disabled={isLoading}>
                {isLoading ? 'Mereset...' : 'Reset Password'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="space-y-3">
                <p className="font-medium text-green-900">
                  Password berhasil direset!
                </p>
                <div className="bg-white border border-green-300 rounded-md p-3">
                  <p className="text-sm text-gray-600 mb-1">Password baru:</p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-lg font-mono font-bold text-green-700">
                      {newPassword}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopy}
                      className="shrink-0"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Berikan password ini kepada user. User akan diminta mengganti password
                  saat login pertama kali.
                </p>
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button onClick={handleClose}>
                Tutup
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
