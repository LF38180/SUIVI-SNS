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
  const mimeSource = m[1].toLowerCase()
  const buffer = Buffer.from(m[2], 'base64')

  // Sécurité : ne JAMAIS renvoyer un Content-Type arbitraire fourni par l'uploadeur.
  // Un DOCUMENT "data:text/html;base64,..." servi en text/html s'exécuterait en
  // same-origin dans le contexte d'un admin (XSS stocké). On force donc une allowlist :
  // les types image reconnus sont servis inline ; tout le reste est renvoyé en
  // octet-stream + Content-Disposition attachment (téléchargé, jamais exécuté).
  const IMAGES_OK = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
  const estImage = IMAGES_OK.includes(mimeSource)
  const headers: Record<string, string> = {
    'Content-Type': estImage ? mimeSource : 'application/octet-stream',
    'X-Content-Type-Options': 'nosniff',
    // le contenu ne change jamais → cache long + revalidation par ETag (id immuable)
    'Cache-Control': 'private, max-age=31536000, immutable',
    ETag: `"pj-${id}"`,
  }
  if (!estImage) {
    headers['Content-Disposition'] = 'attachment'
  }
  return new NextResponse(new Uint8Array(buffer), { headers })
}
