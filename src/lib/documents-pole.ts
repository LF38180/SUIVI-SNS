import { prisma } from '@/lib/db'
import { audit } from '@/lib/audit'
import { GROUPE, type CleDocument } from '@/lib/moyens-generaux'
import type { Prisma } from '@/generated/prisma'

const MAX_OCTETS = 2_000_000 // plafond body (~2 Mo)

type SortieDoc = {
  contenu: unknown
  version: number
  modifiePar: string
  modifieLe: Date
  source: 'perso' | 'reference'
}

// Lit l'exemplaire personnel ; à défaut la référence (version 0) ; sinon null.
export async function lireExemplaire(cle: CleDocument, userId: number): Promise<SortieDoc | null> {
  const perso = await prisma.documentPole.findUnique({
    where: { groupe_cle_userId: { groupe: GROUPE, cle, userId } },
  })
  if (perso) return { contenu: perso.contenu, version: perso.version, modifiePar: perso.modifiePar, modifieLe: perso.modifieLe, source: 'perso' }
  const ref = await prisma.documentPole.findFirst({
    where: { groupe: GROUPE, cle, userId: null },
  })
  if (ref) return { contenu: ref.contenu, version: 0, modifiePar: ref.modifiePar, modifieLe: ref.modifieLe, source: 'reference' }
  return null
}

export async function lireReference(cle: CleDocument): Promise<SortieDoc | null> {
  const ref = await prisma.documentPole.findFirst({
    where: { groupe: GROUPE, cle, userId: null },
  })
  if (!ref) return null
  return { contenu: ref.contenu, version: ref.version, modifiePar: ref.modifiePar, modifieLe: ref.modifieLe, source: 'reference' }
}

export async function lireExemplaireDe(cle: CleDocument, userId: number): Promise<SortieDoc | null> {
  const d = await prisma.documentPole.findUnique({
    where: { groupe_cle_userId: { groupe: GROUPE, cle, userId } },
  })
  if (!d) return null
  return { contenu: d.contenu, version: d.version, modifiePar: d.modifiePar, modifieLe: d.modifieLe, source: 'perso' }
}

export class ConflitVersion extends Error {
  constructor(public courant: SortieDoc) {
    super('conflit de version')
  }
}
export class CorpsTropGros extends Error {}

// Écrit dans un exemplaire (userId donné) ou la référence (userId null), avec
// contrôle optimiste, versionnement append-only et audit. Transaction.
async function ecrire(params: {
  cle: CleDocument
  userId: number | null
  contenu: unknown
  versionAttendue: number
  auteurNom: string
  auteurId: number
  action: string
}) {
  const { cle, userId, contenu, versionAttendue, auteurNom, auteurId, action } = params
  const taille = Buffer.byteLength(JSON.stringify(contenu ?? null))
  if (taille > MAX_OCTETS) throw new CorpsTropGros()

  const conflit = (d: { contenu: unknown; version: number; modifiePar: string; modifieLe: Date } | null) =>
    new ConflitVersion(
      d
        ? { contenu: d.contenu, version: d.version, modifiePar: d.modifiePar, modifieLe: d.modifieLe, source: userId ? 'perso' : 'reference' }
        : { contenu: null, version: 0, modifiePar: '', modifieLe: new Date(), source: userId ? 'perso' : 'reference' },
    )

  try {
    return await prisma.$transaction(async (tx) => {
      const existant = await tx.documentPole.findFirst({ where: { groupe: GROUPE, cle, userId } })
      const versionActuelle = existant?.version ?? 0
      if (versionAttendue !== versionActuelle) throw conflit(existant)
      const nouvelleVersion = versionActuelle + 1
      const data = contenu as Prisma.InputJsonValue

      let docId: number
      if (existant) {
        // Mise à jour conditionnée sur la version : si une écriture concurrente est
        // passée entre le findFirst et ici, count=0 → conflit (pas de 500).
        const maj = await tx.documentPole.updateMany({
          where: { id: existant.id, version: versionActuelle },
          data: { contenu: data, version: nouvelleVersion, modifiePar: auteurNom },
        })
        if (maj.count === 0) throw conflit(await tx.documentPole.findUnique({ where: { id: existant.id } }))
        docId = existant.id
      } else {
        // Création : l'unique (groupe,cle,userId) lève P2002 si une autre écriture
        // a créé la ligne entre-temps → converti en conflit par le catch externe.
        const cree = await tx.documentPole.create({
          data: { groupe: GROUPE, cle, userId, contenu: data, version: nouvelleVersion, modifiePar: auteurNom },
        })
        docId = cree.id
      }
      await tx.documentPoleVersion.create({ data: { documentId: docId, version: nouvelleVersion, contenu: data, auteur: auteurNom } })
      await audit({ auteurId, auteurNom, action, cible: `document-pole ${cle}${userId ? ' (perso)' : ' (référence)'}`, details: `v${nouvelleVersion}, ${taille} o` })
      return { version: nouvelleVersion, modifiePar: auteurNom, modifieLe: new Date() }
    })
  } catch (e) {
    // Violation d'unicité (course sur création ou sur DocumentPoleVersion) → conflit.
    if (e && typeof e === 'object' && 'code' in e && (e as { code?: string }).code === 'P2002') {
      const actuel = await prisma.documentPole.findFirst({ where: { groupe: GROUPE, cle, userId } })
      throw conflit(actuel)
    }
    throw e
  }
}

// Écriture dans l'exemplaire personnel de l'appelant.
export function ecrireExemplaire(cle: CleDocument, userId: number, auteurNom: string, contenu: unknown, versionAttendue: number) {
  return ecrire({ cle, userId, contenu, versionAttendue, auteurNom, auteurId: userId, action: 'SIMULATEUR_ECRITURE' })
}

// Écriture directe dans la référence (ppi-donnees, admin). versionAttendue libre.
export async function ecrireReference(cle: CleDocument, auteurId: number, auteurNom: string, contenu: unknown, versionAttendue: number) {
  return ecrire({ cle, userId: null, contenu, versionAttendue, auteurNom, auteurId, action: 'SIMULATEUR_DONNEES' })
}

// Publie l'exemplaire de l'appelant comme référence du groupe (admin).
export async function publierReference(cle: CleDocument, auteurId: number, auteurNom: string) {
  return prisma.$transaction(async (tx) => {
    const perso = await tx.documentPole.findUnique({
      where: { groupe_cle_userId: { groupe: GROUPE, cle, userId: auteurId } },
    })
    if (!perso) return null
    const ref = await tx.documentPole.findFirst({
      where: { groupe: GROUPE, cle, userId: null },
    })
    const nouvelleVersion = (ref?.version ?? 0) + 1
    const data = perso.contenu as Prisma.InputJsonValue
    const doc = ref
      ? await tx.documentPole.update({ where: { id: ref.id }, data: { contenu: data, version: nouvelleVersion, modifiePar: auteurNom } })
      : await tx.documentPole.create({ data: { groupe: GROUPE, cle, userId: null, contenu: data, version: nouvelleVersion, modifiePar: auteurNom } })
    await tx.documentPoleVersion.create({ data: { documentId: doc.id, version: nouvelleVersion, contenu: data, auteur: auteurNom } })
    await audit({ auteurId, auteurNom, action: 'SIMULATEUR_PUBLICATION', cible: `document-pole ${cle} (référence)`, details: `v${nouvelleVersion}` })
    return { version: doc.version, modifieLe: doc.modifieLe }
  })
}

// Liste des membres ayant au moins un exemplaire (pour le sélecteur admin).
export async function listerMembres() {
  const docs = await prisma.documentPole.findMany({
    where: { groupe: GROUPE, userId: { not: null } },
    distinct: ['userId'],
    select: { userId: true, modifieLe: true, user: { select: { nom: true } } },
    orderBy: { modifieLe: 'desc' },
  })
  return docs.map((d) => ({ userId: d.userId, nom: d.user?.nom ?? '—', derniereEcriture: d.modifieLe }))
}

export async function listerVersions(cle: CleDocument, userId: number | null) {
  const doc = await prisma.documentPole.findFirst({
    where: { groupe: GROUPE, cle, userId },
    select: { versions: { orderBy: { version: 'desc' }, select: { version: true, auteur: true, creeLe: true } } },
  })
  return doc?.versions ?? []
}
