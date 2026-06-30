import { describe, it, expect } from 'vitest'
import { reconstruireCourbe, Validation } from '@/lib/evolution'

describe('reconstruireCourbe', () => {
  it('renvoie vide si aucune mesure', () => {
    expect(reconstruireCourbe(new Map(), [], 0)).toEqual([])
  })

  it('sans historique : un seul point = moyenne actuelle', () => {
    const actuels = new Map([
      [1, 50],
      [2, 100],
    ])
    const r = reconstruireCourbe(actuels, [], 2)
    expect(r).toHaveLength(1)
    expect(r[0].pourcent).toBe(75)
  })

  it('reconstitue la progression dans le temps', () => {
    // 2 mesures. Actuel : m1=60, m2=40 → moyenne 50.
    // Validations : m1 0→60 le 10/01, m2 0→40 le 20/01.
    // Avant tout : 0/0 = 0. Après m1 : 60/0 = 30. Après m2 : 60/40 = 50.
    const actuels = new Map([
      [1, 60],
      [2, 40],
    ])
    const histo: Validation[] = [
      { mesureId: 1, ancienPourcent: 0, nouveauPourcent: 60, date: new Date('2029-01-10') },
      { mesureId: 2, ancienPourcent: 0, nouveauPourcent: 40, date: new Date('2029-01-20') },
    ]
    const r = reconstruireCourbe(actuels, histo, 2)
    // points chronologiques : 0 (avant), 30 (après m1), 50 (après m2 / today)
    const pourcents = r.map((p) => p.pourcent)
    expect(pourcents[0]).toBe(0)
    expect(pourcents).toContain(30)
    expect(pourcents[pourcents.length - 1]).toBe(50)
  })
})
