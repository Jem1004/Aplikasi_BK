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
  trustHost: true, // Allow localhost and configured NEXTAUTH_URL
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        identifier: { label: 'Email atau Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('=== AUTHORIZE CALLED ===');
        console.log('Credentials:', {
          identifier: credentials?.identifier,
          password: credentials?.password ? `[${(credentials.password as string).length} chars]` : 'undefined',
        });
        
        try {
          // Validate credentials
          const validatedFields = loginSchema.safeParse(credentials);

          if (!validatedFields.success) {
            console.warn('❌ Invalid credentials format:', validatedFields.error.errors);
            return null;
          }

          const { identifier, password } = validatedFields.data;
          console.log('✅ Credentials validated');
          console.log('Searching for user with identifier:', identifier);

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

          console.log('User search result:', user ? {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            isActive: user.isActive,
            hasPasswordHash: !!user.passwordHash,
          } : '❌ USER NOT FOUND');

          if (!user) {
            console.log('❌ User not found for identifier:', identifier);
            return null;
          }

          console.log('🔐 Verifying password...');
          console.log('Password from form:', password);
          console.log('Password hash from DB:', user.passwordHash.substring(0, 30) + '...');
          
          // Verify password
          const isPasswordValid = await compare(password, user.passwordHash);

          console.log('🔐 Password verification result:', isPasswordValid);

          if (!isPasswordValid) {
            console.log('❌ Invalid password for user:', identifier);
            return null;
          }

          // Return user object with necessary fields
          console.log('✅ User authenticated successfully:', user.email);
          const authUser = {
            id: user.id,
            email: user.email,
            name: user.fullName,
            role: user.role,
            teacherId: user.teacher?.id || null,
            studentId: user.student?.id || null,
            mustChangePassword: Boolean(user.mustChangePassword),
          };
          console.log('✅ Returning auth user:', authUser);
          return authUser;
        } catch (error) {
          console.error('💥 Authorization error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add custom fields to JWT token
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.teacherId = user.teacherId;
        token.studentId = user.studentId;
        token.mustChangePassword = user.mustChangePassword;
      }
      return token;
    },
    async session({ session, token }) {
      // Add custom fields to session with defensive checks
      if (token && session?.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.teacherId = token.teacherId as string | null;
        session.user.studentId = token.studentId as string | null;
        session.user.mustChangePassword = Boolean(token.mustChangePassword);
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60, // 1 hour
  },
  jwt: {
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
