import { app, Menu, nativeImage, Tray, type Rectangle } from 'electron'
import textes from '../content/fr.json'
import { cheminRessource } from './ressources'

export interface ActionsZone {
  clicGauche: () => void
  ouvrirRappels: () => void
}

let zone: Tray | null = null

export function creerZoneNotification(actions: ActionsZone): void {
  const chemin = cheminRessource('icons', 'tray-calme.ico')
  const icone = nativeImage.createFromPath(chemin)
  if (icone.isEmpty()) {
    throw new Error(`Icône de la zone de notification illisible : ${chemin}`)
  }
  const barre = new Tray(icone)
  barre.setToolTip(textes.tray.infobulle)
  barre.setIgnoreDoubleClickEvents(true)
  let ignoreClicJusqua = 0
  barre.on('right-click', () => {
    ignoreClicJusqua = Date.now() + 300
  })
  barre.on('click', () => {
    if (Date.now() < ignoreClicJusqua) {
      return
    }
    actions.clicGauche()
  })
  barre.setContextMenu(
    Menu.buildFromTemplate([
      { label: textes.tray.mesRappels, click: () => actions.ouvrirRappels() },
      { label: textes.tray.quitter, click: () => app.quit() }
    ])
  )
  zone = barre
}

export function lireBoundsZone(): Rectangle | null {
  if (!zone || zone.isDestroyed()) {
    return null
  }
  return zone.getBounds()
}

export function definirInfobulle(texte: string): void {
  if (!zone || zone.isDestroyed()) {
    return
  }
  zone.setToolTip(texte)
}

export function detruireZoneNotification(): void {
  zone?.destroy()
  zone = null
}
