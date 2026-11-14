import { app } from 'electron'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

export function cheminRessource(...segments: string[]): string {
  const candidats = [
    join(app.getAppPath(), 'resources', ...segments),
    join(__dirname, '../../resources', ...segments),
    join(process.resourcesPath, ...segments),
    join(process.resourcesPath, 'resources', ...segments)
  ]
  const trouve = candidats.find((chemin) => existsSync(chemin))
  if (!trouve) {
    throw new Error(`Ressource introuvable : ${segments.join('/')}`)
  }
  return trouve
}
