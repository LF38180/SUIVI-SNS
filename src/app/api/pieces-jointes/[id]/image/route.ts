import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'

// Sert le binaire d'une pièce jointe (photo/document) stockée en base64.
// Réservé aux utilisateurs connectés (les pièces jointes sont internes) :
// sans ce contrôle, n'importe qui pourrait énumérer /api/pieces-jointes/N/image.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await lireSession()
  if (!session) return new NextResponse('Non autorisé', { status: 401 })

  const { id } = await params
  const blob = await prisma.pieceJointeBlob.findUnique({ where: { pieceJointeId: Number(id) } })
  if (!blob || !blob.contenu) {
    return new NextResponse('Introuvable', { status: 404 })
  }
  // contenu = data URL "data:<mime>;base64,xxxx"
  const m = blob.contenu.match(/^data:([^;]+);base64,(.*)$/)
  if (!m) return new NextResponse('Format invalide', { status: 415 })
  const mime = m[1]
  const buffer = Buffer.from(m[2], 'base64')
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': mime,
      // privé : ne pas mettre en cache sur des proxies partagés (donnée interne)
      'Cache-Control': 'private, max-age=86400',
    },
  })
}
