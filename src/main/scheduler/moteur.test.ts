import { describe, expect, it } from 'vitest'
import { jourLocal } from '../../partage/format'
import type { Rappel, Reglages, Repetition, TypeRappel } from '../modeles'
import { reglagesParDefaut } from '../reglages'
import {
  AFFICHAGE_NOTIFICATION_AUTRE_MS,
  AFFICHAGE_NOTIFICATION_YEUX_MS,
  FENETRE_PRIORITE_MS,
  MESSAGE_REPONSE_MS,
  PAUSE_BOUGER_MS
} from './constantes'
import { estDansHoraires, finVeilleDemain } from './horaires'
import {
  appliquerEffets,
  creerEtat,
  evaluer,
  poserPauseImmediate,
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

function entree(
  instant: Date,
  sessionOuverte = true,
  reveil = false,
  pleinEcran = false
): EntreeMoteur {
  return { maintenant: instant, inactiviteSec: 0, sessionOuverte, reveil, pleinEcran }
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

describe('rappels à heure fixe', () => {
  it('désactive un rappel une seule fois après affichage, sans le rattraper s’il a été manqué', () => {
    const { reglages, id } = heureFixe('15:00', 'une')
    const montre = evaluer(amorcer(reglages, au(16, 14, 0)), reglages, entree(au(16, 15, 0)))
    expect(montre.afficher?.rappelId).toBe(id)
    const apres = appliquerEffets(reglages, montre.effets)
    expect(apres.rappels.find((rappel) => rappel.id === id)?.actif).toBe(false)
    expect(apres.rappels.find((rappel) => rappel.id === id)?.dernierDeclenchement).toBe(
      '2026-11-16'
    )

    const lendemain = evaluer(creerEtat(), apres, entree(au(17, 15, 0)))
    expect(lendemain.afficher).toBeNull()

    const manque = evaluer(creerEtat(), reglages, entree(au(16, 15, 20)))
    expect(manque.afficher).toBeNull()
    const abandonne = appliquerEffets(reglages, manque.effets)
    expect(abandonne.rappels.find((rappel) => rappel.id === id)?.actif).toBe(false)
    const pasRattrape = evaluer(creerEtat(), abandonne, entree(au(17, 15, 0)))
    expect(pasRattrape.afficher).toBeNull()
  })

  it('ne déclenche un rappel à heure fixe qu’une fois, même dans la même minute', () => {
    const { reglages, id } = heureFixe('15:00', 'jour')
    const premier = evaluer(amorcer(reglages, au(16, 14, 0)), reglages, entree(au(16, 15, 0, 5)))
    expect(premier.afficher?.rappelId).toBe(id)
    const arme = appliquerEffets(reglages, premier.effets)

    const reponse = repondre(premier.etat, arme, 'plusTard', au(16, 15, 0, 10))
    const encore = evaluer(reponse.etat, arme, entree(au(16, 15, 0, 40)))
    expect(encore.afficher).toBeNull()
    expect(encore.effets).toEqual([])

    const reporte = repondre(premier.etat, arme, 'dans5min', au(16, 15, 0, 10))
    const retour = evaluer(reporte.etat, arme, entree(au(16, 15, 5, 10)))
    expect(retour.afficher?.rappelId).toBe(id)
    expect(retour.effets).toEqual([])
  })

  it('affiche un rappel à heure fixe hors horaires, avant un récurrent, et le retient puis l’abandonne', () => {
    const { reglages, id } = heureFixe('07:30', 'jour')
    const hors = evaluer(creerEtat(), reglages, entree(au(16, 7, 30)))
    expect(hors.afficher?.rappelId).toBe(id)

    const { reglages: ensemble, id: idFixe } = heureFixe('15:00', 'jour')
    const yeuxEnsemble = parType(ensemble, 'yeux')
    const dus = presDuSeuil([yeuxEnsemble], au(16, 15, 0))
    const priorite = evaluer(dus, ensemble, entree(new Date(au(16, 15, 0).getTime() + 1000)))
    expect(priorite.afficher?.rappelId).toBe(idFixe)
    expect(priorite.etat.compteursMs[yeuxEnsemble.id]).toBe(0)

    const samedi = evaluer(
      creerEtat(),
      heureFixe('15:00', 'semaine').reglages,
      entree(au(14, 15, 0))
    )
    expect(samedi.afficher).toBeNull()
    expect(samedi.effets).toEqual([])
    const lundi = evaluer(
      creerEtat(),
      heureFixe('15:00', 'semaine').reglages,
      entree(au(16, 15, 0))
    )
    expect(lundi.afficher).not.toBeNull()

    const tenu = heureFixe('15:00', 'jour')
    const verrouille = evaluer(creerEtat(), tenu.reglages, entree(au(16, 15, 2), false))
    expect(verrouille.afficher).toBeNull()
    expect(verrouille.effets).toEqual([])
    const relache = evaluer(verrouille.etat, tenu.reglages, entree(au(16, 15, 6)))
    expect(relache.afficher?.rappelId).toBe(tenu.id)

    const plein = evaluer(creerEtat(), tenu.reglages, entree(au(16, 15, 2), true, false, true))
    expect(plein.afficher).toBeNull()
    const sorti = evaluer(plein.etat, tenu.reglages, entree(au(16, 15, 4)))
    expect(sorti.afficher?.rappelId).toBe(tenu.id)

    const veilleJusqua = au(16, 15, 20).toISOString()
    const pendant = evaluer(creerEtat(), { ...tenu.reglages, veilleJusqua }, entree(au(16, 15, 5)))
    expect(pendant.afficher).toBeNull()
    expect(pendant.effets).toEqual([])
    const tropTard = evaluer(
      pendant.etat,
      { ...tenu.reglages, veilleJusqua },
      entree(au(16, 15, 20))
    )
    expect(tropTard.afficher).toBeNull()
    expect(tropTard.effets[0]?.dernierDeclenchement).toBe(jourLocal(au(16, 15, 20)))
  })

  it('affiche l’heure fixe deux minutes après la fermeture de la notification précédente', () => {
    const { reglages, id } = heureFixe('15:00', 'jour')
    const yeux = parType(reglages, 'yeux')
    const occupe = {
      ...creerEtat(),
      notification: {
        rappelId: yeux.id,
        depuisMs: au(16, 15, 0).getTime(),
        delaiMs: AFFICHAGE_NOTIFICATION_YEUX_MS,
        charge: { assis: false, ideeIndex: null }
      }
    }
    const differe = evaluer(occupe, reglages, entree(au(16, 15, 0)))
    expect(differe.afficher).toBeNull()

    const ferme = repondre(differe.etat, reglages, 'plusTard', au(16, 15, 0))
    const arme = appliquerEffets(reglages, differe.effets)
    const justeApres = evaluer(
      ferme.etat,
      arme,
      entree(new Date(au(16, 15, 0).getTime() + MESSAGE_REPONSE_MS))
    )
    expect(justeApres.afficher).toBeNull()
    const tropTot = evaluer(
      justeApres.etat,
      arme,
      entree(new Date(au(16, 15, 0).getTime() + MESSAGE_REPONSE_MS + FENETRE_PRIORITE_MS - 1000))
    )
    expect(tropTot.afficher).toBeNull()
    const aLHeure = evaluer(
      tropTot.etat,
      arme,
      entree(new Date(au(16, 15, 0).getTime() + MESSAGE_REPONSE_MS + FENETRE_PRIORITE_MS))
    )
    expect(aLHeure.afficher?.rappelId).toBe(id)
  })

  it('prend en compte une fréquence raccourcie avec le compteur déjà avancé', () => {
    const reglages = seulement(['yeux'])
    const yeux = parType(reglages, 'yeux')
    const etat = {
      ...amorcer(reglages, au(16, 8, 0)),
      compteursMs: { [yeux.id]: 15 * MINUTE }
    }
    const raccourci: Reglages = {
      ...reglages,
      rappels: reglages.rappels.map((rappel) =>
        rappel.id === yeux.id ? { ...rappel, frequenceMin: 10 } : rappel
      )
    }
    const decision = evaluer(etat, raccourci, entree(au(16, 8, 0)))
    expect(decision.afficher?.rappelId).toBe(yeux.id)
  })

  it('affiche tout de suite la pause demandée, sans empiler une seconde notification', () => {
    const reglages = seulement(['bouger'])
    const bouger = { ...parType(reglages, 'bouger'), actif: false }
    const reglage: Reglages = {
      ...reglages,
      rappels: reglages.rappels.map((rappel) => (rappel.id === bouger.id ? bouger : rappel))
    }
    const pause = poserPauseImmediate(creerEtat(), reglage, au(16, 7, 0))
    expect(pause?.afficher.rappelId).toBe(bouger.id)
    const seconde = pause ? poserPauseImmediate(pause.etat, reglage, au(16, 7, 1)) : null
    expect(seconde).toBeNull()
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
    expect(estDansHoraires(au(16, 23, 0), { debut: '20:00', fin: '02:00', jours: 'jour' })).toBe(
      true
    )
    expect(estDansHoraires(au(17, 1, 0), { debut: '20:00', fin: '02:00', jours: 'jour' })).toBe(
      true
    )
    expect(estDansHoraires(au(17, 3, 0), { debut: '20:00', fin: '02:00', jours: 'jour' })).toBe(
      false
    )
  })

  it('place « jusqu’à demain » au début du prochain jour travaillé', () => {
    const mardi = finVeilleDemain(au(16, 10, 0), { debut: '08:00', fin: '18:00', jours: 'semaine' })
    expect(mardi.getDate()).toBe(17)
    expect(mardi.getHours()).toBe(8)

    const lundiSoir = finVeilleDemain(au(13, 21, 0), {
      debut: '20:00',
      fin: '02:00',
      jours: 'semaine'
    })
    expect(lundiSoir.getDate()).toBe(16)
    expect(lundiSoir.getHours()).toBe(20)
  })
})

function heureFixe(heure: string, repetition: Repetition): { reglages: Reglages; id: string } {
  const reglages = reglagesParDefaut()
  const id = 'fixe-test'
  return {
    id,
    reglages: {
      ...reglages,
      rappels: [
        ...reglages.rappels.map((rappel) => ({ ...rappel, actif: rappel.type === 'yeux' })),
        {
          id,
          nom: 'Pause déjeuner',
          type: 'libre',
          origine: 'perso',
          mode: 'heure',
          heure,
          repetition,
          actif: true,
          reportsDeSuite: 0
        }
      ]
    }
  }
}

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
