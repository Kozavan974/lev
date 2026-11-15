import { BrowserWindow, type BrowserWindowConstructorOptions } from 'electron'
import { join } from 'node:path'
import { attacherSecurite } from './ipc'
import { cheminRessource } from './ressources'

export type RouteFenetre = 'notification' | 'menu' | 'app'

export function creerFenetre(options: BrowserWindowConstructorOptions = {}): BrowserWindow {
  const fenetre = new BrowserWindow({
    ...options,
    ...(options.frame === false ? {} : { icon: cheminRessource('icons', 'lev.ico') }),
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })
  attacherSecurite(fenetre.webContents)
  return fenetre
}

export function chargerPage(fenetre: BrowserWindow, route: RouteFenetre): void {
  const adresse = process.env['ELECTRON_RENDERER_URL']
  if (adresse) {
    void fenetre.loadURL(`${adresse}#/${route}`)
    return
  }
  void fenetre.loadFile(join(__dirname, '../renderer/index.html'), { hash: `/${route}` })
}
