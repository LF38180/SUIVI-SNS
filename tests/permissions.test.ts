import { describe, it, expect } from 'vitest'
import { peutValider, peutProposer, peutGererComptes, peutGererMesures } from '@/lib/permissions'

describe('permissions', () => {
  it('admin peut valider', () => {
    expect(peutValider('ADMIN')).toBe(true)
    expect(peutValider('ELU')).toBe(false)
  })
  it('élu et admin peuvent proposer', () => {
    expect(peutProposer('ELU')).toBe(true)
    expect(peutProposer('ADMIN')).toBe(true)
  })
  it('seul admin gère les comptes', () => {
    expect(peutGererComptes('ADMIN')).toBe(true)
    expect(peutGererComptes('ELU')).toBe(false)
  })
  it('seul admin gère les mesures', () => {
    expect(peutGererMesures('ADMIN')).toBe(true)
    expect(peutGererMesures('ELU')).toBe(false)
  })
})
