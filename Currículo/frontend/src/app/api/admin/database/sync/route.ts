import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/auth/serverAuth';
import { prisma, isDatabaseAvailable } from '@/lib/prisma';
import { extractClientIp, hashIpForPrivacy } from '@/lib/rateLimit';
import {
  ensureDatabaseSeeded,
  exportCmsBackupSnapshot,
} from '@/services/cmsDataService';

export async function GET(req: NextRequest) {
  const session = await getAdminSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  try {
    const snapshot = await exportCmsBackupSnapshot();
    return NextResponse.json(
      {
        success: true,
        backup: snapshot,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, no-store, no-cache, must-revalidate',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    );
  } catch (err) {
    console.error('[ADMIN_API] Erro ao exportar snapshot de backup:', err);
    return NextResponse.json(
      { error: 'Falha ao gerar backup de segurança do CMS.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  try {
    const report = await ensureDatabaseSeeded(true);

    if (await isDatabaseAvailable()) {
      const clientIp = extractClientIp(req.headers);
      const clientIpHash = hashIpForPrivacy(clientIp || '127.0.0.1');

      await prisma.auditLog
        .create({
          data: {
            action: 'SYNC_CMS_DATABASE',
            entityType: 'Database',
            adminEmail: session.email,
            adminSub: 'verified-admin-sub',
            ipHash: clientIpHash,
            details: {
              certificatesCount: report.certificatesCount,
              totalWorkloadHours: report.totalWorkloadHours,
              skillsCount: report.skillsCount,
              projectsCount: report.projectsCount,
              integrityVerified: report.integrityVerified,
            },
          },
        })
        .catch(() => undefined);
    }

    try {
      revalidatePath('/');
      revalidatePath('/formacao');
      revalidatePath('/projetos');
    } catch {
      // Ignora em execução de script fora do contexto Next.js ISR
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Sincronização idempotente e auditoria de integridade concluídas.',
        report,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[ADMIN_API] Erro ao sincronizar banco de dados:', err);
    return NextResponse.json(
      { error: 'Falha interna ao sincronizar dados do CMS.' },
      { status: 500 }
    );
  }
}

