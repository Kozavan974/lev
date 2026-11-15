import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import textes from '../../content/fr.json'
import {
  avancerPhase,
  ECHELLE_PETITE,
  echelleArrivee,
  echelleDepart,
  ouvrirSeance,
  type PhaseRespiration,
  type RythmeRespiration,
  type SeanceRespiration
} from '../../partage/cycleRespiration'
import type { DureeRespiration } from '../../partage/modeles'
import { remplir } from '../../partage/format'
import { RetourRappels } from '../shared/RetourRappels'
import { useEtatEcran } from '../shared/useEtatEcran'
import { useFocusTitre } from '../shared/focusTitre'

const PHASES: readonly PhaseRespiration[] = ['inspiration', 'pleine', 'expiration', 'vide']
const DUREES: readonly DureeRespiration[] = [1, 3, 5]
const PREREGLAGES = [
  { id: 'carree', inspiration: 4, pleine: 4, expiration: 4, vide: 4 },
  { id: 'apaisante', inspiration: 4, pleine: 0, expiration: 6, vide: 0 },
  { id: 'reguliere', inspiration: 5, pleine: 0, expiration: 5, vide: 0 }
] as const
const BORNES = {
  inspiration: { min: 2, max: 10 },
  expiration: { min: 2, max: 10 },
  pleine: { min: 0, max: 10 },
  vide: { min: 0, max: 10 }
} as const

type ChampPas = keyof typeof BORNES

export function Respiration(): React.JSX.Element {
  const etat = useEtatEcran()
  useFocusTitre(etat !== null)
  const [seance, setSeance] = useState<SeanceRespiration | null>(null)
  const [terminee, setTerminee] = useState(false)
  const reduit = useMouvementReduit()
  const bulleRef = useRef<HTMLDivElement>(null)
  const rythme = etat?.reglages.respiration
  const rythmeRef = useRef<RythmeRespiration | null>(null)
  const seanceRef = useRef(seance)

  useEffect(() => {
    if (rythme) {
      rythmeRef.current = rythme
    }
    seanceRef.current = seance
  })

  useEffect(() => {
    if (!seance || seance.terminee) {
      return
    }
    const reste = seance.debutPhaseMs + seance.dureePhaseMs - Date.now()
    const minuteur = window.setTimeout(
      () => {
        const actuelle = seanceRef.current
        const rythmeActuel = rythmeRef.current
        if (!actuelle || !rythmeActuel) {
          return
        }
        const suivante = avancerPhase(actuelle, rythmeActuel)
        if (suivante.terminee) {
          setSeance(null)
          setTerminee(true)
          return
        }
        setSeance(suivante)
      },
      Math.max(0, reste)
    )
    return () => {
      window.clearTimeout(minuteur)
    }
  }, [seance])

  useLayoutEffect(() => {
    const bulle = bulleRef.current
    if (!bulle) {
      return
    }
    const depart = seance ? echelleDepart(seance.phase) : ECHELLE_PETITE
    const arrivee = seance ? echelleArrivee(seance.phase) : ECHELLE_PETITE
    const duree = seance && !reduit ? seance.dureePhaseMs : 0
    bulle.style.transition = 'none'
    bulle.style.transform = `scale(${depart})`
    if (duree === 0) {
      bulle.style.transform = `scale(${arrivee})`
      return
    }
    void bulle.offsetWidth
    bulle.style.transition = `transform ${duree}ms linear`
    bulle.style.transform = `scale(${arrivee})`
  }, [seance, reduit])

  if (!etat || !rythme) {
    return <main className="application" />
  }

  const consigne = seance
    ? textes.respiration.consignes[seance.phase]
    : terminee
      ? textes.respiration.fin
      : textes.respiration.pret

  return (
    <main className="application">
      <RetourRappels />
      <div className="respiration">
        <section className="respiration-souffle">
          <h1 className="titre-ecran" tabIndex={-1}>
            {textes.respiration.titre}
          </h1>
          <div className="bulle-cadre" aria-hidden="true">
            <div className="bulle" ref={bulleRef} />
          </div>
          <p className="respiration-consigne" aria-live="polite">
            {consigne}
          </p>
          <div className="etiquettes">
            {PHASES.map((phase) => {
              const active = seance?.phase === phase
              return (
                <span
                  key={phase}
                  className={active ? 'etiquette etiquette-active' : 'etiquette'}
                  aria-current={active ? 'step' : undefined}
                >
                  {textes.respiration.etiquettes[phase]}
                </span>
              )
            })}
          </div>
          <button
            type="button"
            className="bouton bouton-principal respiration-lancer"
            onClick={() => {
              if (seance) {
                setSeance(null)
                setTerminee(true)
                return
              }
              setTerminee(false)
              setSeance(ouvrirSeance(rythme, Date.now()))
            }}
          >
            {seance ? textes.respiration.termine : textes.respiration.commencer}
          </button>
        </section>
        <section className="carte respiration-rythme">
          <h2 className="titre-carte">{textes.respiration.rythme}</h2>
          <div className="groupe-pastilles groupe-ligne">
            {PREREGLAGES.map((prereglage) => {
              const choisi =
                prereglage.inspiration === rythme.inspiration &&
                prereglage.pleine === rythme.pleine &&
                prereglage.expiration === rythme.expiration &&
                prereglage.vide === rythme.vide
              return (
                <button
                  key={prereglage.id}
                  type="button"
                  className={
                    choisi
                      ? 'bouton bouton-principal pastille pastille-courte'
                      : 'bouton bouton-secondaire pastille pastille-courte'
                  }
                  aria-pressed={choisi}
                  onClick={() => {
                    window.lev.agir({
                      type: 'respiration',
                      inspiration: prereglage.inspiration,
                      pleine: prereglage.pleine,
                      expiration: prereglage.expiration,
                      vide: prereglage.vide
                    })
                  }}
                >
                  {textes.respiration.preregles[prereglage.id]}
                </button>
              )
            })}
          </div>
          {(Object.keys(BORNES) as ChampPas[]).map((champ) => (
            <Pas
              key={champ}
              champ={champ}
              valeur={rythme[champ]}
              min={BORNES[champ].min}
              max={BORNES[champ].max}
            />
          ))}
          <fieldset className="question">
            <legend>{textes.respiration.duree}</legend>
            <div className="groupe-pastilles groupe-ligne">
              {DUREES.map((duree) => {
                const choisi = rythme.minutes === duree
                return (
                  <button
                    key={duree}
                    type="button"
                    className={
                      choisi
                        ? 'bouton bouton-principal pastille pastille-courte'
                        : 'bouton bouton-secondaire pastille pastille-courte'
                    }
                    aria-pressed={choisi}
                    onClick={() => {
                      window.lev.agir({ type: 'respiration', minutes: duree })
                    }}
                  >
                    {textes.respiration.durees[duree]}
                  </button>
                )
              })}
            </div>
          </fieldset>
        </section>
      </div>
      <p className="legende">{textes.respiration.mention}</p>
    </main>
  )
}

function Pas({
  champ,
  valeur,
  min,
  max
}: {
  champ: ChampPas
  valeur: number
  min: number
  max: number
}): React.JSX.Element {
  const nom = textes.respiration.champs[champ]
  const pause = champ === 'pleine' || champ === 'vide'
  const affiche =
    pause && valeur === 0
      ? textes.respiration.aucune
      : remplir(textes.respiration.secondes, { duree: String(valeur) })

  function ajuster(delta: number): void {
    const suivant = valeur + delta
    if (suivant < min || suivant > max) {
      return
    }
    if (champ === 'inspiration') {
      window.lev.agir({ type: 'respiration', inspiration: suivant })
      return
    }
    if (champ === 'expiration') {
      window.lev.agir({ type: 'respiration', expiration: suivant })
      return
    }
    if (champ === 'pleine') {
      window.lev.agir({ type: 'respiration', pleine: suivant })
      return
    }
    window.lev.agir({ type: 'respiration', vide: suivant })
  }

  return (
    <div className="pas">
      <span className="pas-nom">{nom}</span>
      <div className="pas-commande">
        <button
          type="button"
          className="bouton bouton-secondaire pas-bouton"
          aria-label={remplir(textes.respiration.moins, { nom })}
          disabled={valeur <= min}
          onClick={() => {
            ajuster(-1)
          }}
        >
          −
        </button>
        <span className="pas-valeur" aria-live="polite">
          {affiche}
        </span>
        <button
          type="button"
          className="bouton bouton-secondaire pas-bouton"
          aria-label={remplir(textes.respiration.plus, { nom })}
          disabled={valeur >= max}
          onClick={() => {
            ajuster(1)
          }}
        >
          +
        </button>
      </div>
    </div>
  )
}

function useMouvementReduit(): boolean {
  const [reduit, setReduit] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const appliquer = (): void => {
      setReduit(media.matches)
    }
    media.addEventListener('change', appliquer)
    return () => {
      media.removeEventListener('change', appliquer)
    }
  }, [])
  return reduit
}
