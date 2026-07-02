import crypto from 'crypto'
import { cookies } from 'next/headers'

const COOKIE = 'sns_session'

// En production, un secret faible/absent permettrait de forger un cookie admin.
// On refuse de démarrer avec un secret manquant ou trop court hors développement.
function resoudreSecret(): string {
  const s = process.env.SESSION_SECRET
  if (s && s.length >= 16) return s
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET manquant ou trop court (≥16 caractères requis en production).')
  }
  return 'dev-secret-change-me'
}
const SECRET = resoudreSecret()

// Durée de validité d'une session (jours). Révocable côté serveur (revérif en base).
const DUREE_JOURS = 30

export type SessionData = { userId: number; role: 'ADMIN' | 'ELU'; exp?: number }

function signer(payload: string): string {
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex')
  return `${payload}.${sig}`
}

// Vérifie signature HMAC + expiration. Pur (pas d'accès base) → utilisable dans le proxy.
export function verifierToken(token: string): SessionData | null {
  const i = token.lastIndexOf('.')
  if (i < 0) return null
  const payload = token.slice(0, i)
  const sig = token.slice(i + 1)
  const attendu = crypto.createHmac('sha256', SECRET).update(payload).digest('hex')
  if (sig.length !== attendu.length) return null
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(attendu))) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64').toString()) as SessionData
    if (data.exp && Date.now() > data.exp) return null // expiré
    return data
  } catch {
    return null
  }
}

export async function creerSession(data: SessionData) {
  const avecExp: SessionData = { ...data, exp: Date.now() + DUREE_JOURS * 86400000 }
  const payload = Buffer.from(JSON.stringify(avecExp)).toString('base64')
  const token = signer(payload)
  const store = await cookies()
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * DUREE_JOURS,
  })
}

// Lit la session ET revérifie l'utilisateur en base : un compte désactivé,
// anonymisé ou rétrogradé perd l'accès immédiatement (pas au bout de 30 j).
// Le rôle renvoyé vient TOUJOURS de la base, jamais du cookie.
export async function lireSession(): Promise<SessionData | null> {
  const store = await cookies()
  const c = store.get(COOKIE)
  if (!c) return null
  const token = verifierToken(c.value)
  if (!token) return null
  // import dynamique pour éviter de charger Prisma dans le proxy
  const { prisma } = await import('@/lib/db')
  try {
    const user = await prisma.user.findUnique({
      where: { id: token.userId },
      select: { actif: true, role: true, anonymiseLe: true },
    })
    if (!user || !user.actif || user.anonymiseLe) return null
    return { userId: token.userId, role: user.role }
  } catch {
    // DB brièvement indisponible : on renvoie null (→ redirection connexion) plutôt
    // qu'une 500 brute sur toutes les pages authentifiées.
    return null
  }
}

export async function detruireSession() {
  const store = await cookies()
  store.delete(COOKIE)
}
