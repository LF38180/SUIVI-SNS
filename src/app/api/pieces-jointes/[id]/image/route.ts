import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Sert le binaire d'une pièce jointe (photo/document) stockée en base64,
// au lieu de l'inliner dans le HTML SSR. Mise en cache agressive (immuable).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const piece = await prisma.pieceJointe.findUnique({ where: { id: Number(id) } })
  if (!piece || !piece.contenu) {
    return new NextResponse('Introuvable', { status: 404 })
  }
  // contenu = data URL "data:<mime>;base64,xxxx"
  const m = piece.contenu.match(/^data:([^;]+);base64,(.*)$/)
  if (!m) return new NextResponse('Format invalide', { status: 415 })
  const mime = m[1]
  const buffer = Buffer.from(m[2], 'base64')
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': mime,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
