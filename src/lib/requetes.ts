import { cache } from 'react'
import { prisma } from '@/lib/db'

// "Aujourd'hui" au fuseau de la commune (Europe/Paris), au format yyyy-mm-dd.
// Évite qu'une mesure soit comptée "en retard" un jour trop tôt à cause d'UTC.
export function aujourdhuiParis(): string {
  return new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(new Date())
}

// Include standard pour charger les élus rattachés (modèle à plat) triés :
// responsables d'abord (RESPONSABLE < CONCERNE alphabétiquement), puis par nom.
export const INCLUDE_RESPONSABLES = {
  responsables: {
    include: { user: { select: { id: true, nom: true, fonction: true } } },
    orderBy: [{ role: 'asc' as const }, { user: { nom: 'asc' as const } }],
  },
}

// Sépare une liste de rattachements en { responsables, concernes } (noms + ids).
export function separerRoles(
  responsables: { role: string; user: { id: number; nom: string; fonction?: string | null } }[],
) {
  return {
    responsables: responsables.filter((r) => r.role === 'RESPONSABLE').map((r) => r.user),
    concernes: responsables.filter((r) => r.role === 'CONCERNE').map((r) => r.user),
  }
}

// cache() : dédoublonne l'appel dans un même rendu (page + generateMetadata + og-image)
export const toutesLesMesures = cache(async function toutesLesMesures() {
  return prisma.mesure.findMany({
    where: { deletedAt: null },
    orderBy: { ordre: 'asc' },
    include: {
      ...INCLUDE_RESPONSABLES,
      historique: { orderBy: { date: 'desc' }, take: 1 },
    },
  })
})

// Mesures "à surveiller" pour l'admin : en retard (échéance dépassée, non réalisée)
// ou dormantes (aucune validation depuis 90 jours). Groupées par référent.
export async function mesuresASurveiller() {
  const mesures = await prisma.mesure.findMany({
    where: { deletedAt: null },
    include: { ...INCLUDE_RESPONSABLES, historique: { orderBy: { date: 'desc' }, take: 1 } },
  })
  const now = Date.now()
  const seuilDormance = 90 * 86400000
  const aujourdhui = aujourdhuiParis()

  const items = mesures
    .map((m) => {
      const derniere = m.historique[0]?.date ?? null
      const enRetard =
        m.echeanceCible != null &&
        m.echeanceCible.toISOString().slice(0, 10) < aujourdhui &&
        m.avancementPublie < 100
      const dormante = m.avancementPublie < 100 && (!derniere || now - derniere.getTime() > seuilDormance)
      return { m, enRetard, dormante }
    })
    .filter((x) => x.enRetard || x.dormante)

  // grouper par 1er responsable (modèle à plat)
  const parReferent = new Map<string, typeof items>()
  for (const it of items) {
    const resp = it.m.responsables.find((r) => r.role === 'RESPONSABLE')?.user.nom ?? 'Sans responsable'
    if (!parReferent.has(resp)) parReferent.set(resp, [])
    parReferent.get(resp)!.push(it)
  }
  return [...parReferent.entries()].sort((a, b) => a[0].localeCompare(b[0]))
}

// Mesures avec une échéance cible, triées par date. Pour la frise/échéancier admin.
export async function mesuresAvecEcheance() {
  const mesures = await prisma.mesure.findMany({
    where: { deletedAt: null, echeanceCible: { not: null } },
    orderBy: { echeanceCible: 'asc' },
    include: INCLUDE_RESPONSABLES,
  })
  const aujourdhui = aujourdhuiParis()
  return mesures.map((m) => ({
    id: m.id,
    intitule: m.intitule,
    referent: m.responsables.find((r) => r.role === 'RESPONSABLE')?.user.nom ?? null,
    avancementPublie: m.avancementPublie,
    echeance: m.echeanceCible!.toISOString().slice(0, 10),
    enRetard: m.echeanceCible!.toISOString().slice(0, 10) < aujourdhui && m.avancementPublie < 100,
  }))
}

// Formate une date relative simple en français ("il y a 3 jours", "aujourd'hui").
export function depuis(date: Date | null | undefined): string | null {
  if (!date) return null
  const jours = Math.floor((Date.now() - date.getTime()) / 86400000)
  if (jours <= 0) return "aujourd'hui"
  if (jours === 1) return 'hier'
  if (jours < 31) return `il y a ${jours} jours`
  const mois = Math.floor(jours / 30)
  if (mois === 1) return 'il y a 1 mois'
  if (mois < 12) return `il y a ${mois} mois`
  const ans = Math.floor(jours / 365)
  return ans === 1 ? 'il y a 1 an' : `il y a ${ans} ans`
}

export function moyenne(valeurs: number[]): number {
  if (!valeurs.length) return 0
  return Math.round(valeurs.reduce((a, b) => a + b, 0) / valeurs.length)
}

export type AxeAgg = { axe: string; pourcent: number; nb: number; realisees: number }

export function agregatsParAxe(mesures: { categorie: string; avancementPublie: number }[]): AxeAgg[] {
  const axes = ['AXE_1', 'AXE_2', 'AXE_3', 'AXE_4']
  return axes.map((a) => {
    const ms = mesures.filter((m) => m.categorie === a)
    return {
      axe: a,
      pourcent: moyenne(ms.map((m) => m.avancementPublie)),
      nb: ms.length,
      realisees: ms.filter((m) => m.avancementPublie >= 100).length,
    }
  })
}
