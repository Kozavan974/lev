import { describe, expect, it } from 'vitest'
import { INTERVALLE_EVALUATION_MS } from './constantes'
import { sondageEchu } from './sondage'

describe('sondage du plein écran', () => {
  it('attend qu’un rappel soit à échéance, puis respecte 15 secondes', () => {
    expect(sondageEchu(false, null, 0)).toBe(false)
    expect(sondageEchu(true, null, 0)).toBe(true)
    expect(sondageEchu(true, 1_000, 1_000 + INTERVALLE_EVALUATION_MS - 1)).toBe(false)
    expect(sondageEchu(true, 1_000, 1_000 + INTERVALLE_EVALUATION_MS)).toBe(true)
  })
})
