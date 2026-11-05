import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Instância singleton do Prisma Client.
 *
 * Em ambientes serverless e Next.js dev com hot-reloading, reutiliza a conexão
 * existente para não esgotar o pool de conexões do PostgreSQL.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Verifica de forma não destrutiva se a base de dados está configurada e acessível.
 */
export async function isDatabaseAvailable(): Promise<boolean> {
  const dbUrl = process.env.DATABASE_URL?.trim();
  if (!dbUrl) {
    return false;
  }

  try {
    // Consulta leve para testar conectividade
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

