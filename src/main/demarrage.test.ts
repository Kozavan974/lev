import { describe, expect, it } from 'vitest'
import { deciderOuverture, ecranApresRelance, estDemarrageAuto } from './demarrage'

describe('ouverture au lancement', () => {
  it("ouvre la bienvenue tant que le premier lancement n'est pas fait", () => {
    expect(deciderOuverture({ premierLancementFait: false, demarrageAuto: false })).toBe('accueil')
    expect(deciderOuverture({ premierLancementFait: false, demarrageAuto: true })).toBe('accueil')
  })

  it('reste discret quand Windows lance Lèv', () => {
    expect(deciderOuverture({ premierLancementFait: true, demarrageAuto: true })).toBe('discret')
  })

  it('ouvre Mes rappels quand la personne lance Lèv', () => {
    expect(deciderOuverture({ premierLancementFait: true, demarrageAuto: false })).toBe('rappels')
  })

  it("reconnaît l'argument de démarrage automatique", () => {
    expect(estDemarrageAuto(['Lèv.exe', '--demarrage-auto'])).toBe(true)
    expect(estDemarrageAuto(['Lèv.exe'])).toBe(false)
    expect(estDemarrageAuto(['Lèv.exe', '--demarrage-automatique'])).toBe(false)
  })
})

describe('seconde instance', () => {
  it('laisse la bienvenue au premier plan', () => {
    expect(ecranApresRelance(false)).toBe('accueil')
  })

  it("ouvre Mes rappels une fois l'accueil terminé", () => {
    expect(ecranApresRelance(true)).toBe('rappels')
  })
})
