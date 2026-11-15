import { nativeTheme } from 'electron'
import type { Theme } from './modeles'

/** Premier palier du dégradé `--fond`, repris pour le fond natif de la fenêtre. */
const FOND_CLAIR = '#fdf1e7'
const FOND_SOMBRE = '#1c1a2b'

export function appliquerSourceTheme(theme: Theme): void {
  nativeTheme.themeSource = theme === 'sombre' ? 'dark' : theme === 'clair' ? 'light' : 'system'
}

export function fondFenetre(): string {
  return nativeTheme.shouldUseDarkColors ? FOND_SOMBRE : FOND_CLAIR
}

/** Le changement de Windows, en mode automatique, appelle `appliquer` sans redémarrage. */
export function ecouterTheme(appliquer: () => void): () => void {
  const suivre = (): void => {
    appliquer()
  }
  nativeTheme.on('updated', suivre)
  return () => {
    nativeTheme.off('updated', suivre)
  }
}
