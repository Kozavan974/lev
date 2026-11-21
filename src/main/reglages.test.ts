import { describe, expect, it } from 'vitest'
import type { Rappel, Reglages } from './modeles'
import { normaliser, reglagesParDefaut } from './reglages'

function empreinte(reglages: Reglages): string {
  const copie = structuredClone(reglages)
  for (const rappel of copie.rappels) {
    rappel.id = ''
  }
  return JSON.stringify(copie)
}

describe('réglages par défaut', () => {
  it('propose les quatre rappels de départ', () => {
    const reglages = reglagesParDefaut()
    expect(reglages.rappels.map((rappel) => rappel.nom)).toEqual([
      'Cligner des yeux',
      'Marcher 5 minutes',
      'Point posture',
      "Boire un verre d'eau"
    ])
    expect(reglages.rappels.map((rappel) => rappel.type)).toEqual([
      'yeux',
      'bouger',
      'posture',
      'libre'
    ])
    expect(reglages.rappels.map((rappel) => rappel.frequenceMin)).toEqual([20, 30, 120, 60])
    expect(reglages.rappels.map((rappel) => rappel.actif)).toEqual([true, true, true, false])
    for (const rappel of reglages.rappels) {
      expect(rappel.origine).toBe('base')
      expect(rappel.mode).toBe('recurrent')
      expect(rappel.reportsDeSuite).toBe(0)
    }
  })

  it('donne un identifiant unique à chaque rappel', () => {
    const identifiants = reglagesParDefaut().rappels.map((rappel) => rappel.id)
    expect(new Set(identifiants).size).toBe(4)
    for (const identifiant of identifiants) {
      expect(identifiant).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    }
  })

  it('retient les horaires, les séquences, les options et la respiration de départ', () => {
    const reglages = reglagesParDefaut()
    expect(reglages.version).toBe(1)
    expect(reglages.premierLancementFait).toBe(false)
    expect(reglages.horaires).toEqual({ debut: '08:00', fin: '18:00', jours: 'semaine' })
    expect(reglages.sequences).toEqual({
      actif: true,
      rythme: '25-5',
      travailMin: 25,
      pauseMin: 5,
      grandePauseMin: 15,
      grandePauseApres: 4
    })
    expect(reglages.options).toEqual({
      attendreAccalmie: true,
      pausesSpontanees: true,
      nePasDeranger: true,
      proposerEspacer: true,
      mouvementsAssis: false,
      son: false,
      lancerAuDemarrage: true,
      verifierMajAuto: true,
      suspendreInactivite: true
    })
    expect(reglages.theme).toBe('auto')
    expect(reglages.respiration).toEqual({
      inspiration: 4,
      pleine: 4,
      expiration: 4,
      vide: 4,
      minutes: 1
    })
    expect(reglages.guidePoste).toEqual([false, false, false, false, false])
    expect(reglages.veilleJusqua).toBeUndefined()
    expect(reglages.veilleMotif).toBeUndefined()
    expect(reglages.derniereVerificationMaj).toBeUndefined()
    expect(reglages.derniereVersionVue).toBeUndefined()
  })
})

describe('normaliser', () => {
  it('remplace un fichier absent, vide ou illisible par les valeurs par défaut', () => {
    const attendu = empreinte(reglagesParDefaut())
    expect(empreinte(normaliser(undefined))).toBe(attendu)
    expect(empreinte(normaliser(null))).toBe(attendu)
    expect(empreinte(normaliser({}))).toBe(attendu)
    expect(empreinte(normaliser('corrompu'))).toBe(attendu)
    expect(empreinte(normaliser([]))).toBe(attendu)
    expect(empreinte(normaliser({ version: 2 }))).toBe(attendu)
  })

  it('remplace un rappel incohérent par les valeurs par défaut', () => {
    const depart = reglagesParDefaut()
    const premier = depart.rappels[0]
    if (!premier) {
      throw new Error('Rappel de départ manquant.')
    }
    Object.assign(premier, { frequenceMin: 15 })
    expect(empreinte(normaliser(depart))).toBe(empreinte(reglagesParDefaut()))
  })

  it('conserve un fichier valide, y compris un rappel personnel', () => {
    const depart = reglagesParDefaut()
    const personnel: Rappel = {
      id: 'perso-etirer',
      nom: "M'étirer",
      type: 'libre',
      origine: 'perso',
      mode: 'heure',
      heure: '15:00',
      repetition: 'jour',
      actif: true,
      reportsDeSuite: 1
    }
    const modifie: Reglages = {
      ...depart,
      premierLancementFait: true,
      theme: 'sombre',
      options: { ...depart.options, son: true },
      rappels: depart.rappels.map((rappel, index) =>
        index === 0 ? { ...rappel, frequenceMin: 45 } : rappel
      ),
      veilleJusqua: '2026-11-15T08:00:00.000Z'
    }
    modifie.rappels.push(personnel)
    const resultat = normaliser(modifie)
    expect(resultat).toEqual(modifie)
    expect(resultat.rappels.map((rappel) => rappel.id)).toEqual(
      modifie.rappels.map((rappel) => rappel.id)
    )
  })

  it('coche la suspension d’inactivité quand l’ancienne fiche ne la connaît pas', () => {
    const depart = reglagesParDefaut()
    const { suspendreInactivite: retiree, ...options } = depart.options
    expect(retiree).toBe(true)
    const resultat = normaliser({ ...depart, options })
    expect(resultat.version).toBe(1)
    expect(resultat.options.suspendreInactivite).toBe(true)
    expect(resultat.veilleMotif).toBeUndefined()
    expect(resultat.rappels.map((rappel) => rappel.id)).toEqual(
      depart.rappels.map((rappel) => rappel.id)
    )
  })

  it('reprend une réunion déjà écrite dans l’unique suspension', () => {
    const depart = reglagesParDefaut()
    const resultat = normaliser({
      ...depart,
      reunionJusqua: '2026-11-16T10:00:00.000Z'
    })
    expect(resultat.version).toBe(1)
    expect(resultat.veilleJusqua).toBe('2026-11-16T10:00:00.000Z')
    expect(resultat.veilleMotif).toBe('reunion')
    expect(Object.hasOwn(resultat, 'reunionJusqua')).toBe(false)

    const plusTard = normaliser({
      ...depart,
      veilleJusqua: '2026-11-17T08:00:00.000Z',
      reunionJusqua: '2026-11-16T10:00:00.000Z'
    })
    expect(plusTard.veilleJusqua).toBe('2026-11-17T08:00:00.000Z')
    expect(plusTard.veilleMotif).toBeUndefined()
  })

  it('coche la vérification automatique quand l’ancienne fiche ne la connaît pas', () => {
    const depart = reglagesParDefaut()
    const { verifierMajAuto: retiree, ...options } = depart.options
    expect(retiree).toBe(true)
    const resultat = normaliser({ ...depart, options })
    expect(resultat.options.verifierMajAuto).toBe(true)
    expect(resultat.derniereVerificationMaj).toBeUndefined()
    expect(resultat.derniereVersionVue).toBeUndefined()
    expect(resultat.rappels.map((rappel) => rappel.id)).toEqual(
      depart.rappels.map((rappel) => rappel.id)
    )
  })

  it('retient une vérification réussie et une version déjà vue', () => {
    const depart = reglagesParDefaut()
    const modifie: Reglages = {
      ...depart,
      options: { ...depart.options, verifierMajAuto: false },
      derniereVerificationMaj: '2026-11-01T08:00:00.000Z',
      derniereVersionVue: '1.1.0'
    }
    expect(normaliser(modifie)).toEqual(modifie)
  })

  it('remplace un fichier dont la version vue est illisible', () => {
    const depart = reglagesParDefaut()
    expect(empreinte(normaliser({ ...depart, derniereVersionVue: 'bientot' }))).toBe(
      empreinte(reglagesParDefaut())
    )
  })

  it('oublie une clé inconnue', () => {
    const depart = reglagesParDefaut()
    const resultat = normaliser({ ...depart, surprise: true })
    expect(Object.hasOwn(resultat, 'surprise')).toBe(false)
    expect(resultat).toEqual(depart)
  })
})
