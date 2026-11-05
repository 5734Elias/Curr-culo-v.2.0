import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getAdminSession } from '@/lib/auth/serverAuth';
import { prisma, isDatabaseAvailable } from '@/lib/prisma';
import { extractClientIp, hashIpForPrivacy } from '@/lib/rateLimit';

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

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado no campo "file".' },
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

    // 4. Geração de Nome Seguro via UUIDv4
    const extensionMap: Record<string, string> = {
      'application/pdf': '.pdf',
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/webp': '.webp',
    };
    const extension = extensionMap[file.type] || '';
    const storedKey = `${crypto.randomUUID()}${extension}`;
    const publicUrl = `/uploads/${storedKey}`;

    const clientIp = extractClientIp(req.headers);
    const clientIpHash = hashIpForPrivacy(clientIp || '127.0.0.1');

    // 5. Persistência de Metadados se o Banco estiver ativo
    const isDbReady = await isDatabaseAvailable();
    let assetId = `mock-asset-${Date.now()}`;

    if (isDbReady) {
      const record = await prisma.mediaAsset.create({
        data: {
          fileName: file.name.slice(0, 150),
          storedKey,
          mimeType: file.type,
          sizeBytes: file.size,
          assetType: file.type.startsWith('image/') ? 'image' : 'document',
          url: publicUrl,
          isPublic: true,
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
          adminSub: session.sub,
          ipHash: clientIpHash,
          details: { fileName: file.name, storedKey, mimeType: file.type, sizeBytes: file.size },
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Arquivo enviado e validado com sucesso!',
        asset: {
          id: assetId,
          fileName: file.name,
          storedKey,
          url: publicUrl,
          mimeType: file.type,
          sizeBytes: file.size,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[ADMIN_API] Erro ao processar upload:', err);
    return NextResponse.json(
      { error: 'Falha interna ao processar o arquivo enviado.' },
      { status: 500 }
    );
  }
}
