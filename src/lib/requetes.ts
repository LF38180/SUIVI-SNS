import { prisma } from '@/lib/db'

export async function toutesLesMesures() {
  return prisma.mesure.findMany({
    orderBy: { ordre: 'asc' },
    include: {
      eluReferent: true,
      adjointRattachement: true,
      coReferents: { include: { user: true } },
      historique: { orderBy: { date: 'desc' }, take: 1 },
    },
  })
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
