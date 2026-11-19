import { describe, expect, it } from 'vitest'
import {
  deciderOuverture,
  ecranApresRelance,
  estDemarrageAuto,
  suiteApresAccueil
} from './demarrage'

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

describe('sortie de l’accueil', () => {
  it('écrit le fichier au premier lancement', () => {
    expect(suiteApresAccueil(false, 'fermer')).toEqual({ ecrire: true, suite: 'fermer' })
    expect(suiteApresAccueil(false, 'rappels')).toEqual({ ecrire: true, suite: 'rappels' })
  })

  it('revient à Mes rappels sans réécrire quand l’accueil est rouvert', () => {
    expect(suiteApresAccueil(true, 'fermer')).toEqual({ ecrire: false, suite: 'rappels' })
    expect(suiteApresAccueil(true, 'rappels')).toEqual({ ecrire: false, suite: 'rappels' })
  })
})
