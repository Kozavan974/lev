import { describe, expect, it } from 'vitest'
import type { Rappel, Reglages, TypeRappel } from '../modeles'
import { reglagesParDefaut } from '../reglages'
import {
  AFFICHAGE_NOTIFICATION_AUTRE_MS,
  AFFICHAGE_NOTIFICATION_YEUX_MS,
  FENETRE_PRIORITE_MS,
  PAUSE_BOUGER_MS
} from './constantes'
import { estDansHoraires } from './horaires'
import {
  creerEtat,
  evaluer,
  repondre,
  type ChargeNotification,
  type EntreeMoteur,
  type EtatMoteur
} from './moteur'

const MINUTE = 60 * 1000
const PAS = 15 * 1000

function au(jour: number, heures: number, minutes: number, secondes = 0): Date {
  return new Date(2026, 10, jour, heures, minutes, secondes)
}

function entree(instant: Date, sessionOuverte = true, reveil = false): EntreeMoteur {
  return { maintenant: instant, inactiviteSec: 0, sessionOuverte, reveil }
}

function parType(reglages: Reglages, type: TypeRappel): Rappel {
  const trouve = reglages.rappels.find((rappel) => rappel.type === type)
  if (!trouve) {
    throw new Error(`Rappel introuvable : ${type}`)
  }
  return trouve
}

function seulement(types: readonly TypeRappel[]): Reglages {
  const reglages = reglagesParDefaut()
  return {
    ...reglages,
    rappels: reglages.rappels.map((rappel) => ({
      ...rappel,
      actif: types.includes(rappel.type)
    }))
  }
}

function amorcer(reglages: Reglages, instant: Date, etat = creerEtat()): EtatMoteur {
  return evaluer(etat, reglages, entree(instant)).etat
}

describe('moteur de rappels', () => {
  it('déclenche un rappel de 20 minutes après 20 minutes de temps actif, pas avant', () => {
    const reglages = reglagesParDefaut()
    const yeux = parType(reglages, 'yeux')
    const etat = amorcer(reglages, au(16, 8, 0))

    const tropTot = evaluer(etat, reglages, entree(au(16, 8, 19)))
    expect(tropTot.afficher).toBeNull()
    expect(tropTot.etat.compteursMs[yeux.id]).toBe(19 * MINUTE)

    const aLHeure = evaluer(tropTot.etat, reglages, entree(au(16, 8, 20)))
    expect(aLHeure.afficher?.rappelId).toBe(yeux.id)
    expect(aLHeure.afficher?.delaiMs).toBe(AFFICHAGE_NOTIFICATION_YEUX_MS)
  })

  describe('le temps ne compte pas session verrouillée, en veille, hors horaires, ou Lèv en veille', () => {
    it('ignore un court verrouillage et remet les compteurs à zéro après 3 minutes', () => {
      const reglages = seulement(['yeux'])
      const yeux = parType(reglages, 'yeux')
      let etat = amorcer(reglages, au(16, 8, 0))
      etat = evaluer(etat, reglages, entree(au(16, 8, 19))).etat

      etat = evaluer(etat, reglages, entree(au(16, 8, 21), false)).etat
      etat = evaluer(etat, reglages, entree(au(16, 8, 22), true)).etat
      const apresCourt = evaluer(etat, reglages, entree(au(16, 8, 23)))
      expect(apresCourt.afficher?.rappelId).toBe(yeux.id)

      etat = amorcer(reglages, au(16, 9, 0))
      etat = evaluer(etat, reglages, entree(au(16, 9, 10))).etat
      etat = evaluer(etat, reglages, entree(au(16, 9, 11), false)).etat
      etat = evaluer(etat, reglages, entree(au(16, 9, 21), true)).etat
      const apresLong = evaluer(etat, reglages, entree(au(16, 9, 31)))
      expect(apresLong.afficher).toBeNull()
      expect(apresLong.etat.compteursMs[yeux.id]).toBe(10 * MINUTE)
    })

    it('remet les compteurs à zéro au réveil, sans rattraper la veille', () => {
      const reglages = seulement(['yeux'])
      const yeux = parType(reglages, 'yeux')
      let etat = amorcer(reglages, au(16, 8, 0))
      etat = evaluer(etat, reglages, entree(au(16, 8, 10))).etat

      const reveil = evaluer(etat, reglages, entree(au(16, 10, 0), true, true))
      expect(reveil.afficher).toBeNull()
      expect(reveil.etat.compteursMs[yeux.id] ?? 0).toBe(0)

      const pasEncore = evaluer(reveil.etat, reglages, entree(au(16, 10, 19)))
      expect(pasEncore.afficher).toBeNull()
      const montre = evaluer(pasEncore.etat, reglages, entree(au(16, 10, 20)))
      expect(montre.afficher?.rappelId).toBe(yeux.id)
    })

    it('ne compte pas hors horaires et repart de zéro à leur ouverture', () => {
      const reglages = seulement(['yeux'])
      const yeux = parType(reglages, 'yeux')
      let etat = amorcer(reglages, au(16, 7, 0))
      const avant = evaluer(etat, reglages, entree(au(16, 7, 30)))
      expect(avant.afficher).toBeNull()
      expect(avant.etat.compteursMs[yeux.id] ?? 0).toBe(0)

      etat = evaluer(avant.etat, reglages, entree(au(16, 8, 0))).etat
      const tropTot = evaluer(etat, reglages, entree(au(16, 8, 19)))
      expect(tropTot.afficher).toBeNull()
      const aLHeure = evaluer(tropTot.etat, reglages, entree(au(16, 8, 20)))
      expect(aLHeure.afficher?.rappelId).toBe(yeux.id)
    })

    it('ne compte pas pendant la veille de Lèv et repart de zéro à la fin', () => {
      const base = seulement(['yeux'])
      const yeux = parType(base, 'yeux')
      const finVeille = au(16, 9, 0)
      const reglages: Reglages = { ...base, veilleJusqua: finVeille.toISOString() }
      let etat = amorcer(reglages, au(16, 8, 0))
      etat = evaluer(etat, reglages, entree(au(16, 8, 15))).etat

      const pendant = evaluer(etat, reglages, entree(au(16, 8, 40)))
      expect(pendant.afficher).toBeNull()
      expect(pendant.etat.compteursMs[yeux.id] ?? 0).toBe(0)

      const reglagesFinis: Reglages = { ...base }
      const reprise = evaluer(pendant.etat, reglagesFinis, entree(finVeille))
      expect(reprise.etat.veilleActive).toBe(false)
      const tropTot = evaluer(reprise.etat, reglagesFinis, entree(au(16, 9, 5)))
      expect(tropTot.afficher).toBeNull()
      const montre = evaluer(tropTot.etat, reglagesFinis, entree(au(16, 9, 20)))
      expect(montre.afficher?.rappelId).toBe(yeux.id)
    })
  })

  it('affiche un seul rappel, le plus prioritaire, quand plusieurs sont dus ensemble', () => {
    const reglages = reglagesParDefaut()
    const yeux = parType(reglages, 'yeux')
    const bouger = parType(reglages, 'bouger')
    const posture = parType(reglages, 'posture')
    const depart = au(16, 8, 0)

    const tous = presDuSeuil([yeux, bouger, posture], depart)
    const decisionTous = evaluer(tous, reglages, entree(new Date(depart.getTime() + 1000)))
    expect(decisionTous.afficher?.rappelId).toBe(posture.id)
    expect(decisionTous.etat.compteursMs[bouger.id]).toBe(0)
    expect(decisionTous.etat.compteursMs[yeux.id]).toBe(0)

    const deux = presDuSeuil([yeux, bouger], depart)
    const decisionDeux = evaluer(deux, reglages, entree(new Date(depart.getTime() + 1000)))
    expect(decisionDeux.afficher?.rappelId).toBe(bouger.id)
    expect(decisionDeux.etat.compteursMs[yeux.id]).toBe(0)
    expect(decisionDeux.afficher?.delaiMs).toBe(AFFICHAGE_NOTIFICATION_AUTRE_MS)
  })

  it('réaffiche la même notification 5 minutes après « Dans 5 min », y compris un second report', () => {
    const reglages = seulement(['bouger'])
    const bouger = parType(reglages, 'bouger')
    const charge: ChargeNotification = { assis: true, ideeIndex: 2 }
    const depart = au(16, 8, 0)
    const etat = presDuSeuil([bouger], depart)
    const montre = evaluer(etat, reglages, entree(new Date(depart.getTime() + 1000)))
    expect(montre.afficher?.rappelId).toBe(bouger.id)
    const instantReponse = new Date(depart.getTime() + 1000)

    const premier = repondre(montre.etat, reglages, 'dans5min', instantReponse, charge)
    expect(premier.message).toBe('dans5min')
    const avant = evaluer(
      premier.etat,
      reglages,
      entree(new Date(instantReponse.getTime() + 5 * MINUTE - 1000))
    )
    expect(avant.afficher).toBeNull()

    const retour = evaluer(
      avant.etat,
      reglages,
      entree(new Date(instantReponse.getTime() + 5 * MINUTE))
    )
    expect(retour.afficher?.rappelId).toBe(bouger.id)
    expect(retour.afficher?.charge).toEqual(charge)

    const second = repondre(
      retour.etat,
      reglages,
      'dans5min',
      new Date(instantReponse.getTime() + 5 * MINUTE)
    )
    const encore = evaluer(
      second.etat,
      reglages,
      entree(new Date(instantReponse.getTime() + 10 * MINUTE))
    )
    expect(encore.afficher?.rappelId).toBe(bouger.id)
    expect(encore.afficher?.charge).toEqual(charge)
  })

  it('suspend tous les rappels 5 minutes après « Je le fais » sur bouger', () => {
    const reglages = seulement(['yeux', 'bouger'])
    const yeux = parType(reglages, 'yeux')
    const bouger = parType(reglages, 'bouger')
    const depart = au(16, 8, 0)
    let etat = presDuSeuil([bouger], depart)
    etat = {
      ...etat,
      compteursMs: { ...etat.compteursMs, [yeux.id]: 10 * MINUTE }
    }
    const instant = new Date(depart.getTime() + 1000)
    const montre = evaluer(etat, reglages, entree(instant))
    expect(montre.afficher?.rappelId).toBe(bouger.id)

    const reponse = repondre(montre.etat, reglages, 'jeLeFais', instant)
    expect(reponse.message).toBe('jeLeFais')
    const pendant = evaluer(
      reponse.etat,
      reglages,
      entree(new Date(instant.getTime() + 4 * MINUTE))
    )
    expect(pendant.afficher).toBeNull()
    expect(pendant.etat.compteursMs[yeux.id]).toBe(10 * MINUTE + 1000)

    const apres = evaluer(
      pendant.etat,
      reglages,
      entree(new Date(instant.getTime() + PAUSE_BOUGER_MS + 10 * MINUTE))
    )
    expect(apres.afficher?.rappelId).toBe(yeux.id)
  })

  it('fait apparaître chaque rappel actif au moins une fois toutes les deux périodes', () => {
    const reglages = reglagesParDefaut()
    const actifs = reglages.rappels.filter((rappel) => rappel.actif && rappel.frequenceMin)
    const debut = au(16, 8, 0).getTime()
    const fin = au(16, 18, 0).getTime()
    const apparitions = simulerJournee(reglages, debut, fin)

    let precedent: { id: string; instant: number } | null = null
    for (const [instant, id] of apparitions) {
      if (precedent && precedent.instant === instant) {
        expect(precedent.id, 'deux notifications au même instant').toBe(id)
      }
      precedent = { id, instant }
    }

    for (const rappel of actifs) {
      const periode = (rappel.frequenceMin ?? 0) * MINUTE
      const instants = apparitions
        .filter((apparition) => apparition[1] === rappel.id)
        .map((apparition) => apparition[0])
      const affichage =
        rappel.type === 'yeux' ? AFFICHAGE_NOTIFICATION_YEUX_MS : AFFICHAGE_NOTIFICATION_AUTRE_MS
      // Le compteur repart quand la carte se ferme, et un rappel écarté dans la
      // fenêtre de priorité repart pour une période entière.
      const plafond = 2 * periode + affichage + FENETRE_PRIORITE_MS
      let pire = 0
      const points = [debut, ...instants, fin]
      for (let index = 1; index < points.length; index += 1) {
        pire = Math.max(pire, (points[index] ?? 0) - (points[index - 1] ?? 0))
      }
      expect(instants.length, rappel.nom).toBeGreaterThanOrEqual(
        Math.floor((fin - debut) / plafond)
      )
      expect(pire, rappel.nom).toBeLessThanOrEqual(plafond)
    }

    const eau = parType(reglages, 'libre')
    expect(apparitions.some((apparition) => apparition[1] === eau.id)).toBe(false)
  })
})

describe('horaires', () => {
  it('traite une plage qui passe minuit, selon le jour où elle commence', () => {
    const horaires = { debut: '20:00', fin: '02:00', jours: 'semaine' as const }
    const vendredi23 = au(13, 23, 0)
    const samedi01 = au(14, 1, 0)
    const samedi03 = au(14, 3, 0)
    const samedi23 = au(14, 23, 0)
    const dimanche01 = au(15, 1, 0)
    expect(vendredi23.getDay()).toBe(5)
    expect(samedi01.getDay()).toBe(6)

    expect(estDansHoraires(vendredi23, horaires)).toBe(true)
    expect(estDansHoraires(samedi01, horaires)).toBe(true)
    expect(estDansHoraires(samedi03, horaires)).toBe(false)
    expect(estDansHoraires(samedi23, horaires)).toBe(false)
    expect(estDansHoraires(dimanche01, horaires)).toBe(false)
    expect(estDansHoraires(au(14, 21, 0), { ...horaires, jours: 'jour' })).toBe(true)
  })
})

function presDuSeuil(rappels: readonly Rappel[], instant: Date): EtatMoteur {
  const compteursMs: Record<string, number> = {}
  for (const rappel of rappels) {
    const frequence = rappel.frequenceMin
    if (frequence === undefined) {
      continue
    }
    compteursMs[rappel.id] = frequence * MINUTE - 1000
  }
  return {
    ...creerEtat(),
    compteursMs,
    dernierInstantMs: instant.getTime(),
    etaitDansHoraires: true
  }
}

function simulerJournee(reglages: Reglages, debut: number, fin: number): [number, string][] {
  const apparitions: [number, string][] = []
  let etat = amorcer(reglages, new Date(debut))
  let instant = debut
  let garde = 0

  while (instant < fin) {
    garde += 1
    if (garde > 20_000) {
      throw new Error('La journée simulée ne progresse plus.')
    }
    let cible = Math.min(instant + PAS, fin)
    if (etat.notification) {
      const echeance = etat.notification.depuisMs + etat.notification.delaiMs
      if (echeance > instant && echeance < cible) {
        cible = echeance
      }
    }
    const decision = evaluer(etat, reglages, entree(new Date(cible)))
    etat = decision.etat
    if (decision.afficher) {
      apparitions.push([cible, decision.afficher.rappelId])
    }
    if (etat.notification && etat.notification.depuisMs + etat.notification.delaiMs <= cible) {
      etat = repondre(etat, reglages, 'aucune', new Date(cible)).etat
      const suite = evaluer(etat, reglages, entree(new Date(cible)))
      etat = suite.etat
      if (suite.afficher) {
        apparitions.push([cible, suite.afficher.rappelId])
      }
    }
    instant = cible
  }

  return apparitions
}
