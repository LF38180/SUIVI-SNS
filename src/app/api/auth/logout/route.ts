import { NextResponse } from 'next/server'
import { detruireSession } from '@/lib/session'

export async function POST(req: Request) {
  await detruireSession()
  // Derrière le proxy Railway, req.url porte l'hôte interne (0.0.0.0:8080). On
  // reconstruit l'URL publique depuis les en-têtes transmis par le proxy, avec
  // repli sur l'hôte de la requête si absents.
  const h = req.headers
  const hote = h.get('x-forwarded-host') ?? h.get('host')
  const protocole = h.get('x-forwarded-proto') ?? 'https'
  const base = hote ? `${protocole}://${hote}` : new URL(req.url).origin
  return NextResponse.redirect(`${base}/connexion`, 303)
}
