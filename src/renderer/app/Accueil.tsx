import { useLayoutEffect, useState } from 'react'
import textes from '../../content/fr.json'
import { Logo } from '../shared/Logo'
import { useEtatEcran } from '../shared/useEtatEcran'
import { useFocusTitre } from '../shared/focusTitre'

export function Accueil(): React.JSX.Element {
  const etat = useEtatEcran()
  const lecture = useLectureLogo()
  useFocusTitre(etat !== null)

  if (!etat) {
    return <main className="application" />
  }

  return (
    <main className="accueil-scene">
      <section className="accueil-carte">
        <button
          type="button"
          className="accueil-logo"
          aria-label={textes.accueil.rejouerLogo}
          onClick={lecture.rejouer}
        >
          <Logo key={lecture.tour} className="accueil-logo-dessin" animer={lecture.tour > 0} />
        </button>
        <h1 className="accueil-titre" tabIndex={-1}>
          {textes.accueil.titre}
        </h1>
        <div className="accueil-textes">
          <p className="accueil-texte">{textes.accueil.suite}</p>
          <p className="accueil-texte">{textes.accueil.choix}</p>
        </div>
        <ul className="accueil-fonctions">
          {textes.accueil.fonctions.map((fonction) => (
            <li key={fonction.id} className="accueil-fonction">
              <span className="accueil-fonction-pastille">
                <IconeFonction id={fonction.id} />
              </span>
              <div className="accueil-fonction-corps">
                <h2 className="accueil-fonction-titre">{fonction.titre}</h2>
                <p className="accueil-fonction-texte">{fonction.texte}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="accueil-actions">
          <button
            type="button"
            className="bouton bouton-principal accueil-commencer"
            onClick={() => {
              window.lev.agir({ type: 'terminerAccueil', suite: 'fermer' })
            }}
          >
            {textes.accueil.commencer}
          </button>
          <button
            type="button"
            className="bouton-texte"
            onClick={() => {
              window.lev.agir({ type: 'terminerAccueil', suite: 'rappels' })
            }}
          >
            {textes.accueil.rythme}
          </button>
        </div>
        <ul className="mentions">
          {textes.accueil.mentions.map((mention) => (
            <li key={mention}>
              <svg className="coche" viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M3.2 8.4 L6.4 11.6 L12.8 4.4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{mention}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}

function useLectureLogo(): { tour: number; rejouer: () => void } {
  const [tour, setTour] = useState(0)

  useLayoutEffect(() => {
    const lancer = (): void => {
      if (document.hidden) {
        return
      }
      setTour((enCours) => (enCours === 0 ? 1 : enCours))
    }
    lancer()
    document.addEventListener('visibilitychange', lancer)
    window.addEventListener('focus', lancer)
    return () => {
      document.removeEventListener('visibilitychange', lancer)
      window.removeEventListener('focus', lancer)
    }
  }, [])

  return {
    tour,
    rejouer: () => {
      setTour((enCours) => enCours + 1)
    }
  }
}

function IconePauses(): React.JSX.Element {
  return (
    <svg className="accueil-fonction-icone" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="14" cy="4.2" r="1.7" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M14 6.2v5.4M14 8.2 9.6 6.4M14 8.6l4.6 2.4M14 11.6 10.2 17.6M14 11.6l3.6 5.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconeSequences(): React.JSX.Element {
  return (
    <svg className="accueil-fonction-icone" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8 4.8h8L12 12l4 7.2H8L12 12 8 4.8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconeSouffle(): React.JSX.Element {
  return (
    <svg className="accueil-fonction-icone" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 6.2a5.8 5.8 0 0 1 5.8 5.8M12 17.8A5.8 5.8 0 0 1 6.2 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconePoste(): React.JSX.Element {
  return (
    <svg className="accueil-fonction-icone" viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="3.5"
        y="4"
        width="17"
        height="11"
        rx="1.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M9 19.5h6M12 15v4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

const ICONES_ACCUEIL: Record<string, () => React.JSX.Element> = {
  pauses: IconePauses,
  sequences: IconeSequences,
  respiration: IconeSouffle,
  poste: IconePoste
}

function IconeFonction({ id }: { id: string }): React.JSX.Element | null {
  const Dessin = ICONES_ACCUEIL[id]
  if (!Dessin) {
    return null
  }
  return <Dessin />
}
