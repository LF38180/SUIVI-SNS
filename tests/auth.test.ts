import { describe, it, expect } from 'vitest'
import { hashMotDePasse, verifierMotDePasse } from '@/lib/auth'

describe('mots de passe', () => {
  it('hash puis vérifie correctement', async () => {
    const hash = await hashMotDePasse('secret123')
    expect(hash).not.toBe('secret123')
    expect(await verifierMotDePasse('secret123', hash)).toBe(true)
  })
  it('rejette un mauvais mot de passe', async () => {
    const hash = await hashMotDePasse('secret123')
    expect(await verifierMotDePasse('mauvais', hash)).toBe(false)
  })
})
