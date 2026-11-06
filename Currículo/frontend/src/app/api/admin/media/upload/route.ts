import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getAdminSession } from '@/lib/auth/serverAuth';
import { prisma, isDatabaseAvailable } from '@/lib/prisma';
import { extractClientIp, hashIpForPrivacy } from '@/lib/rateLimit';
import { sanitizeFileName } from '@/schemas/cms';
import {
  persistMediaFile,
  deleteStoredMedia,
  StorageUnavailableError,
} from '@/services/mediaStorageService';

// Limite máximo defensivo de 5 MB
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

// Tipos MIME estritamente homologados
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
]);

/**
 * Validação rigorosa de Magic Bytes para impedir falsificação de extensão/MIME.
 */
function validateMagicBytes(buffer: Uint8Array, mimeType: string): boolean {
  if (buffer.length < 4) return false;

  switch (mimeType) {
    case 'application/pdf':
      // %PDF- (0x25, 0x50, 0x44, 0x46)
      return (
        buffer[0] === 0x25 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x44 &&
        buffer[3] === 0x46
      );

    case 'image/png':
      // \x89PNG\r\n\x1a\n (0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)
      return (
        buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
      );

    case 'image/jpeg':
      // \xFF\xD8\xFF
      return (
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff
      );

    case 'image/webp':
      // RIFF....WEBP (0x52, 0x49, 0x46, 0x46 ... 0x57, 0x45, 0x42, 0x50)
      return (
        buffer.length >= 12 &&
        buffer[0] === 0x52 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x46 &&
        buffer[8] === 0x57 &&
        buffer[9] === 0x45 &&
        buffer[10] === 0x42 &&
        buffer[11] === 0x50
      );

    default:
      return false;
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Formato de requisição inválido. Envie como multipart/form-data.' },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: 'Nenhum arquivo válido enviado no campo "file".' },
        { status: 400 }
      );
    }

    // 1. Verificação de Tamanho Máximo (5 MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `Tamanho de arquivo excede o limite permitido de 5 MB (${(file.size / (1024 * 1024)).toFixed(2)} MB recebidos).`,
        },
        { status: 413 }
      );
    }

    // 2. Verificação de Tipo MIME declarado
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          error: `Tipo de arquivo não permitido (${file.type}). Tipos aceitos: PDF, PNG, JPEG, WebP.`,
        },
        { status: 415 }
      );
    }

    // 3. Validação de Conteúdo Real (Magic Bytes)
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    if (!validateMagicBytes(uint8Array, file.type)) {
      return NextResponse.json(
        {
          error: 'Assinatura binária do arquivo (Magic Bytes) incompatível com o tipo MIME informado.',
        },
        { status: 415 }
      );
    }

    // 4. Controle de Visibilidade (documentos não publicados permanecem privados)
    const rawIsPublic = formData.get('isPublic');
    const rawPublished = formData.get('published');
    const isPublic =
      rawIsPublic !== null
        ? String(rawIsPublic).toLowerCase() === 'true'
        : rawPublished !== null
          ? String(rawPublished).toLowerCase() === 'true'
          : true;

    // 5. Geração de Nome Seguro via UUIDv4 e Sanitização Multiplataforma do Nome Original
    const safeFileName = sanitizeFileName(file.name);
    const extensionMap: Record<string, string> = {
      'application/pdf': '.pdf',
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/webp': '.webp',
    };
    const extension = extensionMap[file.type] || '';
    const storedKey = `${crypto.randomUUID()}${extension}`;

    // 6. Gravação Real e Persistente com Verificação Pós-Escrita (Read-After-Write)
    const persisted = await persistMediaFile({
      storedKey,
      fileName: safeFileName,
      mimeType: file.type,
      buffer: uint8Array,
      isPublic,
      uploadedByAdminSub: session.sub,
    });

    if (!persisted.verifiedReadAfterWrite) {
      await deleteStoredMedia(storedKey, persisted.storageUrl).catch(() => undefined);
      return NextResponse.json(
        { error: 'Não foi possível confirmar a gravação íntegra do arquivo no armazenamento.' },
        { status: 500 }
      );
    }

    const clientIp = extractClientIp(req.headers);
    const clientIpHash = hashIpForPrivacy(clientIp || '127.0.0.1');

    // 7. Persistência de Metadados no Banco com Rollback de Arquivo Órfão em Caso de Falha
    const simulateDbFailure =
      process.env.NODE_ENV !== 'production' &&
      req.headers.get('x-test-simulate-db-failure') === 'true';

    const isDbReady = await isDatabaseAvailable();
    let assetId = `asset-${storedKey.slice(0, 8)}`;

    try {
      if (simulateDbFailure) {
        throw new Error('Falha simulada de persistência no banco de dados após upload.');
      }

      if (isDbReady) {
        const record = await prisma.mediaAsset.create({
          data: {
            fileName: safeFileName,
            storedKey,
            mimeType: file.type,
            sizeBytes: file.size,
            assetType: file.type.startsWith('image/') ? 'image' : 'document',
            url: persisted.storageUrl.startsWith('https://')
              ? persisted.storageUrl
              : persisted.url,
            isPublic,
            uploadedByAdminSub: session.sub,
          },
        });
        assetId = record.id;

        await prisma.auditLog.create({
          data: {
            action: 'UPLOAD_MEDIA_ASSET',
            entityType: 'MediaAsset',
            entityId: record.id,
            adminEmail: session.email,
            adminSub: 'verified-admin-sub',
            ipHash: clientIpHash,
            details: {
              fileName: safeFileName,
              storedKey,
              mimeType: file.type,
              sizeBytes: file.size,
              sha256: persisted.sha256,
              isPublic,
              storageProvider: persisted.storageProvider,
            },
          },
        });
      }
    } catch (dbErr) {
      // Limpeza imediata de arquivo órfão caso o registro de metadados falhe
      await deleteStoredMedia(storedKey, persisted.storageUrl).catch(() => undefined);
      console.error('[ADMIN_API] Falha ao registrar metadados do arquivo; arquivo órfão removido:', dbErr);
      return NextResponse.json(
        {
          error: 'Falha ao registrar metadados do arquivo no banco de dados. O arquivo órfão foi removido com segurança.',
          orphanCleaned: true,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Arquivo gravado e verificado com sucesso no armazenamento persistente!',
        asset: {
          id: assetId,
          fileName: safeFileName,
          storedKey,
          url: persisted.url,
          mimeType: file.type,
          sizeBytes: file.size,
          sha256: persisted.sha256,
          isPublic: persisted.isPublic,
          storageProvider: persisted.storageProvider,
          verifiedReadAfterWrite: persisted.verifiedReadAfterWrite,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof StorageUnavailableError) {
      return NextResponse.json(
        {
          error:
            'Serviço de armazenamento persistente indisponível. Configure BLOB_READ_WRITE_TOKEN no painel da Vercel.',
        },
        { status: 503 }
      );
    }

    console.error('[ADMIN_API] Erro ao processar upload:', err);
    return NextResponse.json(
      { error: 'Falha interna ao processar o arquivo enviado.' },
      { status: 500 }
    );
  }
}
