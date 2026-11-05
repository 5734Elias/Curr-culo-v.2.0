import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from './config';
import { verifySessionToken, AdminSessionUser } from './session';

/**
 * Recupera a sessão administrativa atual no servidor.
 * Suporta tanto Server Components (via next/headers) quanto Route Handlers (via NextRequest).
 */
export async function getAdminSession(req?: NextRequest): Promise<AdminSessionUser | null> {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  } else {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    } catch {
      // Fora de contexto de renderização ou durante testes locais
      return null;
    }
  }

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

/**
 * Exige uma sessão administrativa válida para prosseguir.
 * Se o visitante não estiver autenticado, redireciona imediatamente para /admin/login.
 */
export async function requireAdminSession(req?: NextRequest): Promise<AdminSessionUser> {
  const session = await getAdminSession(req);

  if (!session) {
    redirect('/admin/login');
  }

  return session;
}
