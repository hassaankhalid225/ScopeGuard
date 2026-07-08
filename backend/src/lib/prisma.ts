import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

// Reuse a single PrismaClient across hot reloads in development.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.isProd ? ['error'] : ['warn', 'error'],
  });

if (!env.isProd) globalForPrisma.prisma = prisma;
