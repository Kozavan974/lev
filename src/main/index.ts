import { app, Menu } from 'electron'
import { appliquerFondApplication, detruireApplication } from './applicationFenetre'
import {
  arreterBoucle,
  arreterSequences,
  demanderPauseMaintenant,
  demarrerBoucle,
  demarrerSequences
} from './boucle'
import { deciderOuverture, estDemarrageAuto } from './demarrage'
import { installerPolitiqueContenu } from './ipc'
import { basculerMenu, detruireMenu } from './menuFenetre'
import { DELAI_SILENCIEUX_MS, verificationHebdomadaireDue } from './misesAJour'
import { appliquerDemarrageAutomatique, configurerPlateforme } from './platform'
import {
  brancherEcrans,
  conclureVerificationMaj,
  mettreEnReunion,
  mettreEnVeille,
  ouvrirDepuisRelance,
  ouvrirEcran,
  ouvrirSiPremierLancement,
  reprendreReunion,
  reprendreRappels
} from './pontEcrans'
import { initialiserStore, lireReglages } from './store'
import { appliquerSourceTheme, ecouterTheme } from './theme'
import { creerZoneNotification, detruireZoneNotification } from './tray'

app.setName('Lèv')
configurerPlateforme()
app.disableHardwareAcceleration()
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=64')

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  let applicationPrete = false
  let relanceEnAttente = false

  function ouvrirSelonLancement(): void {
    const mode = deciderOuverture({
      premierLancementFait: lireReglages().premierLancementFait,
      demarrageAuto: estDemarrageAuto(process.argv)
    })
    if (mode === 'accueil') {
      ouvrirSiPremierLancement()
    } else if (mode === 'rappels') {
      ouvrirEcran('rappels')
    }
    if (relanceEnAttente) {
      relanceEnAttente = false
      ouvrirDepuisRelance()
    }
  }

  app.on('second-instance', () => {
    if (applicationPrete) {
      ouvrirDepuisRelance()
      return
    }
    relanceEnAttente = true
  })

  app.on('window-all-closed', () => {
    // Fermer une fenêtre laisse Lèv dans la zone de notification.
  })

  let retirerTheme: (() => void) | null = null
  let minuteurMaj: ReturnType<typeof setTimeout> | null = null

  function arreterVerificationSilencieuse(): void {
    if (minuteurMaj !== null) {
      clearTimeout(minuteurMaj)
      minuteurMaj = null
    }
  }

  function planifierVerificationSilencieuse(): void {
    arreterVerificationSilencieuse()
    minuteurMaj = setTimeout(() => {
      minuteurMaj = null
      const reglages = lireReglages()
      if (!reglages.options.verifierMajAuto) {
        return
      }
      if (!verificationHebdomadaireDue(reglages.derniereVerificationMaj, new Date())) {
        return
      }
      void conclureVerificationMaj()
    }, DELAI_SILENCIEUX_MS)
  }

  app.on('before-quit', () => {
    arreterVerificationSilencieuse()
    retirerTheme?.()
    retirerTheme = null
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
      appliquerSourceTheme(lireReglages().theme)
      retirerTheme = ecouterTheme(appliquerFondApplication)
      installerPolitiqueContenu()
      creerZoneNotification({
        clicGauche: basculerMenu,
        pauseMaintenant: demanderPauseMaintenant,
        demarrerReunion: mettreEnReunion,
        reprendreReunion,
        veille30: () => mettreEnVeille('30min'),
        veilleDemain: () => mettreEnVeille('demain'),
        reprendre: reprendreRappels,
        ouvrirRappels: () => ouvrirEcran('rappels'),
        ouvrirAPropos: () => ouvrirEcran('apropos'),
        demarrerSequence: demarrerSequences,
        arreterSequences
      })
      brancherEcrans()
      demarrerBoucle()
      appliquerDemarrageAutomatique(lireReglages().options.lancerAuDemarrage)
      planifierVerificationSilencieuse()
      applicationPrete = true
      ouvrirSelonLancement()
    })
    .catch((erreur: unknown) => {
      console.error(erreur)
      app.quit()
    })
}
