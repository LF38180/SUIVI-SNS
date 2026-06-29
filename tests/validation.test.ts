import { describe, it, expect } from 'vitest'
import { calculerEffetValidation, calculerEffetRefus } from '@/lib/validation'

describe('circuit de validation', () => {
  it('valider : publié devient la valeur proposée + entrée historique', () => {
    const r = calculerEffetValidation({ avancementPublie: 10, avancementPropose: 40 })
    expect(r.nouveauAvancementPublie).toBe(40)
    expect(r.entreeHistorique).toEqual({ ancienPourcent: 10, nouveauPourcent: 40 })
  })
  it('refuser : publié inchangé, pas d historique', () => {
    const r = calculerEffetRefus({ avancementPublie: 10 })
    expect(r.nouveauAvancementPublie).toBe(10)
    expect(r.entreeHistorique).toBeNull()
  })
  it('borne les valeurs hors limites', () => {
    const r = calculerEffetValidation({ avancementPublie: 0, avancementPropose: 150 })
    expect(r.nouveauAvancementPublie).toBe(100)
  })
  it('borne les valeurs négatives à 0', () => {
    const r = calculerEffetValidation({ avancementPublie: 50, avancementPropose: -20 })
    expect(r.nouveauAvancementPublie).toBe(0)
    expect(r.entreeHistorique).toEqual({ ancienPourcent: 50, nouveauPourcent: 0 })
  })
  it('valider une valeur identique crée quand même une entrée historique tracée', () => {
    const r = calculerEffetValidation({ avancementPublie: 40, avancementPropose: 40 })
    expect(r.nouveauAvancementPublie).toBe(40)
    expect(r.entreeHistorique).toEqual({ ancienPourcent: 40, nouveauPourcent: 40 })
  })
})
