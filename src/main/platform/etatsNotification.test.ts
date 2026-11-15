import { describe, expect, it } from 'vitest'
import {
  QUNS_BUSY,
  QUNS_PRESENTATION_MODE,
  QUNS_RUNNING_D3D_FULL_SCREEN,
  etatRetientNotification
} from './etatsNotification'

describe('états de notification Windows', () => {
  it('retient le plein écran et le mode présentation', () => {
    expect(etatRetientNotification(QUNS_BUSY)).toBe(true)
    expect(etatRetientNotification(QUNS_RUNNING_D3D_FULL_SCREEN)).toBe(true)
    expect(etatRetientNotification(QUNS_PRESENTATION_MODE)).toBe(true)
  })

  it('ignore l’heure calme, l’écran verrouillé et l’état ordinaire', () => {
    expect(etatRetientNotification(1)).toBe(false)
    expect(etatRetientNotification(5)).toBe(false)
    expect(etatRetientNotification(6)).toBe(false)
    expect(etatRetientNotification(7)).toBe(false)
  })
})
