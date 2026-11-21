import { describe, expect, it } from 'vitest'
import { PAUSE_GUIDEE_MS, progressionAnneau } from './anneauPause'

describe('anneau de pause guidée', () => {
  it('part de 0, atteint 1 à 30 secondes, et reste dans les bornes', () => {
    expect(PAUSE_GUIDEE_MS).toBe(30_000)
    expect(progressionAnneau(0)).toBe(0)
    expect(progressionAnneau(-10)).toBe(0)
    expect(progressionAnneau(Number.NaN)).toBe(0)
    expect(progressionAnneau(15_000)).toBe(0.5)
    expect(progressionAnneau(PAUSE_GUIDEE_MS)).toBe(1)
    expect(progressionAnneau(PAUSE_GUIDEE_MS + 5_000)).toBe(1)
  })
})
