// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Only create Prisma client if DATABASE_URL is available
export const prisma = globalForPrisma.prisma ?? (
  process.env.DATABASE_URL ? 
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  }) : 
  null
)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
