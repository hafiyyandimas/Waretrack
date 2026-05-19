import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

declare global {
  var __prisma: PrismaClient | undefined
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

export const prisma = globalThis.__prisma ?? new PrismaClient({ adapter })
if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}
