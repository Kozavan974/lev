import { app, Menu } from 'electron'
import { installerPolitiqueContenu } from './ipc'
import { configurerPlateforme } from './platform'
import { initialiserStore } from './store'
import { creerZoneNotification, detruireZoneNotification } from './tray'

app.setName('Lèv')
configurerPlateforme()

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    // Le lot 2 ouvrira « Mes rappels » dans l'instance déjà lancée.
  })

  app.on('window-all-closed', () => {
    // Fermer une fenêtre laisse Lèv dans la zone de notification.
  })

  app.on('before-quit', () => {
    detruireZoneNotification()
  })

  app
    .whenReady()
    .then(() => {
      Menu.setApplicationMenu(null)
      initialiserStore()
      installerPolitiqueContenu()
      creerZoneNotification()
    })
    .catch((erreur: unknown) => {
      console.error(erreur)
      app.quit()
    })
}
