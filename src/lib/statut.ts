export type Statut = {
  nom: string
  couleur: string // couleur d'aplat (badge, jauge) — vif
  couleurTexte: string // variante accessible pour texte sur fond clair (>= 4.5:1)
  icone: string // forme/symbole pour ne pas dépendre de la seule couleur
}

const NON_DEMARRE: Statut = { nom: 'Non démarré', couleur: '#9A9AA0', couleurTexte: '#6E6E73', icone: '○' }
const ENGAGE: Statut = { nom: 'Engagé', couleur: '#C98A1A', couleurTexte: '#8A5E0F', icone: '◔' }
const EN_COURS: Statut = { nom: 'En cours', couleur: '#EE6B3E', couleurTexte: '#C0461F', icone: '◑' }
const REALISE: Statut = { nom: 'Réalisé', couleur: '#3A8540', couleurTexte: '#2E6B33', icone: '✓' }

export function statutDe(avancement: number): Statut {
  const v = Math.max(0, Math.min(100, Math.round(avancement)))
  if (v <= 0) return NON_DEMARRE
  if (v < 34) return ENGAGE
  if (v < 100) return EN_COURS
  return REALISE
}

export const STATUTS = [NON_DEMARRE, ENGAGE, EN_COURS, REALISE]
