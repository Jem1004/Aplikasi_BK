import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { Role } from '@prisma/client';

// Validation schema for login credentials
const loginSchema = z.object({
  identifier: z.string().min(1, 'Email atau username harus diisi'),
  password: z.string().min(1, 'Password harus diisi'),
});

/**
 * NextAuth.js Configuration
 * 
 * Security Features:
 * - JWT strategy with 1-hour expiration
 * - Secure cookie settings (httpOnly, sameSite: lax, secure in production)
 * - CSRF protection is built-in to Next.js Server Actions
 * - Session invalidation on logout
 */
export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        identifier: { label: 'Email atau Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          // Validate credentials
          const validatedFields = loginSchema.safeParse(credentials);

          if (!validatedFields.success) {
            return null;
          }

          const { identifier, password } = validatedFields.data;

          // Find user by email or username
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: identifier },
                { username: identifier },
              ],
              isActive: true,
              deletedAt: null,
            },
            include: {
              teacher: true,
              student: true,
            },
          });

          if (!user) {
            return null;
          }

          // Verify password
          const isPasswordValid = await compare(password, user.passwordHash);

          if (!isPasswordValid) {
            return null;
          }

          // Return user object with necessary fields
          return {
            id: user.id,
            email: user.email,
            name: user.fullName,
            role: user.role,
            teacherId: user.teacher?.id || null,
            studentId: user.student?.id || null,
          };
        } catch (error) {
          console.error('Authorization error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add custom fields to JWT token
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.teacherId = user.teacherId;
        token.studentId = user.studentId;
      }
      return token;
    },
    async session({ session, token }) {
      // Add custom fields to session
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.teacherId = token.teacherId as string | null;
        session.user.studentId = token.studentId as string | null;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60, // 1 hour
  },
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
