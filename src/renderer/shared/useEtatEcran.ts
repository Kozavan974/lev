import { useEffect, useState } from 'react'
import type { EtatEcran } from '../../preload/contrat'

export function useEtatEcran(): EtatEcran | null {
  const [etat, setEtat] = useState<EtatEcran | null>(null)

  useEffect(() => {
    let actif = true
    void window.lev.lireEtat().then(
      (recu) => {
        if (actif) {
          setEtat(recu)
        }
      },
      () => {
        if (actif) {
          setEtat(null)
        }
      }
    )
    const retirer = window.lev.surEtat((recu) => {
      setEtat(recu)
    })
    return () => {
      actif = false
      retirer()
    }
  }, [])

  return etat
}
