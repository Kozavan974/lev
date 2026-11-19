import type { EtatMaj } from '../preload/contrat'
import type { Reglages } from './modeles'

/** Dernière release publique. Aucun paramètre, aucun identifiant. */
export const URL_API = 'https://api.github.com/repos/Kozavan974/lev/releases/latest'

/** Page ouverte dans le navigateur. Elle ne vient pas de la réponse de l'API. */
export const URL_PAGE = 'https://github.com/Kozavan974/lev/releases/latest'

export const TIMEOUT_MS = 6_000
export const DELAI_SILENCIEUX_MS = 10_000
export const INTERVALLE_MAJ_MS = 7 * 24 * 60 * 60 * 1000

const AGENT = 'Lev-Desktop'

export interface LectureRelease {
  url: string
  ok: boolean
  corps: unknown
}

interface VersionSemVer {
  majeure: number
  mineure: number
  correctif: number
  pre: Identifiant[]
}

type Identifiant = { genre: 'num'; valeur: number } | { genre: 'texte'; valeur: string }

/** Vrai si la dernière vérification réussie est absente, illisible, ou plus vieille que 7 jours. */
export function verificationHebdomadaireDue(
  derniere: string | undefined,
  maintenant: Date
): boolean {
  if (derniere === undefined) {
    return true
  }
  const instant = Date.parse(derniere)
  if (Number.isNaN(instant)) {
    return true
  }
  return maintenant.getTime() - instant > INTERVALLE_MAJ_MS
}

/**
 * 1 si `gauche` est plus récente, -1 si `droite` l'est, 0 si elles sont égales.
 * `null` quand l'une des deux chaînes n'est pas une version SemVer.
 */
export function comparerVersions(gauche: string, droite: string): -1 | 0 | 1 | null {
  const lueGauche = lireVersion(gauche)
  const lueDroite = lireVersion(droite)
  if (!lueGauche || !lueDroite) {
    return null
  }
  return comparerLues(lueGauche, lueDroite)
}

export function estVersionSemVer(valeur: unknown): valeur is string {
  return typeof valeur === 'string' && lireVersion(valeur) !== null
}

/** Version à signaler, ou null si la case est décochée ou si rien de plus récent n'est retenu. */
export function majDisponibleDepuis(reglages: Reglages, versionInstallee: string): string | null {
  if (!reglages.options.verifierMajAuto || reglages.derniereVersionVue === undefined) {
    return null
  }
  const vue = lireVersion(reglages.derniereVersionVue)
  const installee = lireVersion(versionInstallee)
  if (!vue || !installee || comparerLues(vue, installee) <= 0) {
    return null
  }
  return ecrireVersion(vue)
}

/**
 * Enregistre la date d'une vérification réussie.
 * Une version plus récente est retenue. Sinon, la version retenue est retirée.
 * Une erreur ne change rien, pour ne pas écrire une chaîne qui rendrait le fichier illisible.
 */
export function appliquerResultatMaj(
  reglages: Reglages,
  resultat: EtatMaj,
  maintenant: Date
): Reglages | null {
  if (resultat.statut === 'erreur') {
    return null
  }
  const suivant: Reglages = {
    ...reglages,
    derniereVerificationMaj: maintenant.toISOString()
  }
  if (resultat.statut === 'a-jour') {
    delete suivant.derniereVersionVue
    return suivant
  }
  const lue = lireVersion(resultat.version)
  if (!lue) {
    return null
  }
  suivant.derniereVersionVue = ecrireVersion(lue)
  return suivant
}

/** Traduit une réponse déjà lue. N'appelle pas le réseau et ne lève pas. */
export function conclureLecture(versionCourante: string, lecture: LectureRelease): EtatMaj {
  if (!lecture.ok || !reponseApiGithub(lecture.url)) {
    return { statut: 'erreur' }
  }
  if (!estEnregistrement(lecture.corps) || typeof lecture.corps.tag_name !== 'string') {
    return { statut: 'erreur' }
  }
  const distante = lireVersion(lecture.corps.tag_name)
  const courante = lireVersion(versionCourante)
  if (!distante || !courante) {
    return { statut: 'erreur' }
  }
  if (comparerLues(distante, courante) <= 0) {
    return { statut: 'a-jour' }
  }
  return { statut: 'disponible', version: ecrireVersion(distante), url: URL_PAGE }
}

/** Appelle `lire`, et rend une erreur si `lire` lève. */
export async function interrogerRelease(
  versionCourante: string,
  lire: () => Promise<LectureRelease>
): Promise<EtatMaj> {
  try {
    return conclureLecture(versionCourante, await lire())
  } catch {
    return { statut: 'erreur' }
  }
}

let enCours: Promise<EtatMaj> | null = null

/** Un seul appel à la fois. Deux demandes qui se croisent partagent la même réponse. */
export function verifierMiseAJourDistante(versionCourante: string): Promise<EtatMaj> {
  if (enCours) {
    return enCours
  }
  enCours = interrogerRelease(versionCourante, lireRelease).finally(() => {
    enCours = null
  })
  return enCours
}

async function lireRelease(): Promise<LectureRelease> {
  const reponse = await fetch(URL_API, {
    method: 'GET',
    redirect: 'follow',
    cache: 'no-store',
    credentials: 'omit',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { 'User-Agent': AGENT }
  })
  const corps: unknown = reponse.ok ? await reponse.json() : null
  return { url: reponse.url, ok: reponse.ok, corps }
}

function reponseApiGithub(adresse: string): boolean {
  let url: URL
  try {
    url = new URL(adresse)
  } catch {
    return false
  }
  return (
    url.protocol === 'https:' &&
    url.hostname === 'api.github.com' &&
    url.port === '' &&
    url.username === '' &&
    url.password === ''
  )
}

function lireVersion(brut: string): VersionSemVer | null {
  let texte = brut
  if (texte.startsWith('v') || texte.startsWith('V')) {
    texte = texte.slice(1)
  }
  const plus = texte.indexOf('+')
  if (plus !== -1) {
    texte = texte.slice(0, plus)
  }
  const parties = texte.split('-')
  const coeur = parties[0]
  if (!coeur) {
    return null
  }
  const nombres = coeur.split('.')
  if (nombres.length !== 3) {
    return null
  }
  const majeure = lireNombre(nombres[0])
  const mineure = lireNombre(nombres[1])
  const correctif = lireNombre(nombres[2])
  if (majeure === null || mineure === null || correctif === null) {
    return null
  }
  const pre: Identifiant[] = []
  if (parties.length > 1) {
    const suite = parties.slice(1).join('-')
    if (suite === '') {
      return null
    }
    for (const morceau of suite.split('.')) {
      const identifiant = lireIdentifiant(morceau)
      if (!identifiant) {
        return null
      }
      pre.push(identifiant)
    }
  }
  return { majeure, mineure, correctif, pre }
}

function ecrireVersion(version: VersionSemVer): string {
  const coeur = `${version.majeure}.${version.mineure}.${version.correctif}`
  if (version.pre.length === 0) {
    return coeur
  }
  const suite = version.pre.map((identifiant) => String(identifiant.valeur)).join('.')
  return `${coeur}-${suite}`
}

function comparerLues(gauche: VersionSemVer, droite: VersionSemVer): -1 | 0 | 1 {
  const coeur = comparerNombres(
    [gauche.majeure, gauche.mineure, gauche.correctif],
    [droite.majeure, droite.mineure, droite.correctif]
  )
  if (coeur !== 0) {
    return coeur
  }
  return comparerPre(gauche.pre, droite.pre)
}

function comparerNombres(gauche: number[], droite: number[]): -1 | 0 | 1 {
  for (let index = 0; index < gauche.length; index += 1) {
    const a = gauche[index] ?? 0
    const b = droite[index] ?? 0
    if (a !== b) {
      return a > b ? 1 : -1
    }
  }
  return 0
}

function comparerPre(gauche: Identifiant[], droite: Identifiant[]): -1 | 0 | 1 {
  if (gauche.length === 0 && droite.length === 0) {
    return 0
  }
  if (gauche.length === 0) {
    return 1
  }
  if (droite.length === 0) {
    return -1
  }
  const taille = Math.max(gauche.length, droite.length)
  for (let index = 0; index < taille; index += 1) {
    const a = gauche[index]
    const b = droite[index]
    if (!a) {
      return -1
    }
    if (!b) {
      return 1
    }
    const ordre = comparerIdentifiants(a, b)
    if (ordre !== 0) {
      return ordre
    }
  }
  return 0
}

function comparerIdentifiants(gauche: Identifiant, droite: Identifiant): -1 | 0 | 1 {
  if (gauche.genre === 'num' && droite.genre === 'num') {
    if (gauche.valeur === droite.valeur) {
      return 0
    }
    return gauche.valeur > droite.valeur ? 1 : -1
  }
  if (gauche.genre === 'num') {
    return -1
  }
  if (droite.genre === 'num') {
    return 1
  }
  if (gauche.valeur === droite.valeur) {
    return 0
  }
  return gauche.valeur > droite.valeur ? 1 : -1
}

function lireNombre(valeur: string | undefined): number | null {
  if (valeur === undefined || !/^(0|[1-9]\d*)$/.test(valeur)) {
    return null
  }
  const nombre = Number(valeur)
  return Number.isSafeInteger(nombre) ? nombre : null
}

function lireIdentifiant(valeur: string): Identifiant | null {
  const nombre = lireNombre(valeur)
  if (nombre !== null) {
    return { genre: 'num', valeur: nombre }
  }
  if (/^[0-9A-Za-z-]+$/.test(valeur) && !/^\d+$/.test(valeur)) {
    return { genre: 'texte', valeur }
  }
  return null
}

function estEnregistrement(valeur: unknown): valeur is Record<string, unknown> {
  return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur)
}
