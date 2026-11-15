import { app } from 'electron'
import Store from 'electron-store'
import type { Reglages } from './modeles'
import { normaliser } from './reglages'

let memoire: Store | null = null

/**
 * Point de passage de toute évolution du format.
 * La version 1 est le premier format : rien à transformer.
 */
export function migrer(donnees: unknown): unknown {
  return donnees
}

export function initialiserStore(): void {
  const instance = new Store({
    name: 'reglages',
    cwd: app.getPath('userData'),
    clearInvalidConfig: true
  })
  const normalises = normaliser(migrer(instance.store))
  instance.store = versEnregistrement(normalises)
  memoire = instance
}

export function lireReglages(): Reglages {
  if (!memoire) {
    throw new Error('Les réglages ne sont pas prêts.')
  }
  return normaliser(migrer(memoire.store))
}

export function enregistrerReglages(reglages: Reglages): void {
  if (!memoire) {
    throw new Error('Les réglages ne sont pas prêts.')
  }
  memoire.store = versEnregistrement(reglages)
}

function versEnregistrement(reglages: Reglages): Record<string, unknown> {
  const valeur: unknown = JSON.parse(JSON.stringify(reglages))
  if (typeof valeur !== 'object' || valeur === null || Array.isArray(valeur)) {
    throw new Error('Réglages illisibles.')
  }
  return Object.fromEntries(Object.entries(valeur))
}
