import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/serverAuth';
import { getEnvironmentDiagnostics } from '@/lib/auth/config';

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession(req);
    const diagnostics = getEnvironmentDiagnostics();

    if (!session) {
      return NextResponse.json({
        authenticated: false,
        diagnostics: {
          subsystems: diagnostics.subsystems,
          authDiagnostic: diagnostics.authDiagnostic,
          variables: diagnostics.variables,
        },
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
      diagnostics: {
        subsystems: diagnostics.subsystems,
        authDiagnostic: diagnostics.authDiagnostic,
        variables: diagnostics.variables,
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
