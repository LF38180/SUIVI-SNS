import { prisma } from '@/lib/db'

// Réglages globaux avec valeurs par défaut sûres.
const DEFAUTS: Record<string, string> = {
  partage_public_autorise: 'non', // par défaut : pas de bouton de partage réseaux sociaux
}

export async function lireParametre(cle: string): Promise<string> {
  const p = await prisma.parametre.findUnique({ where: { cle } })
  return p?.valeur ?? DEFAUTS[cle] ?? ''
}

export async function partageAutorise(): Promise<boolean> {
  return (await lireParametre('partage_public_autorise')) === 'oui'
}

export async function ecrireParametre(cle: string, valeur: string) {
  await prisma.parametre.upsert({
    where: { cle },
    update: { valeur },
    create: { cle, valeur },
  })
}
