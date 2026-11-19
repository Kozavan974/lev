import {
  appliquerDemarrageWindows,
  configurerWindows,
  lireBarreClaireWindows,
  sessionRetientNotifications as retenueWindows
} from './win32'

export function configurerPlateforme(): void {
  if (process.platform === 'win32') {
    configurerWindows()
  }
}

export function appliquerDemarrageAutomatique(actif: boolean): void {
  if (process.platform !== 'win32') {
    return
  }
  appliquerDemarrageWindows(actif)
}

/** Hors Windows, le thème de la barre n'est pas lisible. */
export function barreSystemeClaire(): boolean | null {
  if (process.platform !== 'win32') {
    return null
  }
  return lireBarreClaireWindows()
}

/** Hors Windows, rien n'est retenu : le plein écran et le micro ne sont pas lisibles. */
export function sessionRetientNotifications(): boolean {
  if (process.platform !== 'win32') {
    return false
  }
  return retenueWindows()
}
