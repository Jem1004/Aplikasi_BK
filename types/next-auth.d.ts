import { DefaultSession } from 'next-auth';
import { Role } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
      teacherId: string | null;
      studentId: string | null;
      mustChangePassword: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    role: Role;
    teacherId: string | null;
    studentId: string | null;
    mustChangePassword: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    teacherId: string | null;
    studentId: string | null;
    mustChangePassword: boolean;
  }
}
