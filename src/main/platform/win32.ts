import { app } from 'electron'
import koffi from 'koffi'
import { ARGUMENT_DEMARRAGE_AUTO } from '../demarrage'
import { etatRetientNotification } from './etatsNotification'
import { microOccupe, sessionOccupee } from './micro'

const SUCCES = 0
const CLE_ABSENTE = 2
const PLUS_DE_CLES = 259
const REG_DWORD = 4
const REG_QWORD = 11
const LECTURE_CLE = 0x20019
const HKEY_UTILISATEUR = 0x80000001
const TAILLE_NOM = 256
const MAX_SOUS_CLES = 256
const OCTETS_DWORD = 4
const OCTETS_QWORD = 8
const CHEMIN_MICRO =
  'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\microphone'
const CONTENEUR_BUREAU = 'NonPackaged'
const CHEMIN_PERSONNALISATION = 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize'
const VALEUR_BARRE = 'SystemUsesLightTheme'

type Interrogation = (sortie: number[]) => unknown

interface ApiRegistre {
  ouvrir: (
    parent: number,
    chemin: string,
    options: number,
    acces: number,
    sortie: number[]
  ) => unknown
  fermer: (cle: number) => unknown
  enumerer: (
    cle: number,
    index: number,
    nom: Buffer,
    taille: number[],
    reserve: number,
    classe: number,
    tailleClasse: number,
    heure: number
  ) => unknown
  lire: (
    cle: number,
    nom: string,
    reserve: number,
    type: number[],
    donnees: Buffer,
    taille: number[]
  ) => unknown
}

let interrogation: Interrogation | null = null
let indisponible = false
let registre: ApiRegistre | null = null
let registreIndisponible = false

export function configurerWindows(): void {
  app.setAppUserModelId('re.ekilib.lev')
}

/**
 * Enregistre ou retire Lèv du démarrage de Windows.
 * Sans effet tant que l'application n'est pas empaquetée, pour ne pas lancer
 * le processus de développement à l'ouverture de session.
 */
export function appliquerDemarrageWindows(actif: boolean): void {
  if (!app.isPackaged) {
    return
  }
  app.setLoginItemSettings({
    openAtLogin: actif,
    args: actif ? [ARGUMENT_DEMARRAGE_AUTO] : []
  })
}

/**
 * Vrai si une application est en plein écran, en présentation, ou si le micro est ouvert.
 * Faux lorsque l'appel échoue : un sondage cassé ne doit pas avaler les rappels.
 */
export function sessionRetientNotifications(): boolean {
  return sessionOccupee(pleinEcranOuPresentation(), microEnCoursDUtilisation())
}

/** Vrai si la barre des tâches est claire, faux si elle est sombre, nul si la clé manque. */
export function lireBarreClaireWindows(): boolean | null {
  const api = obtenirRegistre()
  if (!api) {
    return null
  }
  const cle = ouvrirCle(api, HKEY_UTILISATEUR, CHEMIN_PERSONNALISATION)
  if (cle === null) {
    return null
  }
  try {
    const valeur = lireDword(api, cle, VALEUR_BARRE)
    if (valeur === 1) {
      return true
    }
    if (valeur === 0) {
      return false
    }
    return null
  } finally {
    fermerCle(api, cle)
  }
}

/**
 * Vrai si une application utilise le microphone en ce moment.
 * Lecture seule du registre de l'utilisateur. Aucun flux audio, aucun nom conservé.
 */
export function microEnCoursDUtilisation(): boolean {
  const api = obtenirRegistre()
  if (!api) {
    return false
  }
  const racine = ouvrirCle(api, HKEY_UTILISATEUR, CHEMIN_MICRO)
  if (racine === null) {
    return false
  }
  try {
    if (sousCleActive(api, racine)) {
      return true
    }
    const bureau = ouvrirCle(api, racine, CONTENEUR_BUREAU)
    if (bureau === null) {
      return false
    }
    try {
      return sousCleActive(api, bureau)
    } finally {
      fermerCle(api, bureau)
    }
  } catch {
    return false
  } finally {
    fermerCle(api, racine)
  }
}

function pleinEcranOuPresentation(): boolean {
  const lire = obtenirInterrogation()
  if (!lire) {
    return false
  }
  const sortie = [0]
  try {
    const code = lireNombre(lire(sortie))
    const etat = sortie[0]
    if (code !== SUCCES || etat === undefined) {
      return false
    }
    return etatRetientNotification(etat)
  } catch {
    indisponible = true
    interrogation = null
    return false
  }
}

function obtenirInterrogation(): Interrogation | null {
  if (indisponible) {
    return null
  }
  if (interrogation) {
    return interrogation
  }
  try {
    const shell32 = koffi.load('shell32.dll')
    const fonction = shell32.func('int __stdcall SHQueryUserNotificationState(_Out_ int *pquns)')
    interrogation = (sortie) => fonction(sortie) as unknown
    return interrogation
  } catch {
    indisponible = true
    return null
  }
}

function obtenirRegistre(): ApiRegistre | null {
  if (registreIndisponible) {
    return null
  }
  if (registre) {
    return registre
  }
  try {
    const advapi32 = koffi.load('advapi32.dll')
    const ouvrir = advapi32.func(
      'int __stdcall RegOpenKeyExW(intptr hKey, str16 lpSubKey, uint32 ulOptions, uint32 samDesired, _Out_ intptr *phkResult)'
    )
    const fermer = advapi32.func('int __stdcall RegCloseKey(intptr hKey)')
    const enumerer = advapi32.func(
      'int __stdcall RegEnumKeyExW(intptr hKey, uint32 dwIndex, void *lpName, _Inout_ uint32 *lpcchName, intptr lpReserved, intptr lpClass, intptr lpcchClass, intptr lpftLastWriteTime)'
    )
    const lire = advapi32.func(
      'int __stdcall RegQueryValueExW(intptr hKey, str16 lpValueName, intptr lpReserved, _Out_ uint32 *lpType, void *lpData, _Inout_ uint32 *lpcbData)'
    )
    registre = {
      ouvrir: (parent, chemin, options, acces, sortie) =>
        ouvrir(parent, chemin, options, acces, sortie) as unknown,
      fermer: (cle) => fermer(cle) as unknown,
      enumerer: (cle, index, nom, taille, reserve, classe, tailleClasse, heure) =>
        enumerer(cle, index, nom, taille, reserve, classe, tailleClasse, heure) as unknown,
      lire: (cle, nom, reserve, type, donnees, taille) =>
        lire(cle, nom, reserve, type, donnees, taille) as unknown
    }
    return registre
  } catch {
    registreIndisponible = true
    return null
  }
}

function sousCleActive(api: ApiRegistre, parent: number): boolean {
  const noms = listerSousCles(api, parent)
  if (!noms) {
    return false
  }
  for (const nom of noms) {
    if (nom === CONTENEUR_BUREAU) {
      continue
    }
    const enfant = ouvrirCle(api, parent, nom)
    if (enfant === null) {
      continue
    }
    try {
      const debut = lireQword(api, enfant, 'LastUsedTimeStart')
      const fin = lireQword(api, enfant, 'LastUsedTimeStop')
      if (debut !== null && fin !== null && microOccupe(debut, fin)) {
        return true
      }
    } finally {
      fermerCle(api, enfant)
    }
  }
  return false
}

function listerSousCles(api: ApiRegistre, cle: number): string[] | null {
  const noms: string[] = []
  for (let index = 0; index < MAX_SOUS_CLES; index += 1) {
    const tampon = Buffer.alloc(TAILLE_NOM * 2)
    const taille = [TAILLE_NOM]
    const code = lireNombre(api.enumerer(cle, index, tampon, taille, 0, 0, 0, 0))
    if (code === PLUS_DE_CLES) {
      return noms
    }
    const caracteres = taille[0]
    if (code !== SUCCES || caracteres === undefined || caracteres === 0) {
      return null
    }
    noms.push(tampon.toString('utf16le', 0, caracteres * 2))
  }
  return null
}

function lireDword(api: ApiRegistre, cle: number, nom: string): number | null {
  const type = [0]
  const donnees = Buffer.alloc(OCTETS_DWORD)
  const taille = [OCTETS_DWORD]
  const code = lireNombre(api.lire(cle, nom, 0, type, donnees, taille))
  if (code !== SUCCES || type[0] !== REG_DWORD || taille[0] !== OCTETS_DWORD) {
    return null
  }
  return donnees.readUInt32LE(0)
}

function lireQword(api: ApiRegistre, cle: number, nom: string): bigint | null {
  const type = [0]
  const donnees = Buffer.alloc(OCTETS_QWORD)
  const taille = [OCTETS_QWORD]
  const code = lireNombre(api.lire(cle, nom, 0, type, donnees, taille))
  if (code === CLE_ABSENTE) {
    return null
  }
  if (code !== SUCCES || type[0] !== REG_QWORD || taille[0] !== OCTETS_QWORD) {
    return null
  }
  return donnees.readBigUInt64LE(0)
}

function ouvrirCle(api: ApiRegistre, parent: number, chemin: string): number | null {
  const sortie = [0]
  const code = lireNombre(api.ouvrir(parent, chemin, 0, LECTURE_CLE, sortie))
  const handle = sortie[0]
  if (code !== SUCCES || handle === undefined || handle === 0) {
    return null
  }
  return handle
}

function fermerCle(api: ApiRegistre, cle: number): void {
  try {
    api.fermer(cle)
  } catch {
    // Le sondage suivant rouvre une clé neuve.
  }
}

function lireNombre(valeur: unknown): number | null {
  return typeof valeur === 'number' ? valeur : null
}
