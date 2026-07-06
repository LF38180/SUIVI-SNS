// Générateur de données de DÉMONSTRATION, déterministe et EN MÉMOIRE.
// Objectif : présenter l'outil « comme dans 2-3 ans » (mandat bien avancé) avec les
// vraies mesures, sans JAMAIS écrire dans la base (les vrais avancements restent à 0).
// Déterministe = mêmes valeurs à chaque affichage (seed sur l'id de la mesure).

import { prisma } from '@/lib/db'
import { INCLUDE_RESPONSABLES, separerRoles } from '@/lib/requetes'

// PRNG simple et déterministe (mulberry32) : une graine → une suite reproductible.
function rng(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type SituationDemo = 'NORMALE' | 'REPORTEE' | 'ADAPTEE' | 'ABANDONNEE'

export type JournalDemo = { date: Date; auteur: string; texte: string }

export type MesureDemo = {
  avancement: number
  situation: SituationDemo
  journal: JournalDemo[]
  derniereMaj: Date
}

const ACTIONS = [
  'Réunion de lancement avec les services',
  'Cadrage du budget et des moyens',
  'Rencontre avec les partenaires concernés',
  'Diagnostic de la situation existante',
  'Consultation des habitants du quartier',
  'Validation en commission municipale',
  'Lancement de l’appel d’offres',
  'Première phase de travaux engagée',
  'Point d’étape avec les associations',
  'Ajustement du calendrier prévisionnel',
  'Recrutement / mobilisation des équipes',
  'Communication auprès des Seyssinois',
  'Bilan intermédiaire présenté en conseil',
  'Coordination avec la Métropole',
]

// Date déterministe entre début de mandat (mars 2026) et « aujourd'hui démo » (juillet 2028).
const DEBUT_MANDAT = new Date('2026-03-15').getTime()
const AUJOURDHUI_DEMO = new Date('2028-07-01').getTime()

function dateEntre(r: () => number, min: number, max: number): Date {
  return new Date(min + r() * (max - min))
}

// Génère les données démo d'une mesure à partir de son id (seed) et de ses responsables.
export function genererDemoMesure(mesureId: number, noms: string[]): MesureDemo {
  const r = rng(mesureId * 2654435761)

  // Avancement crédible : la plupart entre 25 et 90, quelques-unes à 100 ou faibles.
  let avancement: number
  const d = r()
  if (d < 0.12) avancement = 100
  else if (d < 0.2) avancement = [0, 5, 10, 15][Math.floor(r() * 4)]
  else avancement = Math.round((25 + r() * 65) / 5) * 5 // paliers de 5, 25→90

  // Situation : la grande majorité NORMALE, quelques reportées/adaptées, rare abandon.
  let situation: SituationDemo = 'NORMALE'
  const s = r()
  if (s > 0.97) situation = 'ABANDONNEE'
  else if (s > 0.9) situation = 'ADAPTEE'
  else if (s > 0.82) situation = 'REPORTEE'

  // Journal : 2 à 5 actions datées, chronologiques, attribuées aux responsables.
  const nbActions = 2 + Math.floor(r() * 4)
  const dates = Array.from({ length: nbActions }, () => dateEntre(r, DEBUT_MANDAT, AUJOURDHUI_DEMO)).sort(
    (a, b) => a.getTime() - b.getTime(),
  )
  const auteurs = noms.length ? noms : ['Un élu']
  const journal: JournalDemo[] = dates.map((date, i) => ({
    date,
    auteur: auteurs[Math.floor(r() * auteurs.length)],
    texte: ACTIONS[Math.floor(r() * ACTIONS.length)] + (i === dates.length - 1 && avancement === 100 ? ' — objectif atteint ✓' : ''),
  }))

  const derniereMaj = journal.length ? journal[journal.length - 1].date : new Date(DEBUT_MANDAT)
  return { avancement, situation, journal, derniereMaj }
}

export type LigneDemo = {
  m: {
    id: number
    categorie: string
    rubrique: string
    intitule: string
    natureCout: string | null
    ordreGrandeur: string | null
    besoins: string | null
    limites: string | null
  }
  resp: { id: number; nom: string }[]
  conc: { id: number; nom: string }[]
  d: MesureDemo
}

// Charge les vraies mesures (lecture seule) et génère les données démo déterministes.
// Utilisé par toutes les pages /demo/* pour qu'elles partagent EXACTEMENT les mêmes valeurs.
export async function chargerDemo(): Promise<LigneDemo[]> {
  const mesures = await prisma.mesure.findMany({
    where: { deletedAt: null },
    orderBy: { ordre: 'asc' },
    include: INCLUDE_RESPONSABLES,
  })
  return mesures.map((m) => {
    const { responsables, concernes } = separerRoles(m.responsables)
    const noms = [...responsables, ...concernes].map((u) => u.nom)
    return {
      m: {
        id: m.id,
        categorie: m.categorie,
        rubrique: m.rubrique,
        intitule: m.intitule,
        natureCout: m.natureCout,
        ordreGrandeur: m.ordreGrandeur,
        besoins: m.besoins,
        limites: m.limites,
      },
      resp: responsables.map((u) => ({ id: u.id, nom: u.nom })),
      conc: concernes.map((u) => ({ id: u.id, nom: u.nom })),
      d: genererDemoMesure(m.id, noms),
    }
  })
}

// Reconstruit une courbe d'évolution démo globale, montante, à partir des avancements
// finaux et de dates de validation réparties sur le mandat.
export function genererCourbeDemo(avancements: number[]): { date: string; pourcent: number }[] {
  const r = rng(987654321)
  const nbPoints = 10
  const pas = (AUJOURDHUI_DEMO - DEBUT_MANDAT) / (nbPoints - 1)
  const finale = Math.round(avancements.reduce((a, b) => a + b, 0) / (avancements.length || 1))
  const points: { date: string; pourcent: number }[] = []
  for (let i = 0; i < nbPoints; i++) {
    const t = DEBUT_MANDAT + pas * i
    // progression non linéaire, légèrement bruitée, jusqu'à la moyenne finale
    const frac = i / (nbPoints - 1)
    const val = Math.max(0, Math.min(finale, Math.round(finale * frac * (0.85 + r() * 0.3))))
    points.push({ date: new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(new Date(t)), pourcent: val })
  }
  // garantir un dernier point = moyenne finale exacte
  points[points.length - 1].pourcent = finale
  return points
}
