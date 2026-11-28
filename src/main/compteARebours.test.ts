import { describe, expect, it } from 'vitest'
import textes from '../content/fr.json'
import {
  choisirInfobulle,
  decrireReste,
  ligneDecompte,
  type ModeleInfobulle,
  type ModelesReste
} from '../partage/compteARebours'
import { remplir } from '../partage/format'
import { dessinerCompte } from './iconeCompte'

const MINUTE = 60_000
const MAINTENANT = 1_700_000_000_000

const RESTE: ModelesReste = textes.compte

const INFOBULLE: ModeleInfobulle = {
  travail: textes.tray.sequenceTravail,
  pause: textes.tray.sequencePause,
  grande: textes.tray.sequenceGrande,
  reunion: textes.tray.reunionInfobulle,
  veille: textes.tray.veille,
  prochaine: textes.tray.prochaine,
  repos: textes.tray.infobulle
}

const LIGNES = {
  travail: textes.menu.decompteTravail,
  pause: textes.menu.decomptePause,
  grande: textes.menu.decompteGrande
}

describe('compte à rebours', () => {
  it('affiche les minutes entières, alignées sur deux chiffres', () => {
    expect(decrireReste(MAINTENANT + 25 * MINUTE, MAINTENANT, RESTE)).toEqual({
      icone: '25',
      reste: '25 min restantes'
    })
    expect(decrireReste(MAINTENANT + 3 * MINUTE, MAINTENANT, RESTE)).toEqual({
      icone: '03',
      reste: '3 min restantes'
    })
    expect(decrireReste(MAINTENANT + MINUTE, MAINTENANT, RESTE)).toEqual({
      icone: '01',
      reste: '1 min restante'
    })
    expect(decrireReste(MAINTENANT + 120 * MINUTE, MAINTENANT, RESTE)?.icone).toBe('120')
  })

  it('passe sous une minute, et se tait quand le temps est écoulé', () => {
    expect(decrireReste(MAINTENANT + MINUTE - 1, MAINTENANT, RESTE)).toEqual({
      icone: '<1',
      reste: "moins d'une minute"
    })
    expect(decrireReste(MAINTENANT, MAINTENANT, RESTE)).toBeNull()
    expect(decrireReste(MAINTENANT - 1, MAINTENANT, RESTE)).toBeNull()
  })

  it('garde 25 pendant la première minute, puis 24', () => {
    expect(decrireReste(MAINTENANT + 25 * MINUTE - 1, MAINTENANT, RESTE)?.icone).toBe('25')
    expect(decrireReste(MAINTENANT + 24 * MINUTE, MAINTENANT, RESTE)?.icone).toBe('24')
  })

  it("détaille l'infobulle seulement pendant le travail ou une pause de séquence", () => {
    expect(
      choisirInfobulle(
        { phase: 'travail', reste: '18 min restantes', rang: 2, total: 4 },
        null,
        '11h00',
        '10h40',
        INFOBULLE
      )
    ).toBe('Lèv - Séquence de travail : 18 min restantes (2/4)')
    expect(
      choisirInfobulle(
        { phase: 'pause', grande: false, reste: '4 min restantes' },
        null,
        null,
        '10h40',
        INFOBULLE
      )
    ).toBe('Lèv - Pause de séquence : 4 min restantes')
    expect(
      choisirInfobulle(
        { phase: 'pause', grande: true, reste: '15 min restantes' },
        null,
        null,
        null,
        INFOBULLE
      )
    ).toBe('Lèv - Grande pause : 15 min restantes')
  })

  it('hors séquence, garde la prochaine pause, la veille, ou le nom', () => {
    expect(choisirInfobulle(null, null, null, '10h40', INFOBULLE)).toBe(
      remplir(textes.tray.prochaine, { heure: '10h40' })
    )
    expect(choisirInfobulle({ phase: 'reprise' }, null, '11h00', '10h40', INFOBULLE)).toBe(
      remplir(textes.tray.veille, { heure: '11h00' })
    )
    expect(choisirInfobulle(null, '15h40', '11h00', '10h40', INFOBULLE)).toBe(
      remplir(textes.tray.reunionInfobulle, { heure: '15h40' })
    )
    expect(choisirInfobulle(null, null, null, null, INFOBULLE)).toBe('Lèv')
  })

  it('aligne le menu et la ligne des séquences sur le même décompte', () => {
    expect(ligneDecompte({ phase: 'travail', reste: '18 min restantes' }, LIGNES)).toBe(
      'Séquence en cours · 18 min restantes'
    )
    expect(ligneDecompte({ phase: 'pause', grande: false, reste: '4 min restantes' }, LIGNES)).toBe(
      'Pause de séquence · 4 min restantes'
    )
    expect(
      ligneDecompte({ phase: 'pause', grande: true, reste: "moins d'une minute" }, LIGNES)
    ).toBe("Grande pause · moins d'une minute")
  })
})

describe('dessin du compte', () => {
  it('prépare un carré de 16 px et un carré de 32 px', () => {
    const dessin = dessinerCompte('25', 'clair')
    expect(dessin.petit).toHaveLength(16 * 16 * 4)
    expect(dessin.grand).toHaveLength(32 * 32 * 4)
  })

  it('change le fond avec le thème, et le dessin avec le chiffre', () => {
    const clair = dessinerCompte('25', 'clair')
    const sombre = dessinerCompte('25', 'sombre')
    const autre = dessinerCompte('03', 'clair')
    const moins = dessinerCompte('<1', 'sombre')
    expect(clair.petit.subarray(0, 4)).toEqual(Buffer.from([0xe7, 0xf1, 0xfd, 0xff]))
    expect(sombre.petit.subarray(0, 4)).toEqual(Buffer.from([0x2b, 0x1a, 0x1c, 0xff]))
    expect(clair.petit.equals(sombre.petit)).toBe(false)
    expect(clair.petit.equals(autre.petit)).toBe(false)
    expect(encrePresente(moins.grand, 0xe2, 0xe9, 0xf3)).toBe(true)
  })
})

function encrePresente(buffer: Buffer, b: number, g: number, r: number): boolean {
  for (let offset = 0; offset < buffer.length; offset += 4) {
    if (buffer[offset] === b && buffer[offset + 1] === g && buffer[offset + 2] === r) {
      return true
    }
  }
  return false
}
