import { PrismaClient } from '@prisma/client'

declare global {
  var __prisma: PrismaClient | undefined
}

// Prevent multiple Prisma instances in development
export const prisma = globalThis.__prisma || new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}

// Helper to handle database connection cleanup
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

export default prisma