'use client';

import { WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <WifiOff className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Tidak Ada Koneksi Internet</CardTitle>
          <CardDescription>
            Anda sedang offline. Beberapa fitur mungkin tidak tersedia.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              Aplikasi BK Sekolah memerlukan koneksi internet untuk mengakses data terbaru.
            </p>
            <p>
              Silakan periksa koneksi internet Anda dan coba lagi.
            </p>
          </div>
          
          <div className="space-y-2">
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Coba Lagi
            </Button>
            <Button 
              onClick={() => window.history.back()} 
              variant="outline"
              className="w-full"
            >
              Kembali
            </Button>
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-semibold text-sm mb-2">Tips:</h3>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Periksa koneksi WiFi atau data seluler Anda</li>
              <li>Pastikan mode pesawat tidak aktif</li>
              <li>Coba pindah ke area dengan sinyal lebih baik</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
