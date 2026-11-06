import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from './lib/auth/config';
import { verifySessionToken } from './lib/auth/session';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Permite acesso irrestrito à tela de login administrativo
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  // 2. Intercepta todas as demais rotas administrativas (/admin, /admin/*)
  if (pathname.startsWith('/admin')) {
    const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      const loginUrl = new URL('/admin/login', req.url);
      return NextResponse.redirect(loginUrl);
    }

    // 3. Validação criptográfica da sessão administrativa
    const verifiedUser = await verifySessionToken(sessionCookie);
    if (!verifiedUser) {
      const loginUrl = new URL('/admin/login?error=SessionExpired', req.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};

