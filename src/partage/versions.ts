export interface VersionsTechniques {
  electron: string
  chrome: string
}

/** Electron et Chromium seulement. Une chaîne vide ou absente retire la ligne. */
export function versionsTechniquesDepuis(versions: {
  readonly electron?: string
  readonly chrome?: string
}): VersionsTechniques | null {
  const electron = chaineUtile(versions.electron)
  const chrome = chaineUtile(versions.chrome)
  if (!electron || !chrome) {
    return null
  }
  return { electron, chrome }
}

function chaineUtile(valeur: string | undefined): string | null {
  if (typeof valeur !== 'string' || valeur.length === 0) {
    return null
  }
  return valeur
}
