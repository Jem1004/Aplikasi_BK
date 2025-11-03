import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, MapPin, GraduationCap, Calendar, Users } from "lucide-react";

type StudentProfileProps = {
  profile: {
    id: string;
    nis: string;
    nisn: string | null;
    dateOfBirth: Date | null;
    address: string | null;
    parentName: string | null;
    parentPhone: string | null;
    user: {
      fullName: string;
      email: string;
      phone: string | null;
    };
    class: {
      name: string;
      gradeLevel: number;
      academicYear: {
        name: string;
      };
    } | null;
    counselorAssignments: Array<{
      counselor: {
        user: {
          fullName: string;
          email: string;
          phone: string | null;
        };
      };
    }>;
  };
};

export function StudentProfile({ profile }: StudentProfileProps) {
  return (
    <div className="space-y-6">
      {/* Header Card with Avatar */}
      <Card className="transition-shadow duration-200 hover:shadow-md">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="h-24 w-24 ring-4 ring-primary-100">
              <AvatarFallback className="bg-primary-100 text-primary-700 text-3xl">
                {profile.user.fullName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-gray-900">{profile.user.fullName}</h2>
              <div className="flex flex-wrap gap-2 mt-2 justify-center md:justify-start">
                <Badge variant="secondary" className="transition-colors duration-200">NIS: {profile.nis}</Badge>
                {profile.nisn && <Badge variant="secondary" className="transition-colors duration-200">NISN: {profile.nisn}</Badge>}
                {profile.class && (
                  <Badge className="bg-primary-500 hover:bg-primary-600 transition-colors duration-200">{profile.class.name}</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card className="transition-shadow duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <User className="h-5 w-5 text-primary-600" />
              Informasi Pribadi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 mt-1 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{profile.user.email}</p>
                </div>
              </div>

              {profile.user.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Telepon</p>
                    <p className="font-medium">{profile.user.phone}</p>
                  </div>
                </div>
              )}

              {profile.dateOfBirth && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Tanggal Lahir</p>
                    <p className="font-medium">
                      {new Date(profile.dateOfBirth).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              )}

              {profile.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Alamat</p>
                    <p className="font-medium">{profile.address}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Academic Information */}
        <Card className="transition-shadow duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <GraduationCap className="h-5 w-5 text-primary-600" />
              Informasi Akademik
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.class ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Kelas</p>
                  <p className="font-medium text-lg">{profile.class.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tingkat</p>
                  <p className="font-medium">Kelas {profile.class.gradeLevel}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tahun Ajaran</p>
                  <p className="font-medium">{profile.class.academicYear.name}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Belum ada kelas yang ditugaskan</p>
            )}
          </CardContent>
        </Card>

        {/* Parent Information */}
        <Card className="transition-shadow duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Users className="h-5 w-5 text-primary-600" />
              Informasi Orang Tua
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.parentName || profile.parentPhone ? (
              <div className="space-y-3">
                {profile.parentName && (
                  <div>
                    <p className="text-sm text-muted-foreground">Nama Orang Tua</p>
                    <p className="font-medium">{profile.parentName}</p>
                  </div>
                )}
                {profile.parentPhone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Telepon Orang Tua</p>
                      <p className="font-medium">{profile.parentPhone}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Belum ada informasi orang tua</p>
            )}
          </CardContent>
        </Card>

        {/* Counselor Information */}
        <Card className="transition-shadow duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <User className="h-5 w-5 text-primary-600" />
              Guru Bimbingan Konseling
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.counselorAssignments.length > 0 ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Nama Guru BK</p>
                  <p className="font-medium text-lg">
                    {profile.counselorAssignments[0].counselor.user.fullName}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">
                      {profile.counselorAssignments[0].counselor.user.email}
                    </p>
                  </div>
                </div>
                {profile.counselorAssignments[0].counselor.user.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Telepon</p>
                      <p className="font-medium">
                        {profile.counselorAssignments[0].counselor.user.phone}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Belum ada Guru BK yang ditugaskan</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
