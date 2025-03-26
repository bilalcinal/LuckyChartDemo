import { PrismaClient } from '@prisma/client';

// PrismaClient'ın global olarak tanımlanması
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Geliştirme ortamında her hot-reload'da yeni bir Prisma instance oluşturulmasını önlemek için 
// global bir değişken olarak tanımlıyoruz
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma; 