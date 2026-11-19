import { describe, expect, it } from 'vitest'
import { microOccupe, retenirSiOccupe, sessionOccupee } from './micro'

describe('usage du microphone', () => {
  it('est actif quand la fin vaut 0 et le début est déjà inscrit', () => {
    expect(microOccupe(1n, 0n)).toBe(true)
    expect(microOccupe(42n, 0n)).toBe(true)
  })

  it('est inactif dès que la fin est inscrite', () => {
    expect(microOccupe(1n, 1n)).toBe(false)
    expect(microOccupe(5n, 9n)).toBe(false)
  })

  it('est inactif sans début d’appel', () => {
    expect(microOccupe(0n, 0n)).toBe(false)
    expect(microOccupe(0n, 4n)).toBe(false)
  })
})

describe('retenue pendant une occupation', () => {
  it('respecte la case et retient le plein écran ou le micro', () => {
    expect(retenirSiOccupe(false, sessionOccupee(true, microOccupe(1n, 0n)))).toBe(false)
    expect(retenirSiOccupe(true, sessionOccupee(false, false))).toBe(false)
    expect(retenirSiOccupe(true, sessionOccupee(true, false))).toBe(true)
    expect(retenirSiOccupe(true, sessionOccupee(false, microOccupe(1n, 0n)))).toBe(true)
    expect(retenirSiOccupe(true, sessionOccupee(false, microOccupe(1n, 8n)))).toBe(false)
  })
})
