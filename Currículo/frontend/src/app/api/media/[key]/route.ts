import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/serverAuth';
import { prisma, isDatabaseAvailable } from '@/lib/prisma';
import { sanitizeFileName } from '@/schemas/cms';
import {
  isValidStoredKey,
  readStoredMedia,
  updateStoredMediaVisibility,
  deleteStoredMedia,
} from '@/services/mediaStorageService';

interface RouteContext {
  params: Promise<{ key: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  const { key } = await context.params;

  if (!isValidStoredKey(key)) {
    return NextResponse.json(
      { error: 'Identificador de arquivo inválido.' },
      { status: 400 }
    );
  }

  let dbRecord: {
    fileName: string;
    mimeType: string;
    url: string;
    isPublic: boolean;
  } | null = null;

  if (await isDatabaseAvailable()) {
    try {
      dbRecord = await prisma.mediaAsset.findUnique({
        where: { storedKey: key },
        select: {
          fileName: true,
          mimeType: true,
          url: true,
          isPublic: true,
        },
      });
    } catch {
      dbRecord = null;
    }
  }

  const media = await readStoredMedia(
    key,
    dbRecord?.url,
    dbRecord
      ? {
          fileName: dbRecord.fileName,
          mimeType: dbRecord.mimeType,
          isPublic: dbRecord.isPublic,
        }
      : undefined
  );

  if (!media) {
    return NextResponse.json(
      { error: 'Arquivo não encontrado no armazenamento.' },
      { status: 404 }
    );
  }

  // Documentos não publicados (privados) exigem sessão administrativa válida
  if (!media.isPublic) {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json(
        {
          error:
            'Acesso restrito: este documento não está publicado e exige autenticação administrativa.',
        },
        { status: 401 }
      );
    }
  }

  const safeName = sanitizeFileName(media.fileName);

  return new NextResponse(Buffer.from(media.buffer), {
    status: 200,
    headers: {
      'Content-Type': media.mimeType,
      'Content-Length': String(media.sizeBytes),
      'Content-Disposition': `inline; filename="${safeName}"`,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      'X-Content-SHA256': media.sha256,
      'Cache-Control': media.isPublic
        ? 'public, max-age=3600, stale-while-revalidate=86400'
        : 'private, no-store, no-cache, must-revalidate',
    },
  });
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const session = await getAdminSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  const { key } = await context.params;
  if (!isValidStoredKey(key)) {
    return NextResponse.json({ error: 'Identificador de arquivo inválido.' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const isPublic = Boolean(body?.isPublic);

    if (await isDatabaseAvailable()) {
      await prisma.mediaAsset
        .update({
          where: { storedKey: key },
          data: { isPublic },
        })
        .catch(() => undefined);
    }

    await updateStoredMediaVisibility(key, isPublic);

    return NextResponse.json(
      { success: true, storedKey: key, isPublic },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Falha ao atualizar visibilidade do arquivo.' },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const session = await getAdminSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  const { key } = await context.params;
  if (!isValidStoredKey(key)) {
    return NextResponse.json({ error: 'Identificador de arquivo inválido.' }, { status: 400 });
  }

  let externalUrl: string | null = null;
  if (await isDatabaseAvailable()) {
    try {
      const existing = await prisma.mediaAsset.findUnique({ where: { storedKey: key } });
      externalUrl = existing?.url || null;
      if (existing) {
        await prisma.mediaAsset.delete({ where: { storedKey: key } });
      }
    } catch {
      externalUrl = null;
    }
  }

  const deleted = await deleteStoredMedia(key, externalUrl);
  return NextResponse.json({ success: true, deleted }, { status: 200 });
}

