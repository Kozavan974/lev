import { app } from 'electron'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

export function cheminRessource(...segments: string[]): string {
  const dansLeProjet = [
    join(app.getAppPath(), 'resources', ...segments),
    join(__dirname, '../../resources', ...segments)
  ]
  // Hors de l'archive : la zone de notification Windows lit l'icône sur le disque.
  const surLeDisque = [
    join(process.resourcesPath, ...segments),
    join(process.resourcesPath, 'resources', ...segments)
  ]
  const candidats = app.isPackaged
    ? [...surLeDisque, ...dansLeProjet]
    : [...dansLeProjet, ...surLeDisque]
  const trouve = candidats.find((chemin) => existsSync(chemin))
  if (!trouve) {
    throw new Error(`Ressource introuvable : ${segments.join('/')}`)
  }
  return trouve
}
