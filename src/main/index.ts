import { app, Menu } from 'electron'
import { detruireApplication } from './applicationFenetre'
import {
  arreterBoucle,
  arreterSequences,
  demanderPauseMaintenant,
  demarrerBoucle,
  demarrerSequences
} from './boucle'
import { installerPolitiqueContenu } from './ipc'
import { basculerMenu, detruireMenu } from './menuFenetre'
import { configurerPlateforme } from './platform'
import {
  brancherEcrans,
  mettreEnVeilleUneHeure,
  ouvrirDepuisRelance,
  ouvrirEcran,
  ouvrirSiPremierLancement,
  reprendreRappels
} from './pontEcrans'
import { initialiserStore } from './store'
import { creerZoneNotification, detruireZoneNotification } from './tray'

app.setName('Lèv')
configurerPlateforme()

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (app.isReady()) {
      ouvrirDepuisRelance()
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
        pauseMaintenant: demanderPauseMaintenant,
        veilleUneHeure: mettreEnVeilleUneHeure,
        reprendre: reprendreRappels,
        ouvrirRappels: () => ouvrirEcran('rappels'),
        ouvrirAPropos: () => ouvrirEcran('apropos'),
        demarrerSequence: demarrerSequences,
        arreterSequences
      })
      brancherEcrans()
      demarrerBoucle()
      ouvrirSiPremierLancement()
    })
    .catch((erreur: unknown) => {
      console.error(erreur)
      app.quit()
    })
}
