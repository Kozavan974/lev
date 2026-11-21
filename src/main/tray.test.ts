import { describe, expect, it } from 'vitest'
import textes from '../content/fr.json'
import { remplir } from '../partage/format'
import { entreesMenuContextuel, type EtatMenuContextuel } from './tray'

const CALME: EtatMenuContextuel = {
  enVeille: false,
  enReunion: false,
  reunionHeure: null,
  sequencesActives: false,
  sequenceEnCours: false
}

function libelles(etat: EtatMenuContextuel): string[] {
  return entreesMenuContextuel(etat).map((entree) => entree.label)
}

describe('menu du clic droit', () => {
  it('propose la réunion et une veille sans heure pleine', () => {
    const entrees = entreesMenuContextuel(CALME)
    expect(libelles(CALME)).toEqual([
      textes.tray.pause,
      textes.tray.reunion,
      textes.tray.veilleMenu,
      textes.tray.mesRappels,
      textes.tray.aPropos,
      textes.tray.quitter
    ])
    const veille = entrees.find((entree) => entree.label === textes.tray.veilleMenu)
    expect(veille?.sousMenu?.map((ligne) => ligne.label)).toEqual([
      textes.tray.veille30,
      textes.tray.veilleDemain
    ])
    expect(libelles(CALME).join(' ')).not.toContain('1 heure')
  })

  it('remplace la réunion par la reprise, et la veille manuelle par reprendre', () => {
    expect(libelles({ ...CALME, enReunion: true, reunionHeure: '15h40' })).toContain(
      remplir(textes.tray.reunionEnCours, { heure: '15h40' })
    )
    const enVeille = entreesMenuContextuel({ ...CALME, enVeille: true })
    expect(enVeille.map((entree) => entree.label)).toContain(textes.tray.reprendre)
    expect(enVeille.some((entree) => entree.label === textes.tray.veilleMenu)).toBe(false)
    expect(enVeille.map((entree) => entree.label)).toContain(textes.tray.reunion)
  })
})
