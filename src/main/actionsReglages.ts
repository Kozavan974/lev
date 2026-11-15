import { jourDeRepetition, jourLocal } from '../partage/format'
import type { ActionEcran } from '../preload/contrat'
import type { Rappel, Reglages, TypeRappel } from './modeles'
import { HEURE_FIXE_RETARD_MAX_MS } from './scheduler/constantes'
import { finVeilleDemain } from './scheduler/horaires'
import { reglagesParDefaut } from './reglages'

export type ActionReglage = Exclude<
  ActionEcran,
  { type: 'pause' } | { type: 'ouvrirRappels' } | { type: 'quitter' }
>

export interface AnnulationRetrait {
  genre: 'retrait'
  rappel: Rappel
  index: number
}

export interface AnnulationRestauration {
  genre: 'restauration'
  rappels: readonly Rappel[]
}

export type Annulation = AnnulationRetrait | AnnulationRestauration

export interface ContexteAction {
  maintenant: Date
  nouvelId: string
  identifiantsBase: Record<TypeRappel, string>
}

export interface ResultatAction {
  reglages: Reglages
  annulation: Annulation | null
}

export function executerAction(
  reglages: Reglages,
  annulation: Annulation | null,
  action: ActionReglage,
  contexte: ContexteAction
): ResultatAction | null {
  if (action.type === 'annuler') {
    return annuler(reglages, annulation)
  }
  const suivant = appliquer(reglages, action, contexte)
  if (!suivant) {
    return null
  }
  if (action.type === 'retirer') {
    const index = reglages.rappels.findIndex((rappel) => rappel.id === action.id)
    const rappel = reglages.rappels[index]
    if (index < 0 || !rappel) {
      return null
    }
    return { reglages: suivant, annulation: { genre: 'retrait', rappel, index } }
  }
  if (action.type === 'retablir') {
    return { reglages: suivant, annulation: { genre: 'restauration', rappels: reglages.rappels } }
  }
  return { reglages: suivant, annulation: null }
}

function annuler(reglages: Reglages, annulation: Annulation | null): ResultatAction | null {
  if (!annulation) {
    return null
  }
  if (annulation.genre === 'retrait') {
    const rappels = reglages.rappels.slice()
    rappels.splice(Math.min(annulation.index, rappels.length), 0, annulation.rappel)
    return { reglages: { ...reglages, rappels }, annulation: null }
  }
  return { reglages: { ...reglages, rappels: [...annulation.rappels] }, annulation: null }
}

function appliquer(
  reglages: Reglages,
  action: Exclude<ActionReglage, { type: 'annuler' }>,
  contexte: ContexteAction
): Reglages | null {
  switch (action.type) {
    case 'activer':
      return remplacer(reglages, action.id, (rappel) => ({ ...rappel, actif: action.actif }))
    case 'frequence':
      return remplacer(reglages, action.id, (rappel) =>
        rappel.mode === 'recurrent' ? { ...rappel, frequenceMin: action.frequenceMin } : null
      )
    case 'heure':
      return remplacer(reglages, action.id, (rappel) =>
        rappel.mode === 'heure'
          ? armer(sansDeclenchement({ ...rappel, heure: action.heure }), contexte.maintenant)
          : null
      )
    case 'repetition':
      return remplacer(reglages, action.id, (rappel) =>
        rappel.mode === 'heure'
          ? armer(
              sansDeclenchement({ ...rappel, repetition: action.repetition }),
              contexte.maintenant
            )
          : null
      )
    case 'retirer':
      return retirer(reglages, action.id)
    case 'ajouter':
      return ajouter(reglages, action, contexte)
    case 'horaires':
      return {
        ...reglages,
        horaires: { debut: action.debut, fin: action.fin, jours: action.jours }
      }
    case 'sequences':
      return sequences(reglages, action)
    case 'option':
      return { ...reglages, options: { ...reglages.options, [action.cle]: action.valeur } }
    case 'theme':
      return { ...reglages, theme: action.theme }
    case 'veille':
      return { ...reglages, veilleJusqua: finVeille(reglages, action.duree, contexte.maintenant) }
    case 'reprendre':
      return reprendre(reglages)
    case 'retablir':
      return retablir(reglages, contexte.identifiantsBase)
    default:
      return null
  }
}

function ajouter(
  reglages: Reglages,
  action: Extract<ActionReglage, { type: 'ajouter' }>,
  contexte: ContexteAction
): Reglages | null {
  const nom = action.nom.trim()
  if (nom.length < 1 || nom.length > 40) {
    return null
  }
  const rappel: Rappel = {
    id: contexte.nouvelId,
    nom,
    type: 'libre',
    origine: 'perso',
    mode: action.mode,
    actif: true,
    reportsDeSuite: 0
  }
  if (action.mode === 'recurrent') {
    rappel.frequenceMin = action.frequenceMin
  } else {
    rappel.heure = action.heure
    rappel.repetition = action.repetition
    const arme = armer(rappel, contexte.maintenant)
    if (arme.dernierDeclenchement) {
      rappel.dernierDeclenchement = arme.dernierDeclenchement
    }
  }
  return { ...reglages, rappels: [...reglages.rappels, rappel] }
}

/** Les quatre rappels de base reviennent au départ. Les rappels personnels restent, à la suite. */
export function retablirRappelsOrigine(
  reglages: Reglages,
  identifiants: Record<TypeRappel, string>
): Reglages {
  return retablir(reglages, identifiants)
}

function retablir(reglages: Reglages, identifiants: Record<TypeRappel, string>): Reglages {
  const bases = reglagesParDefaut().rappels.map((modele) => {
    const existant = reglages.rappels.find(
      (rappel) => rappel.origine === 'base' && rappel.type === modele.type
    )
    const frequence = modele.frequenceMin
    const restaure: Rappel = {
      id: existant?.id ?? identifiants[modele.type],
      nom: modele.nom,
      type: modele.type,
      origine: 'base',
      mode: 'recurrent',
      actif: modele.actif,
      reportsDeSuite: 0
    }
    if (frequence !== undefined) {
      restaure.frequenceMin = frequence
    }
    return restaure
  })
  const personnels = reglages.rappels.filter((rappel) => rappel.origine === 'perso')
  return { ...reglages, rappels: [...bases, ...personnels] }
}

function retirer(reglages: Reglages, id: string): Reglages | null {
  const rappel = reglages.rappels.find((candidat) => candidat.id === id)
  if (!rappel || rappel.origine !== 'perso') {
    return null
  }
  return { ...reglages, rappels: reglages.rappels.filter((candidat) => candidat.id !== id) }
}

function sequences(
  reglages: Reglages,
  action: Extract<ActionReglage, { type: 'sequences' }>
): Reglages | null {
  let suivant = { ...reglages.sequences }
  if (action.actif !== undefined) {
    suivant = { ...suivant, actif: action.actif }
  }
  if (action.rythme === '25-5') {
    suivant = { ...suivant, rythme: '25-5', travailMin: 25, pauseMin: 5 }
  } else if (action.rythme === '50-10') {
    suivant = { ...suivant, rythme: '50-10', travailMin: 50, pauseMin: 10 }
  } else if (action.rythme === 'heure') {
    suivant = { ...suivant, rythme: 'heure', travailMin: 55, pauseMin: 5 }
  } else if (action.rythme === 'autre') {
    suivant = { ...suivant, rythme: 'autre' }
  }
  if (action.travailMin !== undefined) {
    if (!estEntier(action.travailMin, 10, 120)) {
      return null
    }
    suivant = { ...suivant, rythme: 'autre', travailMin: action.travailMin }
  }
  if (action.pauseMin !== undefined) {
    if (!estEntier(action.pauseMin, 1, 30)) {
      return null
    }
    suivant = { ...suivant, rythme: 'autre', pauseMin: action.pauseMin }
  }
  return { ...reglages, sequences: suivant }
}

function finVeille(reglages: Reglages, duree: '30min' | '1h' | 'demain', maintenant: Date): string {
  if (duree === '30min') {
    return new Date(maintenant.getTime() + 30 * 60 * 1000).toISOString()
  }
  if (duree === '1h') {
    return new Date(maintenant.getTime() + 60 * 60 * 1000).toISOString()
  }
  return finVeilleDemain(maintenant, reglages.horaires).toISOString()
}

function reprendre(reglages: Reglages): Reglages {
  const copie: Reglages = { ...reglages }
  delete copie.veilleJusqua
  return copie
}

function remplacer(
  reglages: Reglages,
  id: string,
  transformer: (rappel: Rappel) => Rappel | null
): Reglages | null {
  let trouve = false
  const rappels: Rappel[] = []
  for (const rappel of reglages.rappels) {
    if (rappel.id !== id) {
      rappels.push(rappel)
      continue
    }
    const suivant = transformer(rappel)
    if (!suivant) {
      return null
    }
    trouve = true
    rappels.push(suivant)
  }
  if (!trouve) {
    return null
  }
  return { ...reglages, rappels }
}

/**
 * L'heure ou la répétition modifiée efface le dernier déclenchement.
 * Si le nouveau créneau du jour est déjà passé, on l'arme pour la prochaine occurrence
 * afin de ne pas le traiter comme un oubli.
 */
function armer(rappel: Rappel, maintenant: Date): Rappel {
  if (!rappel.heure || !rappel.repetition) {
    return rappel
  }
  if (
    !fenetrePassee(maintenant, rappel.heure) ||
    !jourDeRepetition(rappel.repetition, maintenant)
  ) {
    return rappel
  }
  return { ...rappel, dernierDeclenchement: jourLocal(maintenant) }
}

function sansDeclenchement(rappel: Rappel): Rappel {
  const copie: Rappel = { ...rappel }
  delete copie.dernierDeclenchement
  return copie
}

function fenetrePassee(maintenant: Date, heure: string): boolean {
  const [heures, minutes] = heure.split(':').map(Number)
  const prevu = new Date(
    maintenant.getFullYear(),
    maintenant.getMonth(),
    maintenant.getDate(),
    heures,
    minutes,
    0,
    0
  )
  return maintenant.getTime() >= prevu.getTime() + HEURE_FIXE_RETARD_MAX_MS
}

function estEntier(valeur: number, min: number, max: number): boolean {
  return Number.isInteger(valeur) && valeur >= min && valeur <= max
}
