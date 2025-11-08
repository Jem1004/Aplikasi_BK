import { auth } from '@/lib/auth/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Note: Rate limiting moved to server action level to avoid headers scope issues
  // Middleware rate limiting is limited by Next.js constraints

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // If not authenticated and trying to access protected route
  if (!session && !isPublicRoute) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated and trying to access login page, redirect to dashboard
  if (session && pathname === '/login') {
    let redirectUrl = '/';
    switch (session.user.role) {
      case 'ADMIN':
        redirectUrl = '/admin';
        break;
      case 'GURU_BK':
        redirectUrl = '/guru-bk';
        break;
      case 'WALI_KELAS':
        redirectUrl = '/wali-kelas';
        break;
      case 'SISWA':
        redirectUrl = '/siswa';
        break;
    }
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  }

  // Check if user must change password (except on change password pages)
  if (session && session.user && session.user.mustChangePassword) {
    const changePasswordPaths = [
      '/admin/settings',
      '/guru-bk/settings',
      '/wali-kelas/settings',
      '/siswa/profile',
    ];
    
    const isOnChangePasswordPage = changePasswordPaths.some(path => 
      pathname.startsWith(path)
    );
    
    if (!isOnChangePasswordPage) {
      let settingsUrl = '/';
      switch (session.user.role) {
        case 'ADMIN':
          settingsUrl = '/admin/settings';
          break;
        case 'GURU_BK':
          settingsUrl = '/guru-bk/settings';
          break;
        case 'WALI_KELAS':
          settingsUrl = '/wali-kelas/settings';
          break;
        case 'SISWA':
          settingsUrl = '/siswa/profile';
          break;
        default:
          settingsUrl = '/';
          break;
      }
      return NextResponse.redirect(new URL(settingsUrl, req.url));
    }
  }

  // Role-based route protection
  if (session && session.user) {
    const userRole = session.user.role;

    // Admin routes
    if (pathname.startsWith('/admin') && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    // Guru BK routes
    if (pathname.startsWith('/guru-bk') && userRole !== 'GURU_BK') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    // Wali Kelas routes
    if (pathname.startsWith('/wali-kelas') && userRole !== 'WALI_KELAS') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    // Siswa routes
    if (pathname.startsWith('/siswa') && userRole !== 'SISWA') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$|.*\\.gif$).*)',
  ],
};
