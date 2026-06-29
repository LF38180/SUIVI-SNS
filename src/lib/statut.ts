export type Statut = { nom: string; couleur: string }

const NON_DEMARRE: Statut = { nom: 'Non démarré', couleur: '#9A9AA0' }
const ENGAGE: Statut = { nom: 'Engagé', couleur: '#C98A1A' }
const EN_COURS: Statut = { nom: 'En cours', couleur: '#EE6B3E' }
const REALISE: Statut = { nom: 'Réalisé', couleur: '#3A8540' }

export function statutDe(avancement: number): Statut {
  const v = Math.max(0, Math.min(100, Math.round(avancement)))
  if (v <= 0) return NON_DEMARRE
  if (v < 34) return ENGAGE
  if (v < 100) return EN_COURS
  return REALISE
}

export const STATUTS = [NON_DEMARRE, ENGAGE, EN_COURS, REALISE]
