import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Endpoint de diagnostic (sans secret exposé) : confirme que l'app tourne
// et que la base répond. Suit le pattern « vérif de déploiement » : on peut
// le poller après un déploiement pour savoir si tout est branché.
export async function GET() {
  const aDatabaseUrl = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.length > 0)
  let dbOk = false
  let nbMesures: number | null = null
  let erreur: string | null = null
  try {
    nbMesures = await prisma.mesure.count()
    dbOk = true
  } catch (e) {
    erreur = e instanceof Error ? e.message : 'erreur inconnue'
  }
  return NextResponse.json(
    {
      app: 'ok',
      databaseUrlPresent: aDatabaseUrl,
      db: dbOk ? 'ok' : 'erreur',
      nbMesures,
      erreur,
    },
    { status: dbOk ? 200 : 503 },
  )
}
