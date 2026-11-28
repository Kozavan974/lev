import { describe, expect, it } from 'vitest'
import { estVueNotification } from '../preload/contrat'
import { identifiantsAstuces, lireAstuce } from './astuces'
import { composerVue } from './composerNotification'
import { reglagesParDefaut } from './reglages'
import type { NotificationEnCours } from './scheduler/moteur'

describe('catalogue des astuces', () => {
  it('propose les six astuces, avec un lien seulement quand un écran existe', () => {
    expect(identifiantsAstuces()).toEqual([
      'frequence',
      'reunion',
      'respiration',
      'assis',
      'pause30',
      'poste'
    ])
    expect(lireAstuce('frequence')).toEqual({
      texte: 'Tu peux régler la fréquence de chaque rappel, et les heures où je me manifeste.',
      lien: 'Ouvrir les réglages',
      ecran: 'rappels'
    })
    expect(lireAstuce('reunion')).toEqual({
      texte: 'Le menu propose « En réunion (1 h) » pour une heure au calme.',
      lien: null,
      ecran: null
    })
    expect(lireAstuce('respiration')).toEqual({
      texte: 'Une respiration guidée de quelques minutes, si tu veux souffler.',
      lien: 'Essayer la respiration',
      ecran: 'respiration'
    })
    expect(lireAstuce('assis')).toEqual({
      texte: 'Tu peux préférer des mouvements discrets, à faire assis.',
      lien: 'Ouvrir les réglages',
      ecran: 'rappels'
    })
    expect(lireAstuce('pause30')).toEqual({
      texte: 'Sur le rappel pour marcher, une pause guidée de 30 secondes est proposée.',
      lien: null,
      ecran: null
    })
    expect(lireAstuce('poste')).toEqual({
      texte: "Le guide du poste reprend des repères de l'INRS.",
      lien: 'Voir le guide',
      ecran: 'poste'
    })
    expect(lireAstuce('inconnue')).toBeNull()
    for (const id of identifiantsAstuces()) {
      const astuce = lireAstuce(id)
      expect(astuce?.texte.length).toBeGreaterThan(0)
      expect(astuce?.texte).not.toMatch(/!/)
    }
  })

  it('pose l’astuce sur la vue, et rien quand le rappel n’en porte pas', () => {
    const reglages = reglagesParDefaut()
    const rappel = reglages.rappels[0]
    if (!rappel) {
      throw new Error('Rappel de départ manquant.')
    }
    const notification: NotificationEnCours = {
      genre: 'rappel',
      rappelId: rappel.id,
      depuisMs: 0,
      delaiMs: 20_000,
      charge: { assis: false, ideeIndex: null },
      resteAffichee: false,
      sequence: null
    }
    const astuce = lireAstuce('respiration')
    const avec = composerVue(reglages, notification, 1, astuce)
    const sans = composerVue(reglages, notification, 1)
    if (!avec || !sans) {
      throw new Error('Vue absente.')
    }
    expect(avec.astuce).toEqual(astuce)
    expect(sans.astuce).toBeNull()
    expect(estVueNotification(avec)).toBe(true)
    expect(estVueNotification(sans)).toBe(true)
    expect(estVueNotification({ ...avec, astuce: { texte: '', lien: null, ecran: null } })).toBe(
      false
    )
  })
})
