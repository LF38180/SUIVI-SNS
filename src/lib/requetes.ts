import { prisma } from '@/lib/db'

export async function toutesLesMesures() {
  return prisma.mesure.findMany({
    orderBy: { ordre: 'asc' },
    include: { eluReferent: true, adjointRattachement: true },
  })
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
