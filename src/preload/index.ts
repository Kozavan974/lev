import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import {
  CANAL_NOTIFICATION,
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
  }
}

contextBridge.exposeInMainWorld('lev', api)
