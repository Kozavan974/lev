import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { versionsTechniquesDepuis } from '../partage/versions'
import {
  CANAL_ECRAN,
  CANAL_NOTIFICATION,
  estActionEcran,
  estEtatEcran,
  estEtatMaj,
  estReponseBouton,
  estVueMessage,
  estVueNotification,
  type ApiLev,
  type ReponseBouton
} from './contrat'

const api: ApiLev = {
  prete: () => {
    ipcRenderer.send(CANAL_NOTIFICATION.prete)
  },
  surAffichage: (recevoir) => {
    const ecouter = (_evenement: IpcRendererEvent, valeur: unknown): void => {
      if (estVueNotification(valeur)) {
        recevoir(valeur)
      }
    }
    ipcRenderer.on(CANAL_NOTIFICATION.afficher, ecouter)
    return () => {
      ipcRenderer.removeListener(CANAL_NOTIFICATION.afficher, ecouter)
    }
  },
  surMessage: (recevoir) => {
    const ecouter = (_evenement: IpcRendererEvent, valeur: unknown): void => {
      if (estVueMessage(valeur)) {
        recevoir(valeur)
      }
    }
    ipcRenderer.on(CANAL_NOTIFICATION.message, ecouter)
    return () => {
      ipcRenderer.removeListener(CANAL_NOTIFICATION.message, ecouter)
    }
  },
  repondre: (reponse: ReponseBouton) => {
    if (estReponseBouton(reponse)) {
      ipcRenderer.send(CANAL_NOTIFICATION.repondre, reponse)
    }
  },
  expirer: () => {
    ipcRenderer.send(CANAL_NOTIFICATION.expirer)
  },
  definirHauteur: (hauteurPx: number) => {
    if (typeof hauteurPx === 'number' && Number.isFinite(hauteurPx)) {
      ipcRenderer.send(CANAL_NOTIFICATION.hauteur, hauteurPx)
    }
  },
  autreIdee: () => {
    ipcRenderer.send(CANAL_NOTIFICATION.autreIdee)
  },
  definirVariante: (assis: boolean) => {
    if (typeof assis === 'boolean') {
      ipcRenderer.send(CANAL_NOTIFICATION.variante, assis)
    }
  },
  masquageTermine: () => {
    ipcRenderer.send(CANAL_NOTIFICATION.masquee)
  },
  surRetrait: (recevoir) => {
    const ecouter = (): void => {
      recevoir()
    }
    ipcRenderer.on(CANAL_NOTIFICATION.retirer, ecouter)
    return () => {
      ipcRenderer.removeListener(CANAL_NOTIFICATION.retirer, ecouter)
    }
  },
  lireEtat: async () => {
    const valeur: unknown = await ipcRenderer.invoke(CANAL_ECRAN.lire)
    if (!estEtatEcran(valeur)) {
      throw new Error('État illisible.')
    }
    return valeur
  },
  surEtat: (recevoir) => {
    const ecouter = (_evenement: IpcRendererEvent, valeur: unknown): void => {
      if (estEtatEcran(valeur)) {
        recevoir(valeur)
      }
    }
    ipcRenderer.on(CANAL_ECRAN.etat, ecouter)
    return () => {
      ipcRenderer.removeListener(CANAL_ECRAN.etat, ecouter)
    }
  },
  agir: (action) => {
    if (estActionEcran(action)) {
      ipcRenderer.send(CANAL_ECRAN.action, action)
    }
  },
  ouvrirLien: async (url: string) => {
    if (typeof url !== 'string') {
      return false
    }
    const valeur: unknown = await ipcRenderer.invoke(CANAL_ECRAN.lien, url)
    return valeur === true
  },
  verifierMisesAJour: async () => {
    const valeur: unknown = await ipcRenderer.invoke(CANAL_ECRAN.maj)
    if (!estEtatMaj(valeur)) {
      return { statut: 'erreur' }
    }
    return valeur
  },
  versionsTechniques: () => versionsTechniquesDepuis(process.versions),
  fermerMenu: () => {
    ipcRenderer.send(CANAL_ECRAN.fermerMenu)
  },
  definirHauteurMenu: (hauteurPx: number) => {
    if (typeof hauteurPx === 'number' && Number.isFinite(hauteurPx)) {
      ipcRenderer.send(CANAL_ECRAN.hauteurMenu, hauteurPx)
    }
  }
}

contextBridge.exposeInMainWorld('lev', api)
