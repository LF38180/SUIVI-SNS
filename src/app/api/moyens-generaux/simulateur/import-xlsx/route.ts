import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { peutValider } from '@/lib/permissions'
import { exigerMoyensGenerauxApi, estReponse } from '@/lib/moyens-generaux'
import { lireReference, ecrireReference } from '@/lib/documents-pole'
import { convertirXlsx, type PpiConverti } from '@/lib/ppi-xlsx'

export const runtime = 'nodejs'

// POST import-xlsx (multipart, champ 'fichier') : convertit le .xlsx « PPI COMMUNE »
// en JSON et l'écrit dans la référence ppi-donnees. ADMIN seulement (comme tout
// chargement de PPI). Le simulateur n'est pas touché : il lira ppi-donnees comme avant.
export async function POST(req: NextRequest) {
  const session = await exigerMoyensGenerauxApi()
  if (estReponse(session)) return session
  if (!peutValider(session.role)) return NextResponse.json({ erreur: 'Réservé à l’administrateur' }, { status: 403 })

  // Refuse un corps trop gros AVANT de le bufferiser (formData met tout en RAM).
  const cl = Number(req.headers.get('content-length') || 0)
  if (cl > 26_000_000) return NextResponse.json({ erreur: 'Fichier trop volumineux (max ~25 Mo)' }, { status: 413 })

  const form = await req.formData().catch(() => null)
  const f = form?.get('fichier')
  if (!(f instanceof File)) return NextResponse.json({ erreur: 'Aucun fichier reçu' }, { status: 400 })
  if (f.size > 25_000_000) return NextResponse.json({ erreur: 'Fichier trop volumineux' }, { status: 413 })
  if (!/\.xlsx$/i.test(f.name)) return NextResponse.json({ erreur: 'Attendu : un fichier .xlsx' }, { status: 400 })

  const buf = Buffer.from(await f.arrayBuffer())

  // PPI de référence actuel → réutiliser les id (diff correct côté simulateur)
  const refActuelle = await lireReference('ppi-donnees')
  const ref = (refActuelle?.contenu as PpiConverti | undefined) ?? null

  const version = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' }).format(new Date())
  let ppi: PpiConverti
  try {
    ppi = convertirXlsx(buf, version, ref && ref.dep ? ref : null)
  } catch (e) {
    return NextResponse.json({ erreur: e instanceof Error ? e.message : 'Conversion impossible' }, { status: 422 })
  }

  const anomalies = ppi.anomalies ?? []
  // Le simulateur n'attend pas le champ anomalies : on le retire du document stocké.
  const aStocker: PpiConverti = { version: ppi.version, years: ppi.years, dep: ppi.dep }

  const u = await prisma.user.findUnique({ where: { id: session.userId }, select: { nom: true } })
  const versionAttendue = refActuelle?.version ?? 0
  try {
    await ecrireReference('ppi-donnees', session.userId, u?.nom ?? `#${session.userId}`, aStocker, versionAttendue)
  } catch (e) {
    if (e && typeof e === 'object' && e.constructor?.name === 'ConflitVersion') {
      return NextResponse.json({ erreur: 'Un autre import vient de modifier le PPI. Rechargez la page et réessayez.' }, { status: 409 })
    }
    if (e && typeof e === 'object' && e.constructor?.name === 'CorpsTropGros') {
      return NextResponse.json({ erreur: 'PPI trop volumineux (max 2 Mo après conversion).' }, { status: 413 })
    }
    throw e
  }

  // bilan pour l'écran
  const anciens = new Set((ref?.dep ?? []).map((d) => d.id))
  const nouveaux = new Set(ppi.dep.map((d) => d.id))
  const ajoutees = ppi.dep.filter((d) => !anciens.has(d.id)).length
  const disparues = (ref?.dep ?? []).filter((d) => !nouveaux.has(d.id)).length

  return NextResponse.json({
    ok: true,
    version,
    lignes: ppi.dep.length,
    ajoutees,
    disparues,
    total2026: ppi.dep.reduce((s, d) => s + (d.y['2026'] || 0), 0),
    anomalies: anomalies.length,
  })
}
