function borner(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)))
}

export function calculerEffetValidation(input: {
  avancementPublie: number
  avancementPropose: number
}) {
  const nouveau = borner(input.avancementPropose)
  return {
    nouveauAvancementPublie: nouveau,
    entreeHistorique: { ancienPourcent: input.avancementPublie, nouveauPourcent: nouveau },
  }
}

export function calculerEffetRefus(input: { avancementPublie: number }) {
  return {
    nouveauAvancementPublie: input.avancementPublie,
    entreeHistorique: null,
  }
}
