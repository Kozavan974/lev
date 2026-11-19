import { describe, expect, it } from 'vitest'
import { estVersionsTechniques, versionsTechniquesDepuis } from '../partage/versions'

const COMPLET = {
  version: '1.0.0',
  electron: '44.7.2',
  chrome: '138.0.7204.251'
}

describe('versions techniques', () => {
  it('retient Lèv, Electron et Chromium', () => {
    expect(versionsTechniquesDepuis(COMPLET)).toEqual(COMPLET)
    expect(estVersionsTechniques(COMPLET)).toBe(true)
  })

  it('reste silencieuse si un numéro manque', () => {
    expect(versionsTechniquesDepuis({ electron: '44.7.2', chrome: '138.0.7204.251' })).toBeNull()
    expect(versionsTechniquesDepuis({ version: '1.0.0', chrome: '138.0.7204.251' })).toBeNull()
    expect(versionsTechniquesDepuis({ version: '1.0.0', electron: '44.7.2' })).toBeNull()
    expect(versionsTechniquesDepuis({ version: '', electron: '44.7.2', chrome: '138' })).toBeNull()
    expect(versionsTechniquesDepuis({ version: '1.1.0', electron: '', chrome: '138' })).toBeNull()
    expect(
      versionsTechniquesDepuis({ version: '1.1.0', electron: '44.7.2', chrome: '' })
    ).toBeNull()
    expect(estVersionsTechniques({ electron: '44.7.2', chrome: '138' })).toBe(false)
    expect(estVersionsTechniques(null)).toBe(false)
  })
})
