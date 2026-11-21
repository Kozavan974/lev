import { useEffect, useRef } from 'react'
import textes from '../../content/fr.json'
import { ligneDecompte } from '../../partage/compteARebours'
import { remplir } from '../../partage/format'
import type { EtatSequence } from '../../preload/contrat'
import { Marque } from '../shared/Marque'
import { useEtatEcran } from '../shared/useEtatEcran'
import './menu.css'

function ligneSequence(sequence: EtatSequence): React.JSX.Element | null {
  if (!sequence) {
    return null
  }
  if (sequence.phase === 'reprise') {
    return <p className="menu-echeance">{textes.menu.repriseSequence}</p>
  }
  return (
    <p className="menu-echeance">
      {ligneDecompte(sequence, {
        travail: textes.menu.decompteTravail,
        pause: textes.menu.decomptePause,
        grande: textes.menu.decompteGrande
      })}
    </p>
  )
}

export function Menu(): React.JSX.Element {
  const etat = useEtatEcran()
  const carteRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const carte = carteRef.current
    if (!carte) {
      return
    }
    const mesurer = (): void => {
      window.lev.definirHauteurMenu(carte.getBoundingClientRect().height)
    }
    const observateur = new ResizeObserver(mesurer)
    observateur.observe(carte)
    mesurer()
    return () => {
      observateur.disconnect()
    }
  }, [etat])

  useEffect(() => {
    const surTouche = (evenement: KeyboardEvent): void => {
      if (evenement.key !== 'Escape') {
        return
      }
      evenement.preventDefault()
      window.lev.fermerMenu()
    }
    window.addEventListener('keydown', surTouche)
    return () => {
      window.removeEventListener('keydown', surTouche)
    }
  }, [])

  if (!etat) {
    return <main className="menu-scene" />
  }

  const sequences = etat.reglages.sequences.actif
  const pausePrincipale = !sequences

  return (
    <main className="menu-scene">
      <section className="menu-carte" ref={carteRef}>
        <Marque titre={textes.application.nom} detail={textes.menu.devise} niveau="menu" />
        <section className="menu-pauses">
          <h2>{textes.menu.pauses}</h2>
          <div className="menu-annonces" aria-live="polite">
            {ligneSequence(etat.sequence)}
            {etat.echeances.map((echeance) => (
              <p key={`${echeance.nom}-${echeance.heure}`} className="menu-echeance">
                {remplir(textes.menu.echeance, echeance)}
              </p>
            ))}
            {etat.pauseSpontanee ? (
              <p className="menu-echeance">
                {remplir(textes.menu.leve, { heure: etat.pauseSpontanee.heure })}
              </p>
            ) : null}
          </div>
        </section>
        <div className="menu-actions">
          {sequences ? (
            <button
              type="button"
              className="bouton bouton-principal"
              onClick={() => {
                if (!etat.sequence) {
                  window.lev.fermerMenu()
                }
                window.lev.agir({
                  type: etat.sequence ? 'arreterSequences' : 'demarrerSequence'
                })
              }}
            >
              {etat.sequence ? textes.menu.arreterSequences : textes.menu.sequence}
            </button>
          ) : null}
          {sequences && !etat.sequence ? (
            <p className="menu-legende">
              {remplir(textes.menu.rythmeSequence, {
                travail: String(etat.reglages.sequences.travailMin),
                pause: String(etat.reglages.sequences.pauseMin)
              })}
            </p>
          ) : null}
          <button
            type="button"
            className={pausePrincipale ? 'bouton bouton-principal' : 'bouton bouton-secondaire'}
            onClick={() => {
              window.lev.fermerMenu()
              window.lev.agir({ type: 'pause' })
            }}
          >
            {textes.menu.pause}
          </button>
          <button
            type="button"
            className="bouton bouton-secondaire"
            onClick={() => {
              window.lev.agir({ type: etat.reunionLibelle ? 'reprendreReunion' : 'reunion' })
            }}
          >
            {etat.reunionLibelle
              ? remplir(textes.menu.reunionEnCours, { heure: etat.reunionLibelle })
              : textes.menu.reunion}
          </button>
        </div>
        <div className="menu-separateur" />
        {etat.veilleLibelle ? (
          <div className="menu-groupe">
            <p className="menu-veille-etat">
              {remplir(textes.menu.enVeille, { heure: etat.veilleLibelle })}
            </p>
            <button
              type="button"
              className="bouton bouton-secondaire"
              onClick={() => {
                window.lev.agir({ type: 'reprendre' })
              }}
            >
              {textes.menu.reprendre}
            </button>
          </div>
        ) : (
          <div className="menu-groupe">
            <p className="menu-veille-titre">{textes.menu.veille}</p>
            <div className="menu-veilles">
              <button
                type="button"
                className="menu-veille"
                onClick={() => {
                  window.lev.agir({ type: 'veille', duree: '30min' })
                }}
              >
                {textes.menu.veille30}
              </button>
              <button
                type="button"
                className="menu-veille"
                onClick={() => {
                  window.lev.agir({ type: 'veille', duree: 'demain' })
                }}
              >
                {textes.menu.veilleDemain}
              </button>
            </div>
          </div>
        )}
        <div className="menu-separateur" />
        <nav className="menu-groupe">
          <button
            type="button"
            className="menu-lien"
            onClick={() => {
              window.lev.fermerMenu()
              window.lev.agir({ type: 'ouvrirEcran', ecran: 'respiration' })
            }}
          >
            {textes.menu.respirer}
          </button>
          <button
            type="button"
            className="menu-lien"
            onClick={() => {
              window.lev.fermerMenu()
              window.lev.agir({ type: 'ouvrirEcran', ecran: 'poste' })
            }}
          >
            {textes.menu.poste}
          </button>
          <button
            type="button"
            className="menu-lien"
            onClick={() => {
              window.lev.fermerMenu()
              window.lev.agir({ type: 'ouvrirEcran', ecran: 'rappels' })
            }}
          >
            {textes.menu.rappels}
          </button>
          <button
            type="button"
            className="menu-lien"
            aria-label={etat.majDisponible ? textes.menu.aproposMaj : undefined}
            onClick={() => {
              window.lev.fermerMenu()
              window.lev.agir({ type: 'ouvrirEcran', ecran: 'apropos' })
            }}
          >
            <span>{textes.menu.apropos}</span>
            {etat.majDisponible ? <span className="menu-pastille" aria-hidden="true" /> : null}
          </button>
          <button
            type="button"
            className="menu-lien menu-lien-discret"
            onClick={() => {
              window.lev.agir({ type: 'quitter' })
            }}
          >
            {textes.menu.quitter}
          </button>
        </nav>
      </section>
    </main>
  )
}
