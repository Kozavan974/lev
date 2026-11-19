const TAILLE_PETITE = 16
const TAILLE_GRANDE = 32
const HAUTEUR_GLYPH = 7

/** Chiffres 5×7, et le signe `<`. Les colonnes de droite peuvent être ignorées pour tenir. */
const GLYPHES: Record<string, readonly string[]> = {
  '0': ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['01110', '10001', '00001', '00110', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  '<': ['00010', '00100', '01000', '10000', '01000', '00100', '00010']
}

export type ThemeBarre = 'clair' | 'sombre'

interface Couleur {
  r: number
  g: number
  b: number
}

/** Texte `#2e2a3f` sur `#fdf1e7`, ou `#f3e9e2` sur `#1c1a2b`. */
const THEMES: Record<ThemeBarre, { fond: Couleur; encre: Couleur }> = {
  clair: { fond: hex('#fdf1e7'), encre: hex('#2e2a3f') },
  sombre: { fond: hex('#1c1a2b'), encre: hex('#f3e9e2') }
}

export interface DessinCompte {
  petit: Buffer
  grand: Buffer
}

/** Deux bitmaps BGRA, 16 px et 32 px, opaques. */
export function dessinerCompte(libelle: string, theme: ThemeBarre): DessinCompte {
  const couleurs = THEMES[theme]
  return {
    petit: dessiner(TAILLE_PETITE, libelle, couleurs.fond, couleurs.encre),
    grand: dessiner(TAILLE_GRANDE, libelle, couleurs.fond, couleurs.encre)
  }
}

function dessiner(taille: number, libelle: string, fond: Couleur, encre: Couleur): Buffer {
  const buffer = Buffer.alloc(taille * taille * 4)
  for (let index = 0; index < taille * taille; index += 1) {
    ecrire(buffer, index * 4, fond)
  }
  const caracteres = [...libelle].filter((caractere) => GLYPHES[caractere] !== undefined)
  if (caracteres.length === 0) {
    return buffer
  }
  const { echelle, colonnes } = miseEnPage(caracteres.length, taille)
  const largeur = (caracteres.length * colonnes + (caracteres.length - 1)) * echelle
  const hauteur = HAUTEUR_GLYPH * echelle
  poser(
    buffer,
    taille,
    Math.floor((taille - largeur) / 2),
    Math.floor((taille - hauteur) / 2),
    caracteres,
    echelle,
    colonnes,
    encre
  )
  return buffer
}

function miseEnPage(nombre: number, taille: number): { echelle: number; colonnes: number } {
  const limite = taille - 2
  let meilleur = { echelle: 1, colonnes: 3, score: 0 }
  for (let colonnes = 5; colonnes >= 3; colonnes -= 1) {
    const largeurUnite = nombre * colonnes + (nombre - 1)
    if (largeurUnite > limite || HAUTEUR_GLYPH > limite) {
      continue
    }
    const echelle = Math.min(Math.floor(limite / largeurUnite), Math.floor(limite / HAUTEUR_GLYPH))
    const score = echelle * 10 + colonnes
    if (echelle >= 1 && score > meilleur.score) {
      meilleur = { echelle, colonnes, score }
    }
  }
  return { echelle: meilleur.echelle, colonnes: meilleur.colonnes }
}

function poser(
  buffer: Buffer,
  taille: number,
  origineX: number,
  origineY: number,
  caracteres: readonly string[],
  echelle: number,
  colonnes: number,
  encre: Couleur
): void {
  let curseur = origineX
  for (const caractere of caracteres) {
    const lignes = GLYPHES[caractere]
    if (!lignes) {
      continue
    }
    for (let ligne = 0; ligne < HAUTEUR_GLYPH; ligne += 1) {
      const points = lignes[ligne] ?? ''
      for (let colonne = 0; colonne < colonnes; colonne += 1) {
        if (points[colonne] !== '1') {
          continue
        }
        for (let dy = 0; dy < echelle; dy += 1) {
          for (let dx = 0; dx < echelle; dx += 1) {
            const x = curseur + colonne * echelle + dx
            const y = origineY + ligne * echelle + dy
            if (x >= 0 && y >= 0 && x < taille && y < taille) {
              ecrire(buffer, (y * taille + x) * 4, encre)
            }
          }
        }
      }
    }
    curseur += (colonnes + 1) * echelle
  }
}

function ecrire(buffer: Buffer, offset: number, couleur: Couleur): void {
  buffer[offset] = couleur.b
  buffer[offset + 1] = couleur.g
  buffer[offset + 2] = couleur.r
  buffer[offset + 3] = 255
}

function hex(valeur: string): Couleur {
  return {
    r: Number.parseInt(valeur.slice(1, 3), 16),
    g: Number.parseInt(valeur.slice(3, 5), 16),
    b: Number.parseInt(valeur.slice(5, 7), 16)
  }
}
