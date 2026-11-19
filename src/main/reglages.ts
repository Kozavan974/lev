import { randomUUID } from 'node:crypto'
import { estVersionSemVer } from './misesAJour'
import type {
  DureeRespiration,
  Frequence,
  Jours,
  ModeRappel,
  OrigineRappel,
  Rappel,
  Reglages,
  Repetition,
  RythmeSequence,
  Theme,
  TypeRappel
} from './modeles'
import { FREQUENCES } from './modeles'

const TYPES_RAPPEL = ['yeux', 'bouger', 'posture', 'libre'] as const satisfies readonly TypeRappel[]
const ORIGINES = ['base', 'perso'] as const satisfies readonly OrigineRappel[]
const MODES = ['recurrent', 'heure'] as const satisfies readonly ModeRappel[]
const REPETITIONS = ['jour', 'semaine', 'une'] as const satisfies readonly Repetition[]
const JOURS = ['semaine', 'samedi', 'jour'] as const satisfies readonly Jours[]
const RYTHMES = ['25-5', '50-10', 'heure', 'autre'] as const satisfies readonly RythmeSequence[]
const THEMES = ['auto', 'clair', 'sombre'] as const satisfies readonly Theme[]
const DUREES_RESPIRATION = [1, 3, 5] as const satisfies readonly DureeRespiration[]

function rappelDeBase(
  nom: string,
  type: TypeRappel,
  frequenceMin: Frequence,
  actif: boolean
): Rappel {
  return {
    id: randomUUID(),
    nom,
    type,
    origine: 'base',
    mode: 'recurrent',
    frequenceMin,
    actif,
    reportsDeSuite: 0
  }
}

export function reglagesParDefaut(): Reglages {
  return {
    version: 1,
    premierLancementFait: false,
    rappels: [
      rappelDeBase('Cligner des yeux', 'yeux', 20, true),
      rappelDeBase('Marcher 5 minutes', 'bouger', 30, true),
      rappelDeBase('Point posture', 'posture', 120, true),
      rappelDeBase("Boire un verre d'eau", 'libre', 60, false)
    ],
    horaires: { debut: '08:00', fin: '18:00', jours: 'semaine' },
    sequences: {
      actif: true,
      rythme: '25-5',
      travailMin: 25,
      pauseMin: 5,
      grandePauseMin: 15,
      grandePauseApres: 4
    },
    options: {
      attendreAccalmie: true,
      pausesSpontanees: true,
      nePasDeranger: true,
      proposerEspacer: true,
      mouvementsAssis: false,
      son: false,
      lancerAuDemarrage: true,
      verifierMajAuto: true
    },
    theme: 'auto',
    respiration: { inspiration: 4, pleine: 4, expiration: 4, vide: 4, minutes: 1 },
    guidePoste: [false, false, false, false, false]
  }
}

export function normaliser(donnees: unknown): Reglages {
  const lus = lireReglagesValides(donnees)
  if (!lus) {
    return reglagesParDefaut()
  }
  return lus
}

function lireReglagesValides(donnees: unknown): Reglages | null {
  if (!estEnregistrement(donnees) || donnees.version !== 1) {
    return null
  }
  if (typeof donnees.premierLancementFait !== 'boolean') {
    return null
  }
  const rappels = lireRappels(donnees.rappels)
  const horaires = lireHoraires(donnees.horaires)
  const sequences = lireSequences(donnees.sequences)
  const options = lireOptions(donnees.options)
  const respiration = lireRespiration(donnees.respiration)
  const guidePoste = lireGuide(donnees.guidePoste)
  const veille = lireOptionnel(donnees, 'veilleJusqua', estInstant)
  const verification = lireOptionnel(donnees, 'derniereVerificationMaj', estInstant)
  const versionVue = lireOptionnel(donnees, 'derniereVersionVue', estVersionSemVer)
  if (
    !rappels ||
    !horaires ||
    !sequences ||
    !options ||
    !respiration ||
    !guidePoste ||
    !veille.ok ||
    !verification.ok ||
    !versionVue.ok ||
    !estParmi(donnees.theme, THEMES)
  ) {
    return null
  }
  const reglages: Reglages = {
    version: 1,
    premierLancementFait: donnees.premierLancementFait,
    rappels,
    horaires,
    sequences,
    options,
    theme: donnees.theme,
    respiration,
    guidePoste
  }
  if (veille.valeur !== undefined) {
    reglages.veilleJusqua = veille.valeur
  }
  if (verification.valeur !== undefined) {
    reglages.derniereVerificationMaj = verification.valeur
  }
  if (versionVue.valeur !== undefined) {
    reglages.derniereVersionVue = versionVue.valeur
  }
  return reglages
}

function lireRappels(valeur: unknown): Rappel[] | null {
  if (!Array.isArray(valeur)) {
    return null
  }
  const rappels: Rappel[] = []
  for (const element of valeur) {
    const rappel = lireRappel(element)
    if (!rappel) {
      return null
    }
    rappels.push(rappel)
  }
  const identifiants = new Set(rappels.map((rappel) => rappel.id))
  if (identifiants.size !== rappels.length) {
    return null
  }
  return rappels
}

function lireRappel(valeur: unknown): Rappel | null {
  if (!estEnregistrement(valeur)) {
    return null
  }
  const id = valeur.id
  const nom = valeur.nom
  const type = valeur.type
  const origine = valeur.origine
  const mode = valeur.mode
  const actif = valeur.actif
  const reportsDeSuite = valeur.reportsDeSuite
  if (
    !estIdentifiant(id) ||
    !estNom(nom) ||
    !estParmi(type, TYPES_RAPPEL) ||
    !estParmi(origine, ORIGINES) ||
    !estParmi(mode, MODES) ||
    typeof actif !== 'boolean' ||
    !estCompteur(reportsDeSuite)
  ) {
    return null
  }
  if (origine === 'perso' && type !== 'libre') {
    return null
  }
  const frequence = lireOptionnel(valeur, 'frequenceMin', estFrequence)
  const heure = lireOptionnel(valeur, 'heure', estHeure)
  const repetition = lireOptionnel(valeur, 'repetition', estRepetition)
  const dernierDeclenchement = lireOptionnel(valeur, 'dernierDeclenchement', estJour)
  const neRienProposerAvant = lireOptionnel(valeur, 'neRienProposerAvant', estInstant)
  if (
    !frequence.ok ||
    !heure.ok ||
    !repetition.ok ||
    !dernierDeclenchement.ok ||
    !neRienProposerAvant.ok
  ) {
    return null
  }
  if (mode === 'recurrent') {
    if (
      frequence.valeur === undefined ||
      heure.valeur !== undefined ||
      repetition.valeur !== undefined ||
      dernierDeclenchement.valeur !== undefined
    ) {
      return null
    }
  } else if (
    heure.valeur === undefined ||
    repetition.valeur === undefined ||
    frequence.valeur !== undefined
  ) {
    return null
  }
  const rappel: Rappel = { id, nom, type, origine, mode, actif, reportsDeSuite }
  if (frequence.valeur !== undefined) {
    rappel.frequenceMin = frequence.valeur
  }
  if (heure.valeur !== undefined) {
    rappel.heure = heure.valeur
  }
  if (repetition.valeur !== undefined) {
    rappel.repetition = repetition.valeur
  }
  if (dernierDeclenchement.valeur !== undefined) {
    rappel.dernierDeclenchement = dernierDeclenchement.valeur
  }
  if (neRienProposerAvant.valeur !== undefined) {
    rappel.neRienProposerAvant = neRienProposerAvant.valeur
  }
  return rappel
}

function lireHoraires(valeur: unknown): Reglages['horaires'] | null {
  if (!estEnregistrement(valeur)) {
    return null
  }
  if (!estHeure(valeur.debut) || !estHeure(valeur.fin) || !estParmi(valeur.jours, JOURS)) {
    return null
  }
  return { debut: valeur.debut, fin: valeur.fin, jours: valeur.jours }
}

function lireSequences(valeur: unknown): Reglages['sequences'] | null {
  if (!estEnregistrement(valeur)) {
    return null
  }
  if (typeof valeur.actif !== 'boolean' || !estParmi(valeur.rythme, RYTHMES)) {
    return null
  }
  if (
    !estEntier(valeur.travailMin, 1, 240) ||
    !estEntier(valeur.pauseMin, 1, 240) ||
    !estEntier(valeur.grandePauseMin, 1, 240) ||
    !estEntier(valeur.grandePauseApres, 1, 24)
  ) {
    return null
  }
  return {
    actif: valeur.actif,
    rythme: valeur.rythme,
    travailMin: valeur.travailMin,
    pauseMin: valeur.pauseMin,
    grandePauseMin: valeur.grandePauseMin,
    grandePauseApres: valeur.grandePauseApres
  }
}

function lireOptions(valeur: unknown): Reglages['options'] | null {
  if (!estEnregistrement(valeur)) {
    return null
  }
  const attendreAccalmie = lireBooleen(valeur.attendreAccalmie)
  const pausesSpontanees = lireBooleen(valeur.pausesSpontanees)
  const nePasDeranger = lireBooleen(valeur.nePasDeranger)
  const proposerEspacer = lireBooleen(valeur.proposerEspacer)
  const mouvementsAssis = lireBooleen(valeur.mouvementsAssis)
  const son = lireBooleen(valeur.son)
  const lancerAuDemarrage = lireBooleen(valeur.lancerAuDemarrage)
  const verifierMajAuto =
    valeur.verifierMajAuto === undefined ? true : lireBooleen(valeur.verifierMajAuto)
  if (
    attendreAccalmie === null ||
    pausesSpontanees === null ||
    nePasDeranger === null ||
    proposerEspacer === null ||
    mouvementsAssis === null ||
    son === null ||
    lancerAuDemarrage === null ||
    verifierMajAuto === null
  ) {
    return null
  }
  return {
    attendreAccalmie,
    pausesSpontanees,
    nePasDeranger,
    proposerEspacer,
    mouvementsAssis,
    son,
    lancerAuDemarrage,
    verifierMajAuto
  }
}

function lireRespiration(valeur: unknown): Reglages['respiration'] | null {
  if (!estEnregistrement(valeur)) {
    return null
  }
  if (
    !estEntier(valeur.inspiration, 2, 10) ||
    !estEntier(valeur.pleine, 0, 10) ||
    !estEntier(valeur.expiration, 2, 10) ||
    !estEntier(valeur.vide, 0, 10) ||
    !estParmiNombres(valeur.minutes, DUREES_RESPIRATION)
  ) {
    return null
  }
  return {
    inspiration: valeur.inspiration,
    pleine: valeur.pleine,
    expiration: valeur.expiration,
    vide: valeur.vide,
    minutes: valeur.minutes
  }
}

function lireGuide(valeur: unknown): boolean[] | null {
  if (!Array.isArray(valeur) || valeur.length !== 5) {
    return null
  }
  const cases: boolean[] = []
  for (const element of valeur) {
    if (typeof element !== 'boolean') {
      return null
    }
    cases.push(element)
  }
  return cases
}

function lireBooleen(valeur: unknown): boolean | null {
  return typeof valeur === 'boolean' ? valeur : null
}

function lireOptionnel<T>(
  objet: Record<string, unknown>,
  cle: string,
  garde: (valeur: unknown) => valeur is T
): { ok: true; valeur: T | undefined } | { ok: false } {
  if (!Object.hasOwn(objet, cle)) {
    return { ok: true, valeur: undefined }
  }
  const valeur = objet[cle]
  if (!garde(valeur)) {
    return { ok: false }
  }
  return { ok: true, valeur }
}

function estEnregistrement(valeur: unknown): valeur is Record<string, unknown> {
  return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur)
}

function estParmi<T extends string>(valeur: unknown, valeurs: readonly T[]): valeur is T {
  return typeof valeur === 'string' && valeurs.some((candidat) => candidat === valeur)
}

function estParmiNombres<T extends number>(valeur: unknown, valeurs: readonly T[]): valeur is T {
  return typeof valeur === 'number' && valeurs.some((candidat) => candidat === valeur)
}

function estFrequence(valeur: unknown): valeur is Frequence {
  return estParmiNombres(valeur, FREQUENCES)
}

function estRepetition(valeur: unknown): valeur is Repetition {
  return estParmi(valeur, REPETITIONS)
}

function estEntier(valeur: unknown, min: number, max: number): valeur is number {
  return typeof valeur === 'number' && Number.isInteger(valeur) && valeur >= min && valeur <= max
}

function estIdentifiant(valeur: unknown): valeur is string {
  return typeof valeur === 'string' && valeur.length >= 1 && valeur.length <= 64
}

function estNom(valeur: unknown): valeur is string {
  return typeof valeur === 'string' && valeur.length >= 1 && valeur.length <= 40
}

function estCompteur(valeur: unknown): valeur is number {
  return estEntier(valeur, 0, 100_000)
}

function estHeure(valeur: unknown): valeur is string {
  return typeof valeur === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(valeur)
}

function estJour(valeur: unknown): valeur is string {
  if (typeof valeur !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valeur)) {
    return false
  }
  const morceaux = valeur.split('-')
  const annee = Number(morceaux[0])
  const mois = Number(morceaux[1])
  const jour = Number(morceaux[2])
  const date = new Date(Date.UTC(annee, mois - 1, jour))
  return (
    date.getUTCFullYear() === annee && date.getUTCMonth() === mois - 1 && date.getUTCDate() === jour
  )
}

function estInstant(valeur: unknown): valeur is string {
  return typeof valeur === 'string' && valeur.trim() === valeur && !Number.isNaN(Date.parse(valeur))
}
