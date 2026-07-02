import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function creerClient(): PrismaClient {
  // max:5 → garde-fou : empêche d'épuiser les connexions Postgres de Railway.
  // Les timeouts évitent qu'une micro-coupure DB (restart Railway) fasse s'empiler
  // les requêtes à l'infini (défaut node-postgres = attente illimitée) : on échoue
  // vite et proprement plutôt que de geler l'app.
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    query_timeout: 15000,
    statement_timeout: 15000,
  })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? creerClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
