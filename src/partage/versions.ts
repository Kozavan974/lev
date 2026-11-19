export interface VersionsTechniques {
  version: string
  electron: string
  chrome: string
}

/** Lèv, Electron et Chromium. Une chaîne vide ou absente retire la ligne. */
export function versionsTechniquesDepuis(versions: {
  readonly version?: string
  readonly electron?: string
  readonly chrome?: string
}): VersionsTechniques | null {
  const version = chaineUtile(versions.version)
  const electron = chaineUtile(versions.electron)
  const chrome = chaineUtile(versions.chrome)
  if (!version || !electron || !chrome) {
    return null
  }
  return { version, electron, chrome }
}

export function estVersionsTechniques(valeur: unknown): valeur is VersionsTechniques {
  if (typeof valeur !== 'object' || valeur === null) {
    return false
  }
  const candidat = valeur as Record<string, unknown>
  return (
    versionsTechniquesDepuis({
      version: typeof candidat.version === 'string' ? candidat.version : undefined,
      electron: typeof candidat.electron === 'string' ? candidat.electron : undefined,
      chrome: typeof candidat.chrome === 'string' ? candidat.chrome : undefined
    }) !== null
  )
}

function chaineUtile(valeur: string | undefined): string | null {
  if (typeof valeur !== 'string' || valeur.length === 0) {
    return null
  }
  return valeur
}
