import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export class StorageUnavailableError extends Error {
  public readonly code = 'STORAGE_UNAVAILABLE';
  constructor(message: string) {
    super(message);
    this.name = 'StorageUnavailableError';
  }
}

export interface StoredMediaMetadata {
  storedKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  isPublic: boolean;
  storageProvider: 'vercel-blob' | 'local-fs';
  storageUrl: string;
  uploadedByAdminSub: string;
  createdAt: string;
}

export interface PersistMediaOptions {
  storedKey: string;
  fileName: string;
  mimeType: string;
  buffer: Uint8Array;
  isPublic: boolean;
  uploadedByAdminSub: string;
}

export interface PersistMediaResult {
  storedKey: string;
  url: string;
  storageUrl: string;
  storageProvider: 'vercel-blob' | 'local-fs';
  sizeBytes: number;
  sha256: string;
  isPublic: boolean;
  verifiedReadAfterWrite: boolean;
}

export interface ReadMediaResult {
  buffer: Uint8Array;
  mimeType: string;
  fileName: string;
  sizeBytes: number;
  sha256: string;
  isPublic: boolean;
}

const VALID_STORED_KEY_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|png|jpg|webp)$/i;

/**
 * Valida se a chave de armazenamento segue estritamente o formato UUIDv4 + extensão homologada,
 * impedindo Path Traversal ou acesso a arquivos arbitrários.
 */
export function isValidStoredKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  if (key.includes('..') || key.includes('/') || key.includes('\\')) return false;
  return VALID_STORED_KEY_REGEX.test(key);
}

/**
 * Calcula o hash SHA-256 de um buffer para verificação de integridade pós-gravação.
 */
export function computeSha256(buffer: Uint8Array): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function getLocalStorageDir(): string {
  return path.join(process.cwd(), '.cms-storage', 'uploads');
}

function getLocalFilePath(storedKey: string): string {
  if (!isValidStoredKey(storedKey)) {
    throw new Error('Chave de armazenamento inválida.');
  }
  return path.join(getLocalStorageDir(), storedKey);
}

function getLocalMetaPath(storedKey: string): string {
  if (!isValidStoredKey(storedKey)) {
    throw new Error('Chave de armazenamento inválida.');
  }
  return path.join(getLocalStorageDir(), `${storedKey}.meta.json`);
}

/**
 * Persiste o conteúdo binário do arquivo de forma real e verificada:
 * - Em produção com BLOB_READ_WRITE_TOKEN: grava no Vercel Blob e executa verificação de leitura pós-upload.
 * - Em produção sem BLOB_READ_WRITE_TOKEN: falha de forma segura (Fail-Closed HTTP 503), jamais fingindo sucesso.
 * - Em desenvolvimento/teste sem BLOB_READ_WRITE_TOKEN: grava em disco local (.cms-storage/uploads) e verifica integridade SHA-256 por leitura.
 */
export async function persistMediaFile(options: PersistMediaOptions): Promise<PersistMediaResult> {
  const { storedKey, fileName, mimeType, buffer, isPublic, uploadedByAdminSub } = options;

  if (!isValidStoredKey(storedKey)) {
    throw new Error('Chave de arquivo inválida para persistência.');
  }

  const expectedSha256 = computeSha256(buffer);
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim() || '';
  const isProduction = process.env.NODE_ENV === 'production';

  // 1. Integração com Vercel Blob quando BLOB_READ_WRITE_TOKEN estiver configurado
  if (blobToken) {
    const uploadEndpoint = `https://blob.vercel-storage.com/certificates/${storedKey}`;
    const putResponse = await fetch(uploadEndpoint, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${blobToken}`,
        'x-api-version': '7',
        'x-content-type': mimeType,
        'x-add-random-suffix': '0',
        'x-cache-control-max-age': isPublic ? '3600' : '0',
      },
      body: Buffer.from(buffer),
    });

    if (!putResponse.ok) {
      throw new Error(`Falha ao gravar arquivo no Vercel Blob (HTTP ${putResponse.status}).`);
    }

    const blobData = (await putResponse.json()) as { url?: string };
    if (!blobData?.url) {
      throw new Error('Vercel Blob não retornou URL de confirmação do arquivo gravado.');
    }

    // Verificação obrigatória de leitura após upload (Read-After-Write Verification)
    const verifyResponse = await fetch(blobData.url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${blobToken}`,
      },
    });

    if (!verifyResponse.ok) {
      await deleteStoredMedia(storedKey, blobData.url).catch(() => undefined);
      throw new Error('Falha na verificação de leitura pós-upload no Vercel Blob.');
    }

    const verifiedBytes = new Uint8Array(await verifyResponse.arrayBuffer());
    const verifiedSha256 = computeSha256(verifiedBytes);

    if (verifiedBytes.length !== buffer.length || verifiedSha256 !== expectedSha256) {
      await deleteStoredMedia(storedKey, blobData.url).catch(() => undefined);
      throw new Error('Divergência de integridade SHA-256 na leitura pós-upload no Vercel Blob.');
    }

    return {
      storedKey,
      url: `/api/media/${storedKey}`,
      storageUrl: blobData.url,
      storageProvider: 'vercel-blob',
      sizeBytes: buffer.length,
      sha256: expectedSha256,
      isPublic,
      verifiedReadAfterWrite: true,
    };
  }

  // 2. Em produção, sem BLOB_READ_WRITE_TOKEN, jamais retorna falso sucesso
  if (isProduction) {
    throw new StorageUnavailableError(
      'Armazenamento persistente (BLOB_READ_WRITE_TOKEN) não configurado em produção.'
    );
  }

  // 3. Armazenamento Persistente Local (Desenvolvimento e Suítes de Homologação)
  const storageDir = getLocalStorageDir();
  await fs.mkdir(storageDir, { recursive: true });

  const filePath = getLocalFilePath(storedKey);
  const metaPath = getLocalMetaPath(storedKey);

  await fs.writeFile(filePath, buffer);

  const meta: StoredMediaMetadata = {
    storedKey,
    fileName,
    mimeType,
    sizeBytes: buffer.length,
    sha256: expectedSha256,
    isPublic,
    storageProvider: 'local-fs',
    storageUrl: `file://${filePath}`,
    uploadedByAdminSub,
    createdAt: new Date().toISOString(),
  };

  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');

  // Verificação obrigatória de leitura após upload (Read-After-Write Verification)
  const readBackBuffer = new Uint8Array(await fs.readFile(filePath));
  const readBackSha256 = computeSha256(readBackBuffer);

  if (readBackBuffer.length !== buffer.length || readBackSha256 !== expectedSha256) {
    await deleteStoredMedia(storedKey).catch(() => undefined);
    throw new Error('Falha na verificação de integridade SHA-256 após gravação do arquivo.');
  }

  return {
    storedKey,
    url: `/api/media/${storedKey}`,
    storageUrl: `local://${storedKey}`,
    storageProvider: 'local-fs',
    sizeBytes: buffer.length,
    sha256: expectedSha256,
    isPublic,
    verifiedReadAfterWrite: true,
  };
}

/**
 * Recupera o arquivo e seus metadados do armazenamento persistente.
 */
export async function readStoredMedia(
  storedKey: string,
  externalBlobUrl?: string | null,
  fallbackMeta?: { fileName: string; mimeType: string; isPublic: boolean }
): Promise<ReadMediaResult | null> {
  if (!isValidStoredKey(storedKey)) {
    return null;
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim() || '';

  // 1. Se houver URL externa do Vercel Blob, lê do Blob
  if (externalBlobUrl && externalBlobUrl.startsWith('https://')) {
    const headers: Record<string, string> = {};
    if (blobToken) {
      headers.Authorization = `Bearer ${blobToken}`;
    }

    const res = await fetch(externalBlobUrl, { headers });
    if (!res.ok) return null;

    const buffer = new Uint8Array(await res.arrayBuffer());
    return {
      buffer,
      mimeType: fallbackMeta?.mimeType || res.headers.get('content-type') || 'application/octet-stream',
      fileName: fallbackMeta?.fileName || storedKey,
      sizeBytes: buffer.length,
      sha256: computeSha256(buffer),
      isPublic: fallbackMeta?.isPublic ?? true,
    };
  }

  // 2. Leitura do armazenamento persistente local
  try {
    const filePath = getLocalFilePath(storedKey);
    const metaPath = getLocalMetaPath(storedKey);

    const [rawBytes, rawMeta] = await Promise.all([
      fs.readFile(filePath),
      fs.readFile(metaPath, 'utf-8').catch(() => null),
    ]);

    const buffer = new Uint8Array(rawBytes);
    const parsedMeta: Partial<StoredMediaMetadata> = rawMeta ? JSON.parse(rawMeta) : {};

    return {
      buffer,
      mimeType: fallbackMeta?.mimeType || parsedMeta.mimeType || 'application/octet-stream',
      fileName: fallbackMeta?.fileName || parsedMeta.fileName || storedKey,
      sizeBytes: buffer.length,
      sha256: computeSha256(buffer),
      isPublic: fallbackMeta?.isPublic ?? parsedMeta.isPublic ?? true,
    };
  } catch {
    return null;
  }
}

/**
 * Atualiza a visibilidade (público/privado) do arquivo armazenado.
 */
export async function updateStoredMediaVisibility(
  storedKey: string,
  isPublic: boolean
): Promise<boolean> {
  if (!isValidStoredKey(storedKey)) return false;

  try {
    const metaPath = getLocalMetaPath(storedKey);
    const rawMeta = await fs.readFile(metaPath, 'utf-8');
    const parsed = JSON.parse(rawMeta) as StoredMediaMetadata;
    parsed.isPublic = isPublic;
    await fs.writeFile(metaPath, JSON.stringify(parsed, null, 2), 'utf-8');
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove um arquivo do armazenamento (utilizado para limpeza de arquivos órfãos em caso de falha de transação ou exclusão).
 */
export async function deleteStoredMedia(
  storedKey: string,
  externalBlobUrl?: string | null
): Promise<boolean> {
  if (!isValidStoredKey(storedKey)) {
    return false;
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim() || '';
  let deleted = false;

  if (blobToken && externalBlobUrl && externalBlobUrl.startsWith('https://')) {
    try {
      const res = await fetch('https://blob.vercel-storage.com/delete', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${blobToken}`,
          'x-api-version': '7',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ urls: [externalBlobUrl] }),
      });
      deleted = res.ok;
    } catch {
      deleted = false;
    }
  }

  try {
    const filePath = getLocalFilePath(storedKey);
    const metaPath = getLocalMetaPath(storedKey);
    await fs.unlink(filePath).catch(() => undefined);
    await fs.unlink(metaPath).catch(() => undefined);
    deleted = true;
  } catch {
    // Ignora se arquivo local já não existir
  }

  return deleted;
}

