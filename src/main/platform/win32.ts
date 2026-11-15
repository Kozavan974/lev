import { app } from 'electron'
import koffi from 'koffi'
import { ARGUMENT_DEMARRAGE_AUTO } from '../demarrage'
import { etatRetientNotification } from './etatsNotification'

const SUCCES = 0

type Interrogation = (sortie: number[]) => unknown

let interrogation: Interrogation | null = null
let indisponible = false

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
 * Vrai si une application est en plein écran ou si le mode présentation est actif.
 * Faux lorsque l'appel échoue : un sondage cassé ne doit pas avaler les rappels.
 */
export function sessionRetientNotifications(): boolean {
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

function lireNombre(valeur: unknown): number | null {
  return typeof valeur === 'number' ? valeur : null
}
