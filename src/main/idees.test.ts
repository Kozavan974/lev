import { describe, expect, it } from 'vitest'
import { indiceSuivant } from './idees'

describe('idées de mouvement', () => {
  it('ne reprend pas la même idée deux fois de suite', () => {
    const taille = 3
    let precedent: number | null = null
    for (let essai = 0; essai < 30; essai += 1) {
      const index = indiceSuivant(taille, precedent, () => ((essai * 17) % 100) / 100)
      if (precedent !== null) {
        expect(index).not.toBe(precedent)
      }
      expect(index).toBeGreaterThanOrEqual(0)
      expect(index).toBeLessThan(taille)
      precedent = index
    }
  })

  it('avance dans la liste en évitant l’indice précédent', () => {
    expect(indiceSuivant(3, 0, () => 0)).toBe(1)
    expect(indiceSuivant(3, 0, () => 0.999)).toBe(2)
    expect(indiceSuivant(3, null, () => 0)).toBe(0)
    expect(indiceSuivant(1, 0, () => 0.4)).toBe(0)
  })
})
