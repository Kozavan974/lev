import { describe, expect, it } from 'vitest'
import guide from '../content/guide.fr.json'
import idees from '../content/idees.fr.json'
import textes from '../content/fr.json'
import { lienAutorise } from './liens'

const LIENS_REFERENCES = [
  ...textes.apropos.references.liens.map((lien) => lien.url),
  textes.apropos.ekilib.url,
  textes.apropos.decouvrir.url,
  textes.apropos.ekilib.maisonsUrl,
  textes.apropos.ekilib.procheUrl,
  guide.lien.url,
  textes.poste.video.url,
  textes.apropos.ekilib.maj.url,
  'https://www.github.com/Kozavan974/lev',
  'https://ekilib.re/',
  'https://www.ekilib.re/',
  'https://anses.fr/fr'
]

describe('liens externes', () => {
  it('accepte le lien vers Ekilib.re et ses sous-domaines', () => {
    expect(textes.apropos.decouvrir.lien).toBe("Découvrir l'association Ekilib.re")
    expect(textes.apropos.decouvrir.url).toBe('https://ekilib.re')
    expect(textes.apropos.decouvrir.aria).toBe(
      "Découvrir l'association Ekilib.re. S'ouvre dans le navigateur."
    )
    expect(lienAutorise(textes.apropos.decouvrir.url)).toBe(true)
    expect(lienAutorise('https://www.ekilib.re/')).toBe(true)
    expect(lienAutorise('https://asso.ekilib.re/page')).toBe(true)
    expect(lienAutorise('http://ekilib.re')).toBe(false)
    expect(lienAutorise('https://ekilib.re.evil.com/')).toBe(false)
  })

  it('accepte la vidéo de l’INRS sur YouTube et youtu.be', () => {
    expect(lienAutorise('https://www.youtube.com/watch?v=Hqb1863vYiY')).toBe(true)
    expect(lienAutorise('https://youtube.com/watch?v=Hqb1863vYiY')).toBe(true)
    expect(lienAutorise('https://youtu.be/Hqb1863vYiY')).toBe(true)
    expect(textes.poste.video.url).toBe('https://www.youtube.com/watch?v=Hqb1863vYiY')
  })

  it('accepte les adresses https des domaines autorisés', () => {
    for (const adresse of LIENS_REFERENCES) {
      expect(lienAutorise(adresse)).toBe(true)
    }
  })

  it('refuse le reste', () => {
    const refus = [
      'http://www.anses.fr/',
      'http://ekilib.re',
      'https://anses.fr.evil.com/',
      'https://www.anses.fr.evil.com/page',
      'https://evil.com/anses.fr',
      'https://user@www.anses.fr/',
      'https://user:secret@www.inrs.fr/',
      'https://www.anses.fr:444/page',
      'javascript:alert(1)',
      'file:///C:/secret',
      'https://exemple.fr',
      'https://notanses.fr/',
      'https://ekilib.re.evil.com/',
      'https://sports.gouv.fr.evil.com/',
      'https://getwemap.com.evil.com/',
      'http://www.sports.gouv.fr/',
      'http://livemap.getwemap.com/',
      'https://api.github.com/repos/Kozavan974/lev/releases/latest',
      'https://gist.github.com/Kozavan974',
      'https://github.com.evil.com/',
      'http://github.com/Kozavan974/lev',
      'http://www.youtube.com/watch?v=Hqb1863vYiY',
      'https://youtube.com.evil.com/watch',
      'https://www.youtube.com.evil.com/watch',
      'https://youtu.be.evil.com/Hqb1863vYiY',
      ''
    ]
    for (const adresse of refus) {
      expect(lienAutorise(adresse)).toBe(false)
    }
  })
})

describe('contenus du lot 5', () => {
  it('propose 15 idées provisoires d’au plus 160 caractères', () => {
    expect(idees.provisoire).toBe(true)
    expect(idees.debout).toHaveLength(15)
    expect(idees.assis).toHaveLength(15)
    for (const idee of [...idees.debout, ...idees.assis]) {
      expect(idee.length).toBeGreaterThan(0)
      expect(idee.length).toBeLessThanOrEqual(160)
    }
  })

  it('porte les phrases d’accroche des vues principales', () => {
    expect(textes.rappels.accroche).toBe(
      'Personnalise tes pauses actives pour bouger et reposer tes yeux.'
    )
    expect(textes.rappels.sequencesAccroche).toBe(
      "Alterne des temps de concentration et des pauses courtes pour garder le cap sans t'épuiser."
    )
    expect(textes.respiration.accroche).toBe(
      'Prends deux minutes pour ralentir ta respiration et relâcher la pression.'
    )
    expect(textes.poste.accroche).toBe(
      'Quelques repères simples pour ajuster ton écran, ton siège et ta posture.'
    )
    expect(textes.apropos.philosophie.titre).toBe('Philosophie de Lèv')
    expect(textes.apropos.reperes.titre).toBe('Les repères que suit Lèv')
    expect(textes.apropos.revoirAccueil).toBe("Revoir l'écran de bienvenue")
    expect(textes.apropos.moteurs).toBe(
      'Lèv v{version} · Propulsé par Electron {electron} et Chromium {chrome}'
    )
    expect(textes.apropos.ekilib.droits).toBe('Tous droits réservés, Ekilib.re')
  })

  it('porte les cinq étapes et la phrase de l’encadré', () => {
    expect(guide.etapes).toHaveLength(5)
    expect(guide.encadre.titre).toBe('Et surtout, change souvent de position')
    expect(guide.encadre.texte).toBe(
      'Même bien installé, la meilleure posture reste celle dont on bouge régulièrement.'
    )
  })
})
