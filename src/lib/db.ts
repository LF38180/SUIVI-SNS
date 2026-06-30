import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function creerClient(): PrismaClient {
  // max:5 → garde-fou : empêche d'épuiser les connexions Postgres de Railway
  // sous un pic (8000 visiteurs potentiels sur la vue publique).
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 5 })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? creerClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
