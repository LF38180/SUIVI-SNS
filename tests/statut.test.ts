import { describe, it, expect } from 'vitest'
import { statutDe } from '@/lib/statut'

describe('statutDe', () => {
  it('0 = Non démarré', () => {
    expect(statutDe(0).nom).toBe('Non démarré')
  })
  it('1 à 33 = Engagé', () => {
    expect(statutDe(1).nom).toBe('Engagé')
    expect(statutDe(33).nom).toBe('Engagé')
  })
  it('34 à 99 = En cours', () => {
    expect(statutDe(34).nom).toBe('En cours')
    expect(statutDe(99).nom).toBe('En cours')
  })
  it('100 = Réalisé', () => {
    expect(statutDe(100).nom).toBe('Réalisé')
  })
  it('renvoie la couleur de charte', () => {
    expect(statutDe(100).couleur).toBe('#3A8540')
    expect(statutDe(0).couleur).toBe('#9A9AA0')
  })
})
