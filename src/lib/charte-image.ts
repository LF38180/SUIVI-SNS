import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

// Constantes de la CHARTE SNS (voir docs/charte-sns/CHARTE_SNS.md), partagées par
// toutes les images générées (vignette mesure, bilan global, carrousel).
export const SNS = {
  orange: '#EE6B3E',
  cream: '#FAF7F4',
  dark: '#232326',
  gray: '#6E6E73',
  green: '#478D4C',
  white: '#FFFFFF',
  railVide: '#F1DFD6',
} as const

// Polices Poppins embarquées (charte : vignettes réseaux en Poppins).
export async function policesSNS() {
  const lire = (p: 400 | 600 | 700) => readFile(join(process.cwd(), 'src/assets/fonts', `Poppins-${p}.ttf`))
  const [p400, p600, p700] = await Promise.all([lire(400), lire(600), lire(700)])
  return [
    { name: 'Poppins', data: p400, weight: 400 as const, style: 'normal' as const },
    { name: 'Poppins', data: p600, weight: 600 as const, style: 'normal' as const },
    { name: 'Poppins', data: p700, weight: 700 as const, style: 'normal' as const },
  ]
}

export function tronquer(t: string, max: number): string {
  const s = t.trim()
  return s.length <= max ? s : s.slice(0, max - 1).trimEnd() + '…'
}

export function moisAnnee(d: Date): string {
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'Europe/Paris' }).format(d)
}
