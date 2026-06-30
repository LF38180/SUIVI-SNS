import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'

// Taille max d'un contenu base64 stocké en base (~2 Mo de fichier ≈ 2.7 Mo en base64)
const MAX_BASE64 = 3_000_000

export async function POST(req: NextRequest) {
  const session = await lireSession()
  if (!session) return NextResponse.json({ erreur: 'Non authentifié' }, { status: 401 })

  const body = await req.json()
  const { mesureId, type, legende } = body
  if (!mesureId || !type) {
    return NextResponse.json({ erreur: 'Données invalides' }, { status: 400 })
  }

  if (type === 'LIEN') {
    if (!body.url || typeof body.url !== 'string') {
      return NextResponse.json({ erreur: 'URL requise' }, { status: 400 })
    }
    const piece = await prisma.pieceJointe.create({
      data: { mesureId: Number(mesureId), type: 'LIEN', url: String(body.url), legende: legende ?? null, ajouteeParId: session.userId },
    })
    return NextResponse.json({ ok: true, id: piece.id })
  }

  // PHOTO ou DOCUMENT : contenu = data URL base64
  if (type === 'PHOTO' || type === 'DOCUMENT') {
    const contenu = body.contenu
    if (!contenu || typeof contenu !== 'string' || !contenu.startsWith('data:')) {
      return NextResponse.json({ erreur: 'Fichier invalide' }, { status: 400 })
    }
    if (contenu.length > MAX_BASE64) {
      return NextResponse.json({ erreur: 'Fichier trop volumineux (max ~2 Mo)' }, { status: 413 })
    }
    const piece = await prisma.pieceJointe.create({
      data: {
        mesureId: Number(mesureId),
        type,
        nomFichier: body.nomFichier ? String(body.nomFichier) : null,
        mimeType: body.mimeType ? String(body.mimeType) : null,
        legende: legende ?? null,
        ajouteeParId: session.userId,
        // contenu binaire isolé dans la table blob
        blob: { create: { contenu } },
      },
    })
    return NextResponse.json({ ok: true, id: piece.id })
  }

  return NextResponse.json({ erreur: 'Type inconnu' }, { status: 400 })
}
