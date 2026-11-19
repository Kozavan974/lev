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
          <p className="legende">{textes.respiration.accroche}</p>
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
        <div className="tiroirs">
          <details className="carte repli">
            <summary>
              <span>
                {textes.respiration.rythme}
                <span className="repli-resume">{` · ${resumeRythme(rythme)}`}</span>
              </span>
              <Chevron />
            </summary>
            <div className="corps-repli">
              <div className="groupe-pastilles groupe-ligne">
                {PREREGLAGES.map((prereglage) => {
                  const choisi = rythmeCorrespond(rythme, prereglage)
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
              <p className="respiration-retenu">{textes.respiration.retenu}</p>
            </div>
          </details>
          <details className="carte repli">
            <summary>
              <span>
                {textes.respiration.duree}
                <span className="repli-resume">{` · ${textes.respiration.durees[rythme.minutes]}`}</span>
              </span>
              <Chevron />
            </summary>
            <div className="corps-repli">
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
            </div>
          </details>
        </div>
      </div>
      <aside className="conseil">
        <Souffle />
        <div>
          <p className="conseil-principal">{textes.respiration.conseil}</p>
          <p className="conseil-suite">{textes.respiration.gene}</p>
        </div>
      </aside>
    </main>
  )
}

function rythmeCorrespond(
  rythme: RythmeRespiration,
  candidat: { inspiration: number; pleine: number; expiration: number; vide: number }
): boolean {
  return (
    candidat.inspiration === rythme.inspiration &&
    candidat.pleine === rythme.pleine &&
    candidat.expiration === rythme.expiration &&
    candidat.vide === rythme.vide
  )
}

function resumeRythme(rythme: RythmeRespiration): string {
  const prereglage = PREREGLAGES.find((candidat) => rythmeCorrespond(rythme, candidat))
  if (prereglage) {
    return remplir(textes.respiration.resumePrereglage, {
      nom: textes.respiration.preregles[prereglage.id],
      inspiration: String(prereglage.inspiration),
      pleine: String(prereglage.pleine),
      expiration: String(prereglage.expiration),
      vide: String(prereglage.vide)
    })
  }
  if (rythme.pleine === 0 && rythme.vide === 0) {
    return remplir(textes.respiration.resumeSouffle, {
      inspiration: String(rythme.inspiration),
      expiration: String(rythme.expiration)
    })
  }
  return remplir(textes.respiration.resumeCycle, {
    inspiration: String(rythme.inspiration),
    pleine: String(rythme.pleine),
    expiration: String(rythme.expiration),
    vide: String(rythme.vide)
  })
}

function Chevron(): React.JSX.Element {
  return (
    <svg className="chevron" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 9l6 6 6-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Souffle(): React.JSX.Element {
  return (
    <svg className="conseil-icone" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 9c2.2-3.2 4.4-3.2 6.6 0s4.4 3.2 6.6 0 4.4-3.2 6.6 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M3 15c2.2-3.2 4.4-3.2 6.6 0s4.4 3.2 6.6 0 4.4-3.2 6.6 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
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
