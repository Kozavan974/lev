import { describe, expect, it } from 'vitest'
import { reglagesParDefaut } from '../reglages'
import { calculerEcheances } from './echeances'
import { creerEtat, type EtatMoteur } from './moteur'

const MINUTE = 60 * 1000

function au(jour: number, heures: number, minutes: number): Date {
  return new Date(2026, 10, jour, heures, minutes)
}

describe('prochaines pauses', () => {
  it('retient les deux échéances les plus proches', () => {
    const reglages = reglagesParDefaut()
    const echeances = calculerEcheances(creerEtat(), reglages, au(16, 8, 0))
    expect(echeances).toEqual([
      { nom: 'Cligner des yeux', heure: '8h20' },
      { nom: 'Marcher 5 minutes', heure: '8h30' }
    ])
  })

  it('reprend après la veille et hors horaires avec un compteur remis à zéro', () => {
    const reglages = reglagesParDefaut()
    const yeux = reglages.rappels[0]
    if (!yeux) {
      throw new Error('Rappel absent.')
    }
    const etat: EtatMoteur = {
      ...creerEtat(),
      compteursMs: { [yeux.id]: 10 * MINUTE }
    }
    expect(calculerEcheances(etat, reglages, au(16, 8, 0))[0]).toEqual({
      nom: 'Cligner des yeux',
      heure: '8h10'
    })
    expect(calculerEcheances(etat, reglages, au(16, 7, 0))[0]).toEqual({
      nom: 'Cligner des yeux',
      heure: '8h20'
    })
    const enVeille = {
      ...reglages,
      veilleJusqua: au(16, 9, 0).toISOString()
    }
    expect(calculerEcheances(etat, enVeille, au(16, 8, 30))[0]).toEqual({
      nom: 'Cligner des yeux',
      heure: '9h20'
    })
  })

  it('place un rappel à heure fixe parmi les échéances, même hors horaires', () => {
    const reglages = reglagesParDefaut()
    reglages.rappels.push({
      id: 'dejeuner',
      nom: 'Pause déjeuner',
      type: 'libre',
      origine: 'perso',
      mode: 'heure',
      heure: '12:30',
      repetition: 'semaine',
      actif: true,
      reportsDeSuite: 0
    })
    const echeances = calculerEcheances(creerEtat(), reglages, au(16, 8, 0))
    expect(echeances[0]).toEqual({ nom: 'Cligner des yeux', heure: '8h20' })
    const midi = calculerEcheances(creerEtat(), reglages, au(16, 12, 25))
    expect(midi[0]).toEqual({ nom: 'Pause déjeuner', heure: '12h30' })

    const matin = reglagesParDefaut()
    matin.rappels.push({
      id: 'tot',
      nom: 'Boire avant d’arriver',
      type: 'libre',
      origine: 'perso',
      mode: 'heure',
      heure: '07:15',
      repetition: 'jour',
      actif: true,
      reportsDeSuite: 0
    })
    expect(calculerEcheances(creerEtat(), matin, au(16, 7, 0))[0]).toEqual({
      nom: 'Boire avant d’arriver',
      heure: '7h15'
    })
  })
})
