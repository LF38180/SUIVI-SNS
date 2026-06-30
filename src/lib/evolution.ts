// Reconstruit la courbe de l'avancement global moyen dans le temps,
// à partir de l'historique des validations et de l'état actuel des mesures.
//
// Principe : on connaît l'avancement publié ACTUEL de chaque mesure. Chaque
// validation a fait passer une mesure de `ancienPourcent` à `nouveauPourcent`
// à une date. En remontant le temps (de la fin vers le début), on annule chaque
// changement pour reconstituer l'état antérieur. On échantillonne la moyenne
// globale à chaque date de validation.

export type Validation = { mesureId: number; ancienPourcent: number; nouveauPourcent: number; date: Date }
export type PointCourbe = { date: string; pourcent: number }

export function reconstruireCourbe(
  avancementsActuels: Map<number, number>,
  historique: Validation[],
  nbMesures: number,
): PointCourbe[] {
  if (nbMesures === 0) return []
  // état courant = avancements actuels (copie)
  const etat = new Map(avancementsActuels)

  const moyenne = () => {
    let somme = 0
    for (const v of etat.values()) somme += v
    return Math.round(somme / nbMesures)
  }

  // tri chronologique croissant
  const tri = [...historique].sort((a, b) => a.date.getTime() - b.date.getTime())

  // point "maintenant"
  const points: PointCourbe[] = []
  const today = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(new Date())
  points.push({ date: today, pourcent: moyenne() })

  // on remonte le temps : pour chaque validation (de la plus récente à la plus ancienne),
  // on remet la mesure à son ancienne valeur, puis on enregistre la moyenne AVANT ce changement.
  for (let i = tri.length - 1; i >= 0; i--) {
    const v = tri[i]
    etat.set(v.mesureId, v.ancienPourcent)
    const jour = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(v.date)
    points.push({ date: jour, pourcent: moyenne() })
  }

  // remettre dans l'ordre chronologique + dédoublonner par date (garder le dernier point du jour)
  points.reverse()
  const parJour = new Map<string, number>()
  for (const p of points) parJour.set(p.date, p.pourcent)
  return [...parJour.entries()].map(([date, pourcent]) => ({ date, pourcent }))
}
