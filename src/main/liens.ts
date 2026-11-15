const DOMAINES = [
  'anses.fr',
  'inrs.fr',
  'who.int',
  'santepubliquefrance.fr',
  'mangerbouger.fr',
  'code.travail.gouv.fr',
  'ekilib.re',
  'sports.gouv.fr',
  'getwemap.com'
] as const

/** Vrai seulement pour https, sans identifiant, sur un domaine autorisé ou son sous-domaine. */
export function lienAutorise(adresse: string): boolean {
  if (!adresse.startsWith('https://')) {
    return false
  }
  let url: URL
  try {
    url = new URL(adresse)
  } catch {
    return false
  }
  if (url.protocol !== 'https:' || url.username !== '' || url.password !== '' || url.port !== '') {
    return false
  }
  const hote = url.hostname.toLowerCase()
  if (hote === '' || hote.endsWith('.')) {
    return false
  }
  return DOMAINES.some((domaine) => hote === domaine || hote.endsWith(`.${domaine}`))
}
