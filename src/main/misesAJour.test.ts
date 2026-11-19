import { describe, expect, it } from 'vitest'
import textes from '../content/fr.json'
import type { EtatMaj } from '../preload/contrat'
import { reglagesParDefaut } from './reglages'
import {
  appliquerResultatMaj,
  conclureLecture,
  comparerVersions,
  INTERVALLE_MAJ_MS,
  interrogerRelease,
  majDisponibleDepuis,
  URL_PAGE,
  verificationHebdomadaireDue
} from './misesAJour'

const CROISSANTES = [
  '1.0.0-alpha',
  '1.0.0-alpha.1',
  '1.0.0-alpha.beta',
  '1.0.0-beta',
  '1.0.0-beta.2',
  '1.0.0-beta.11',
  '1.0.0-rc.1',
  '1.0.0',
  '1.0.1',
  '1.1.0',
  'v1.1.1'
]

describe('comparaison SemVer', () => {
  it('ordonne les versions, les préfixes v et les pré-versions', () => {
    for (let gauche = 0; gauche < CROISSANTES.length; gauche += 1) {
      for (let droite = gauche + 1; droite < CROISSANTES.length; droite += 1) {
        const ancienne = CROISSANTES[gauche]
        const recente = CROISSANTES[droite]
        if (!ancienne || !recente) {
          throw new Error('Version de test manquante.')
        }
        expect(comparerVersions(ancienne, recente)).toBe(-1)
        expect(comparerVersions(recente, ancienne)).toBe(1)
      }
    }
  })

  it('tient 1.10.0 pour plus récente que 1.9.0, et ignore le préfixe et les métadonnées', () => {
    expect(comparerVersions('1.9.0', '1.10.0')).toBe(-1)
    expect(comparerVersions('v1.0.0', '1.0.0')).toBe(0)
    expect(comparerVersions('V1.0.0', 'v1.0.0')).toBe(0)
    expect(comparerVersions('1.0.0+build.5', '1.0.0')).toBe(0)
    expect(comparerVersions('1.0.0', '1.0.0')).toBe(0)
  })

  it('refuse une étiquette illisible', () => {
    for (const brut of ['', '1.0', 'vv1.0.0', '1.0.0-', '1.0.0-01', '01.0.0', '1.0.0-beta..1']) {
      expect(comparerVersions(brut, '1.0.0')).toBeNull()
      expect(comparerVersions('1.0.0', brut)).toBeNull()
    }
  })
})

describe('vérification hebdomadaire', () => {
  const ancre = new Date('2026-11-01T00:00:00.000Z')

  it('part sans date, avec une date illisible, ou après plus de 7 jours', () => {
    expect(verificationHebdomadaireDue(undefined, ancre)).toBe(true)
    expect(verificationHebdomadaireDue('pas-une-date', ancre)).toBe(true)
    const justeApres = new Date(ancre.getTime() + INTERVALLE_MAJ_MS + 1)
    expect(verificationHebdomadaireDue(ancre.toISOString(), justeApres)).toBe(true)
  })

  it('attend encore à 6 jours et à 7 jours pile', () => {
    const sixJours = new Date(ancre.getTime() + 6 * 24 * 60 * 60 * 1000)
    const septJours = new Date(ancre.getTime() + INTERVALLE_MAJ_MS)
    expect(verificationHebdomadaireDue(ancre.toISOString(), sixJours)).toBe(false)
    expect(verificationHebdomadaireDue(ancre.toISOString(), septJours)).toBe(false)
  })
})

describe('lecture d’une release', () => {
  const lecture = {
    url: 'https://api.github.com/repos/Kozavan974/lev/releases/latest',
    ok: true,
    corps: { tag_name: 'v1.1.0', html_url: 'https://exemple.fr/piege' }
  }

  it('annonce la version normalisée et le lien fixe vers GitHub', () => {
    expect(conclureLecture('1.0.0', lecture)).toEqual({
      statut: 'disponible',
      version: '1.1.0',
      url: URL_PAGE
    })
    expect(URL_PAGE).toBe(textes.apropos.ekilib.maj.url)
  })

  it('dit que l’application est à jour quand la release n’est pas plus récente', () => {
    expect(conclureLecture('1.1.0', lecture)).toEqual({ statut: 'a-jour' })
    expect(conclureLecture('1.2.0', { ...lecture, corps: { tag_name: 'v1.0.0' } })).toEqual({
      statut: 'a-jour'
    })
  })

  it('rend une erreur hors API, sans étiquette, ou si la lecture lève', async () => {
    expect(conclureLecture('1.0.0', { ...lecture, ok: false })).toEqual({ statut: 'erreur' })
    expect(conclureLecture('1.0.0', { ...lecture, corps: {} })).toEqual({ statut: 'erreur' })
    expect(conclureLecture('1.0.0', { ...lecture, corps: { tag_name: 'bientot' } })).toEqual({
      statut: 'erreur'
    })
    expect(
      conclureLecture('1.0.0', { ...lecture, url: 'https://exemple.fr/releases/latest' })
    ).toEqual({ statut: 'erreur' })
    expect(
      conclureLecture('1.0.0', { ...lecture, url: 'https://api.github.com:444/repos/lev' })
    ).toEqual({ statut: 'erreur' })
    expect(
      conclureLecture('1.0.0', { ...lecture, url: 'https://user@api.github.com/repos/lev' })
    ).toEqual({ statut: 'erreur' })
    await expect(
      interrogerRelease('1.0.0', () => Promise.reject(new Error('hors ligne')))
    ).resolves.toEqual({
      statut: 'erreur'
    })
  })
})

describe('mémoire de la version vue', () => {
  const maintenant = new Date('2026-11-19T08:00:00.000Z')

  it('retient une version plus récente et la date de la vérification', () => {
    const disponible: EtatMaj = { statut: 'disponible', version: 'v1.1.0', url: URL_PAGE }
    const suivant = appliquerResultatMaj(reglagesParDefaut(), disponible, maintenant)
    expect(suivant?.derniereVerificationMaj).toBe(maintenant.toISOString())
    expect(suivant?.derniereVersionVue).toBe('1.1.0')
  })

  it('retire la version retenue quand la release n’est pas plus récente', () => {
    const depart = reglagesParDefaut()
    depart.derniereVersionVue = '1.1.0'
    const suivant = appliquerResultatMaj(depart, { statut: 'a-jour' }, maintenant)
    expect(suivant?.derniereVerificationMaj).toBe(maintenant.toISOString())
    expect(suivant?.derniereVersionVue).toBeUndefined()
  })

  it('ne change rien en cas d’erreur', () => {
    const depart = reglagesParDefaut()
    depart.derniereVersionVue = '1.1.0'
    expect(appliquerResultatMaj(depart, { statut: 'erreur' }, maintenant)).toBeNull()
  })

  it('signale la version retenue au démarrage, tant que la case reste cochée', () => {
    const reglages = reglagesParDefaut()
    reglages.derniereVersionVue = 'v1.2.0'
    expect(majDisponibleDepuis(reglages, '1.0.0')).toBe('1.2.0')
    expect(majDisponibleDepuis(reglages, '1.2.0')).toBeNull()
    expect(majDisponibleDepuis(reglages, '1.3.0')).toBeNull()
    reglages.options.verifierMajAuto = false
    expect(majDisponibleDepuis(reglages, '1.0.0')).toBeNull()
  })
})
