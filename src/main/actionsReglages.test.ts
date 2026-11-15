import { describe, expect, it } from 'vitest'
import type { Rappel, Reglages, TypeRappel } from './modeles'
import { reglagesParDefaut } from './reglages'
import { executerAction, type ContexteAction, type ResultatAction } from './actionsReglages'

const identifiants: Record<TypeRappel, string> = {
  yeux: 'nouvel-yeux',
  bouger: 'nouvel-bouger',
  posture: 'nouvelle-posture',
  libre: 'nouvelle-eau'
}

function contexte(jour = 16, heures = 10, minutes = 0): ContexteAction {
  return {
    maintenant: new Date(2026, 10, jour, heures, minutes),
    nouvelId: 'nouveau-rappel',
    identifiantsBase: identifiants
  }
}

function executer(
  reglages: Reglages,
  action: Parameters<typeof executerAction>[2],
  quand = contexte()
): ResultatAction {
  const resultat = executerAction(reglages, null, action, quand)
  if (!resultat) {
    throw new Error('Action refusée.')
  }
  return resultat
}

describe('rétablir les rappels d’origine', () => {
  it('restaure les quatre rappels de base et conserve les rappels personnels', () => {
    const depart = reglagesParDefaut()
    const yeux = depart.rappels[0]
    const eau = depart.rappels[3]
    if (!yeux || !eau) {
      throw new Error('Rappels de départ manquants.')
    }
    const personnel: Rappel = {
      id: 'perso-etirer',
      nom: "M'étirer",
      type: 'libre',
      origine: 'perso',
      mode: 'heure',
      heure: '15:00',
      repetition: 'jour',
      actif: true,
      reportsDeSuite: 2
    }
    const modifie: Reglages = {
      ...depart,
      rappels: [
        { ...yeux, frequenceMin: 45, reportsDeSuite: 3 },
        ...depart.rappels.filter((rappel) => rappel.type === 'bouger' || rappel.type === 'posture'),
        personnel
      ]
    }
    const resultat = executer(modifie, { type: 'retablir' })
    expect(resultat.reglages.rappels.map((rappel) => rappel.nom)).toEqual([
      'Cligner des yeux',
      'Marcher 5 minutes',
      'Point posture',
      "Boire un verre d'eau",
      "M'étirer"
    ])
    expect(resultat.reglages.rappels.map((rappel) => rappel.frequenceMin)).toEqual([
      20,
      30,
      120,
      60,
      undefined
    ])
    expect(resultat.reglages.rappels.map((rappel) => rappel.actif)).toEqual([
      true,
      true,
      true,
      false,
      true
    ])
    expect(resultat.reglages.rappels[0]?.id).toBe(yeux.id)
    expect(resultat.reglages.rappels[3]?.id).toBe(identifiants.libre)
    expect(resultat.reglages.rappels[4]).toEqual(personnel)
    expect(resultat.annulation?.genre).toBe('restauration')

    const annule = executerAction(
      resultat.reglages,
      resultat.annulation,
      { type: 'annuler' },
      contexte()
    )
    expect(annule?.reglages.rappels).toEqual(modifie.rappels)
  })
})

describe('ajout et modification d’un rappel', () => {
  it('arme pour le lendemain un rappel créé après son heure', () => {
    const ajoute = executer(
      reglagesParDefaut(),
      {
        type: 'ajouter',
        nom: "  M'étirer  ",
        mode: 'heure',
        frequenceMin: 60,
        heure: '09:00',
        repetition: 'une'
      },
      contexte(16, 10, 0)
    )
    const cree = ajoute.reglages.rappels.at(-1)
    expect(cree?.nom).toBe("M'étirer")
    expect(cree?.origine).toBe('perso')
    expect(cree?.actif).toBe(true)
    expect(cree?.dernierDeclenchement).toBe('2026-11-16')
  })

  it('laisse un rappel créé dans sa fenêtre se déclencher aujourd’hui', () => {
    const ajoute = executer(
      reglagesParDefaut(),
      {
        type: 'ajouter',
        nom: 'Me redresser',
        mode: 'heure',
        frequenceMin: 60,
        heure: '10:00',
        repetition: 'une'
      },
      contexte(16, 10, 5)
    )
    expect(ajoute.reglages.rappels.at(-1)?.dernierDeclenchement).toBeUndefined()
  })

  it('efface le dernier déclenchement quand l’heure change pour un créneau encore à venir', () => {
    const depart = reglagesParDefaut()
    const ajoute = executer(depart, {
      type: 'ajouter',
      nom: 'Pause déjeuner',
      mode: 'heure',
      frequenceMin: 60,
      heure: '12:00',
      repetition: 'jour'
    })
    const cree = ajoute.reglages.rappels.at(-1)
    if (!cree) {
      throw new Error('Rappel absent.')
    }
    const arme: Reglages = {
      ...ajoute.reglages,
      rappels: ajoute.reglages.rappels.map((rappel) =>
        rappel.id === cree.id ? { ...rappel, dernierDeclenchement: '2026-11-16' } : rappel
      )
    }
    const change = executer(
      arme,
      { type: 'heure', id: cree.id, heure: '18:00' },
      contexte(16, 10, 0)
    )
    expect(change.reglages.rappels.at(-1)?.heure).toBe('18:00')
    expect(change.reglages.rappels.at(-1)?.dernierDeclenchement).toBeUndefined()
  })

  it('refuse un nom vide et le retrait des rappels protégés', () => {
    const depart = reglagesParDefaut()
    const yeux = depart.rappels[0]
    if (!yeux) {
      throw new Error('Rappel absent.')
    }
    expect(
      executerAction(
        depart,
        null,
        {
          type: 'ajouter',
          nom: '   ',
          mode: 'recurrent',
          frequenceMin: 60,
          heure: '15:00',
          repetition: 'jour'
        },
        contexte()
      )
    ).toBeNull()
    const eau = depart.rappels.find(
      (rappel) => rappel.origine === 'base' && rappel.type === 'libre'
    )
    if (!eau) {
      throw new Error('Rappel d’eau absent.')
    }
    expect(executerAction(depart, null, { type: 'retirer', id: yeux.id }, contexte())).toBeNull()
    expect(executerAction(depart, null, { type: 'retirer', id: eau.id }, contexte())).toBeNull()
  })
})
