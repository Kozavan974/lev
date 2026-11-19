import { describe, expect, it } from 'vitest'
import { versionsTechniquesDepuis } from '../partage/versions'

describe('versions techniques', () => {
  it('retient Electron et Chromium', () => {
    expect(versionsTechniquesDepuis({ electron: '44.7.2', chrome: '138.0.7204.251' })).toEqual({
      electron: '44.7.2',
      chrome: '138.0.7204.251'
    })
  })

  it('reste silencieuse si un numéro manque', () => {
    expect(versionsTechniquesDepuis({ chrome: '138.0.7204.251' })).toBeNull()
    expect(versionsTechniquesDepuis({ electron: '44.7.2' })).toBeNull()
    expect(versionsTechniquesDepuis({ electron: '', chrome: '138.0.7204.251' })).toBeNull()
    expect(versionsTechniquesDepuis({ electron: '44.7.2', chrome: '' })).toBeNull()
  })
})
