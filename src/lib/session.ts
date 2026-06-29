import crypto from 'crypto'
import { cookies } from 'next/headers'

const COOKIE = 'sns_session'
const SECRET = process.env.SESSION_SECRET ?? 'dev-secret-change-me'

export type SessionData = { userId: number; role: 'ADMIN' | 'ELU' }

function signer(payload: string): string {
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex')
  return `${payload}.${sig}`
}

export function verifierToken(token: string): SessionData | null {
  const i = token.lastIndexOf('.')
  if (i < 0) return null
  const payload = token.slice(0, i)
  const sig = token.slice(i + 1)
  const attendu = crypto.createHmac('sha256', SECRET).update(payload).digest('hex')
  if (sig.length !== attendu.length) return null
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(attendu))) return null
  try {
    return JSON.parse(Buffer.from(payload, 'base64').toString()) as SessionData
  } catch {
    return null
  }
}

export async function creerSession(data: SessionData) {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64')
  const token = signer(payload)
  const store = await cookies()
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function lireSession(): Promise<SessionData | null> {
  const store = await cookies()
  const c = store.get(COOKIE)
  if (!c) return null
  return verifierToken(c.value)
}

export async function detruireSession() {
  const store = await cookies()
  store.delete(COOKIE)
}
