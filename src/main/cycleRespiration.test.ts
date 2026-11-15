import { describe, expect, it } from 'vitest'
import {
  avancerPhase,
  echelleArrivee,
  echelleDepart,
  ouvrirSeance,
  type RythmeRespiration
} from '../partage/cycleRespiration'

const CARREE: RythmeRespiration = {
  inspiration: 4,
  pleine: 4,
  expiration: 4,
  vide: 4,
  minutes: 1
}

describe('cycle de respiration', () => {
  it('ouvre sur l’inspiration et enchaîne les quatre temps', () => {
    const seance = ouvrirSeance(CARREE, 0)
    expect(seance).toMatchObject({ phase: 'inspiration', dureePhaseMs: 4000, terminee: false })
    const pleine = avancerPhase(seance, CARREE)
    expect(pleine).toMatchObject({ phase: 'pleine', debutPhaseMs: 4000, dureePhaseMs: 4000 })
    const expiration = avancerPhase(pleine, CARREE)
    const vide = avancerPhase(expiration, CARREE)
    expect(vide.phase).toBe('vide')
    expect(avancerPhase(vide, CARREE).phase).toBe('inspiration')
  })

  it('retire du cycle une pause réglée à 0', () => {
    const apaisante: RythmeRespiration = {
      inspiration: 4,
      pleine: 0,
      expiration: 6,
      vide: 0,
      minutes: 1
    }
    const seance = ouvrirSeance(apaisante, 0)
    const suivante = avancerPhase(seance, apaisante)
    expect(suivante).toMatchObject({ phase: 'expiration', dureePhaseMs: 6000 })
    expect(avancerPhase(suivante, apaisante).phase).toBe('inspiration')
  })

  it('applique un réglage modifié au temps suivant', () => {
    const seance = ouvrirSeance(CARREE, 0)
    const modifie: RythmeRespiration = { ...CARREE, pleine: 8 }
    const suivante = avancerPhase(seance, modifie)
    expect(suivante).toMatchObject({ phase: 'pleine', dureePhaseMs: 8000, debutPhaseMs: 4000 })
  })

  it('termine à la fin du cycle qui atteint la durée', () => {
    let seance = ouvrirSeance(CARREE, 0)
    let gardes = 0
    while (!seance.terminee && gardes < 40) {
      seance = avancerPhase(seance, CARREE)
      gardes += 1
    }
    expect(seance.terminee).toBe(true)
    expect(seance.debutPhaseMs).toBe(64_000)
  })

  it('raccourcit la durée sans couper le cycle en cours', () => {
    const longue: RythmeRespiration = { ...CARREE, minutes: 5 }
    let seance = ouvrirSeance(longue, 0)
    let gardes = 0
    while (seance.debutPhaseMs < 48_000 && gardes < 40) {
      seance = avancerPhase(seance, longue)
      gardes += 1
    }
    expect(seance.terminee).toBe(false)
    const courte: RythmeRespiration = { ...CARREE, minutes: 1 }
    while (!seance.terminee && gardes < 80) {
      seance = avancerPhase(seance, courte)
      gardes += 1
    }
    expect(seance.debutPhaseMs).toBe(64_000)
  })

  it('place la bulle selon le temps', () => {
    expect(echelleDepart('inspiration')).toBe(0.55)
    expect(echelleArrivee('inspiration')).toBe(1)
    expect(echelleDepart('pleine')).toBe(1)
    expect(echelleArrivee('pleine')).toBe(1)
    expect(echelleDepart('expiration')).toBe(1)
    expect(echelleArrivee('expiration')).toBe(0.55)
    expect(echelleDepart('vide')).toBe(0.55)
    expect(echelleArrivee('vide')).toBe(0.55)
  })
})
