import { lireSession, type SessionData } from '@/lib/session'
import { peutAccederMoyensGeneraux } from '@/lib/permissions'
import { NextResponse } from 'next/server'
import { notFound } from 'next/navigation'

// Clés de documents autorisées (liste fermée : toute autre → 400).
export const CLES_DOCUMENT = ['ppi-arbitrages', 'simulateur-reglages', 'ppi-donnees'] as const
export type CleDocument = (typeof CLES_DOCUMENT)[number]
export function cleValide(c: string): c is CleDocument {
  return (CLES_DOCUMENT as readonly string[]).includes(c)
}
export const GROUPE = 'MOYENS_GENERAUX' as const

// Pour une PAGE : renvoie la session si l'accès au module est autorisé, sinon
// notFound() (on ne révèle pas l'existence du module aux autres élus).
export async function exigerMoyensGenerauxPage(): Promise<SessionData> {
  const session = await lireSession()
  if (!session || !(await peutAccederMoyensGeneraux(session))) notFound()
  return session
}

// Pour une ROUTE API : renvoie la session, ou une Response à retourner tel quel.
// Non-membre → 404 (comme les pages) pour ne pas révéler l'existence du module ;
// 401 seulement si aucune session.
export async function exigerMoyensGenerauxApi(): Promise<SessionData | NextResponse> {
  const session = await lireSession()
  if (!session) return NextResponse.json({ erreur: 'Non authentifié' }, { status: 401 })
  if (!(await peutAccederMoyensGeneraux(session))) return NextResponse.json({ erreur: 'Introuvable' }, { status: 404 })
  return session
}

export function estReponse(x: SessionData | NextResponse): x is NextResponse {
  return x instanceof NextResponse
}
