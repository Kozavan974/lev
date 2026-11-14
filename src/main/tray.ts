import { app, Menu, nativeImage, Tray } from 'electron'
import textes from '../content/fr.json'
import { cheminRessource } from './ressources'

let zone: Tray | null = null

export function creerZoneNotification(): void {
  const chemin = cheminRessource('icons', 'tray-calme.ico')
  const icone = nativeImage.createFromPath(chemin)
  if (icone.isEmpty()) {
    throw new Error(`Icône de la zone de notification illisible : ${chemin}`)
  }
  const barre = new Tray(icone)
  barre.setToolTip(textes.tray.infobulle)
  barre.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: textes.tray.quitter,
        click: () => {
          app.quit()
        }
      }
    ])
  )
  zone = barre
}

export function detruireZoneNotification(): void {
  zone?.destroy()
  zone = null
}
