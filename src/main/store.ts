import { app } from 'electron'
import Store from 'electron-store'
import type { Reglages } from './modeles'
import { normaliser } from './reglages'

let memoire: Store | null = null

/**
 * Point de passage de toute évolution du format. Le numéro reste 1.
 * Une ancienne `reunionJusqua` rejoint `veilleJusqua` avec le motif `reunion`,
 * puis disparaît. Une veille déjà écrite et plus tardive l'emporte, sans prendre ce motif.
 * Une date de réunion illisible rend la fiche illisible : `normaliser` retombe sur les défauts.
 */
export function migrer(donnees: unknown): unknown {
  if (!estEnregistrement(donnees) || !Object.hasOwn(donnees, 'reunionJusqua')) {
    return donnees
  }
  const reunion = donnees.reunionJusqua
  if (!estInstant(reunion)) {
    return { version: 0 }
  }
  const suite: Record<string, unknown> = { ...donnees }
  delete suite.reunionJusqua
  if (Object.hasOwn(suite, 'veilleJusqua') && !estInstant(suite.veilleJusqua)) {
    return suite
  }
  const veille = estInstant(suite.veilleJusqua) ? suite.veilleJusqua : undefined
  if (veille === undefined || instantMs(reunion) >= instantMs(veille)) {
    suite.veilleJusqua = reunion
    suite.veilleMotif = 'reunion'
  }
  return suite
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

function estEnregistrement(valeur: unknown): valeur is Record<string, unknown> {
  return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur)
}

function estInstant(valeur: unknown): valeur is string {
  return typeof valeur === 'string' && valeur.trim() === valeur && !Number.isNaN(Date.parse(valeur))
}

function instantMs(iso: string): number {
  const fin = new Date(iso).getTime()
  return Number.isFinite(fin) ? fin : 0
}

function versEnregistrement(reglages: Reglages): Record<string, unknown> {
  const valeur: unknown = JSON.parse(JSON.stringify(reglages))
  if (typeof valeur !== 'object' || valeur === null || Array.isArray(valeur)) {
    throw new Error('Réglages illisibles.')
  }
  return Object.fromEntries(Object.entries(valeur))
}
