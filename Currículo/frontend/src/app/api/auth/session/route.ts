import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/serverAuth';

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession(req);

    if (!session) {
      return NextResponse.json({
        authenticated: false,
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        email: session.email,
        name: session.name,
        avatarUrl: session.avatarUrl,
        role: session.role,
      },
    });
  } catch (err) {
    console.error('[AUTH_SESSION] Erro ao obter sessão administrativa:', err);
    return NextResponse.json(
      { authenticated: false },
      { status: 500 }
    );
  }
}
