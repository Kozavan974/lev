import { describe, expect, it } from 'vitest'
import { identifiantsAstuces } from '../astuces'
import { reglagesParDefaut } from '../reglages'
import { integrerAstuce, noterNotificationRappel, type SuiviAstuces } from './astuces'

function suivre(
  fois: number,
  suivi: SuiviAstuces,
  identifiants: readonly string[]
): { suivi: SuiviAstuces; identifiants: (string | null)[] } {
  const choisis: (string | null)[] = []
  let courant = suivi
  for (let index = 0; index < fois; index += 1) {
    const decision = noterNotificationRappel(courant, identifiants)
    courant = decision.suivi
    choisis.push(decision.identifiant)
  }
  return { suivi: courant, identifiants: choisis }
}

describe('astuces en pied de rappel', () => {
  const identifiants = identifiantsAstuces()
  const vide: SuiviAstuces = {
    afficherAstuces: true,
    astucesVues: [],
    notificationsAffichees: 0
  }

  it('reste silencieuse les deux premiers rappels, puis une fois sur quatre', () => {
    const { suivi, identifiants: choisis } = suivre(30, vide, identifiants)
    expect(choisis.slice(0, 2)).toEqual([null, null])
    expect(choisis.flatMap((id, index) => (id === null ? [] : [index + 1]))).toEqual([
      6, 10, 14, 18, 22, 26
    ])
    expect(choisis.filter((id) => id !== null)).toEqual(identifiants)
    expect(suivi.astucesVues).toEqual(identifiants)
    expect(suivi.notificationsAffichees).toBe(30)
    expect(choisis[29]).toBeNull()
  })

  it('passe une astuce déjà vue et s’arrête quand le catalogue est épuisé', () => {
    const vues = ['frequence']
    const sixieme = noterNotificationRappel(
      { afficherAstuces: true, astucesVues: vues, notificationsAffichees: 5 },
      identifiants
    )
    expect(vues).toEqual(['frequence'])
    expect(sixieme.identifiant).toBe('reunion')
    expect(sixieme.suivi.astucesVues).toEqual(['frequence', 'reunion'])

    const epuise = noterNotificationRappel(
      {
        afficherAstuces: true,
        astucesVues: identifiants,
        notificationsAffichees: 5
      },
      identifiants
    )
    expect(epuise.identifiant).toBeNull()
    expect(epuise.suivi.astucesVues).toEqual(identifiants)
    expect(epuise.suivi.notificationsAffichees).toBe(6)
  })

  it('avance le compteur sans rien afficher quand la case est décochée', () => {
    let reglages = reglagesParDefaut()
    reglages = {
      ...reglages,
      options: { ...reglages.options, afficherAstuces: false }
    }
    for (let index = 0; index < 10; index += 1) {
      const suivant = integrerAstuce(reglages, identifiants)
      expect(suivant.identifiant).toBeNull()
      reglages = suivant.reglages
    }
    expect(reglages.version).toBe(1)
    expect(reglages.notificationsAffichees).toBe(10)
    expect(reglages.astucesVues).toEqual([])
    expect(reglages.options.afficherAstuces).toBe(false)
  })

  it('écrit le suivi dans les réglages sans changer la version', () => {
    const depart = reglagesParDefaut()
    const premier = integrerAstuce(depart, identifiants)
    expect(premier.identifiant).toBeNull()
    expect(premier.reglages.version).toBe(1)
    expect(premier.reglages.notificationsAffichees).toBe(1)
    expect(premier.reglages.astucesVues).toEqual([])
    expect(premier.reglages.rappels.map((rappel) => rappel.id)).toEqual(
      depart.rappels.map((rappel) => rappel.id)
    )
  })
})
