import { app, Menu } from 'electron'
import { detruireApplication, ouvrirApplication } from './applicationFenetre'
import { arreterBoucle, demarrerBoucle } from './boucle'
import { installerPolitiqueContenu } from './ipc'
import { basculerMenu, detruireMenu } from './menuFenetre'
import { configurerPlateforme } from './platform'
import { brancherEcrans } from './pontEcrans'
import { initialiserStore } from './store'
import { creerZoneNotification, detruireZoneNotification } from './tray'

app.setName('Lèv')
configurerPlateforme()

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (app.isReady()) {
      ouvrirApplication()
    }
  })

  app.on('window-all-closed', () => {
    // Fermer une fenêtre laisse Lèv dans la zone de notification.
  })

  app.on('before-quit', () => {
    arreterBoucle()
    detruireMenu()
    detruireApplication()
    detruireZoneNotification()
  })

  app
    .whenReady()
    .then(() => {
      Menu.setApplicationMenu(null)
      initialiserStore()
      installerPolitiqueContenu()
      creerZoneNotification({
        clicGauche: basculerMenu,
        ouvrirRappels: ouvrirApplication
      })
      brancherEcrans()
      demarrerBoucle()
    })
    .catch((erreur: unknown) => {
      console.error(erreur)
      app.quit()
    })
}
