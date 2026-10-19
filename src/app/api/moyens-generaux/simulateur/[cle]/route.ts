import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { peutValider } from '@/lib/permissions'
import { exigerMoyensGenerauxApi, estReponse, cleValide } from '@/lib/moyens-generaux'
import {
  lireExemplaire, lireReference, lireExemplaireDe,
  ecrireExemplaire, ecrireReference, ConflitVersion, CorpsTropGros,
} from '@/lib/documents-pole'

async function nomDe(userId: number): Promise<string> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { nom: true } })
  return u?.nom ?? `#${userId}`
}

// GET /{cle}            → exemplaire de l'appelant (sinon référence v0, sinon 404)
// GET /{cle}?reference=1 → référence (tout membre)
// GET /{cle}?userId=N    → exemplaire d'un autre membre (ADMIN seul)
export async function GET(req: NextRequest, { params }: { params: Promise<{ cle: string }> }) {
  const session = await exigerMoyensGenerauxApi()
  if (estReponse(session)) return session
  const { cle } = await params
  if (!cleValide(cle)) return NextResponse.json({ erreur: 'Clé inconnue' }, { status: 400 })

  const sp = req.nextUrl.searchParams
  if (sp.get('reference') === '1') {
    const d = await lireReference(cle)
    return d ? NextResponse.json(d) : NextResponse.json({ erreur: 'Aucune référence' }, { status: 404 })
  }
  const userIdParam = sp.get('userId')
  if (userIdParam) {
    if (!peutValider(session.role)) return NextResponse.json({ erreur: 'Accès refusé' }, { status: 403 })
    const d = await lireExemplaireDe(cle, Number(userIdParam))
    return d ? NextResponse.json(d) : NextResponse.json({ erreur: 'Introuvable' }, { status: 404 })
  }
  // ppi-donnees n'a pas d'exemplaire perso : c'est une référence pure. On renvoie
  // la référence avec sa VRAIE version et source:'perso' pour que le client
  // conserve la version (il ne garde la version que si source==='perso'), sinon
  // il repartirait à 0 → 409 systématique au prochain import DRF.
  if (cle === 'ppi-donnees') {
    const d = await lireReference(cle)
    return d ? NextResponse.json({ ...d, source: 'perso' }) : NextResponse.json({ erreur: 'Introuvable' }, { status: 404 })
  }
  const d = await lireExemplaire(cle, session.userId)
  return d ? NextResponse.json(d) : NextResponse.json({ erreur: 'Introuvable' }, { status: 404 })
}

// PUT /{cle} {contenu, version} → écrit l'exemplaire de l'appelant (ou la référence
// pour ppi-donnees, ADMIN seul). 409 si version périmée.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ cle: string }> }) {
  const session = await exigerMoyensGenerauxApi()
  if (estReponse(session)) return session
  const { cle } = await params
  if (!cleValide(cle)) return NextResponse.json({ erreur: 'Clé inconnue' }, { status: 400 })

  // Lit en texte d'abord pour plafonner la taille AVANT de parser (évite qu'un corps
  // arbitrairement gros soit mis en mémoire/parsé).
  const brut = await req.text()
  if (Buffer.byteLength(brut) > 2_100_000) {
    return NextResponse.json({ erreur: 'Document trop volumineux (max 2 Mo)' }, { status: 413 })
  }
  let body: { contenu?: unknown; version?: number }
  try {
    body = JSON.parse(brut || '{}')
  } catch {
    return NextResponse.json({ erreur: 'Corps invalide' }, { status: 400 })
  }
  const version = typeof body.version === 'number' ? body.version : 0
  const nom = await nomDe(session.userId)

  try {
    // ppi-donnees : donnée d'entrée de la DRF → référence, ADMIN seulement.
    if (cle === 'ppi-donnees') {
      if (!peutValider(session.role)) return NextResponse.json({ erreur: 'Accès refusé' }, { status: 403 })
      const r = await ecrireReference(cle, session.userId, nom, body.contenu, version)
      return NextResponse.json(r)
    }
    const r = await ecrireExemplaire(cle, session.userId, nom, body.contenu, version)
    return NextResponse.json(r)
  } catch (e) {
    if (e instanceof ConflitVersion) return NextResponse.json(e.courant, { status: 409 })
    if (e instanceof CorpsTropGros) return NextResponse.json({ erreur: 'Document trop volumineux (max 2 Mo)' }, { status: 413 })
    throw e
  }
}
