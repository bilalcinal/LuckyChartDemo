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

// Employee model tipini manuel olarak ekleyelim
export type Employee = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  password: string | null;
  position: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}; 