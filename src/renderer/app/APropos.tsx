import { useState } from 'react'
import textes from '../../content/fr.json'
import { remplir } from '../../partage/format'
import type { EtatMaj } from '../../preload/contrat'
import { LienExterne } from '../shared/LienExterne'
import { RetourRappels } from '../shared/RetourRappels'
import { useEtatEcran } from '../shared/useEtatEcran'
import { useFocusTitre } from '../shared/focusTitre'

type SuiviMaj = { phase: 'repos' } | { phase: 'cours' } | { phase: 'reponse'; resultat: EtatMaj }

export function APropos(): React.JSX.Element {
  const etat = useEtatEcran()
  const [suivi, setSuivi] = useState<SuiviMaj>({ phase: 'repos' })
  useFocusTitre(etat !== null)

  if (!etat) {
    return <main className="application" />
  }

  const page = textes.apropos
  const maj = page.ekilib.maj
  const moteurs = window.lev.versionsTechniques()
  let annonce = ''
  let proposerTelechargement = false
  if (suivi.phase === 'cours') {
    annonce = maj.cours
  } else if (suivi.phase === 'reponse' && suivi.resultat.statut === 'a-jour') {
    annonce = maj.aJour
  } else if (suivi.phase === 'reponse' && suivi.resultat.statut === 'erreur') {
    annonce = maj.erreur
    proposerTelechargement = etat.majDisponible !== null
  } else if (suivi.phase === 'reponse' && suivi.resultat.statut === 'disponible') {
    annonce = remplir(maj.disponible, { version: suivi.resultat.version })
    proposerTelechargement = true
  } else if (etat.majDisponible) {
    annonce = remplir(maj.disponible, { version: etat.majDisponible })
    proposerTelechargement = true
  }

  return (
    <main className="application">
      <RetourRappels />
      <header className="entete">
        <h1 className="titre-ecran" tabIndex={-1}>
          {page.titre}
        </h1>
        <p className="signature">{page.signature}</p>
        <p className="corps">{page.phrase}</p>
      </header>

      <div className="tiroirs">
        <Tiroir titre={page.philosophie.titre}>
          <div className="liste-textes">
            {page.philosophie.principes.map((principe) => (
              <div key={principe.titre} className="bloc-texte">
                <h3 className="sous-titre">{principe.titre}</h3>
                <p className="corps">{principe.texte}</p>
              </div>
            ))}
          </div>
        </Tiroir>

        <Tiroir titre={page.reperes.titre}>
          <div className="liste-textes">
            {page.reperes.items.map((item) => (
              <div key={item.titre} className="bloc-texte">
                <h3 className="sous-titre">{item.titre}</h3>
                <p className="corps">{item.texte}</p>
              </div>
            ))}
          </div>
          <p className="corps">
            <button
              type="button"
              className="bouton-texte"
              onClick={() => {
                window.lev.agir({ type: 'ouvrirEcran', ecran: 'poste' })
              }}
            >
              {page.reperes.lienPoste}
            </button>
          </p>
        </Tiroir>

        <Tiroir titre={page.references.titre}>
          <ul className="references">
            {page.references.liens.map((lien) => (
              <li key={lien.url}>
                <p className="legende">{lien.organisme}</p>
                <LienExterne href={lien.url}>{lien.titre}</LienExterne>
              </li>
            ))}
          </ul>
        </Tiroir>

        <Tiroir titre={page.ekilib.titre}>
          <PhraseLien
            avant={page.ekilib.avant}
            lien={page.ekilib.lien}
            url={page.ekilib.url}
            apres={page.ekilib.apres}
          />
          <h3 className="sous-titre">{page.ekilib.suiteTitre}</h3>
          <PhraseLien
            avant={page.ekilib.maisonsAvant}
            lien={page.ekilib.maisonsLien}
            url={page.ekilib.maisonsUrl}
            apres={page.ekilib.maisonsApres}
          />
          <p className="corps">
            <LienExterne href={page.ekilib.procheUrl}>{page.ekilib.proche}</LienExterne>
          </p>
          <p className="legende">{remplir(page.ekilib.version, { version: etat.version })}</p>
          <button
            type="button"
            className="bouton-texte"
            disabled={suivi.phase === 'cours'}
            onClick={() => {
              setSuivi({ phase: 'cours' })
              void window.lev.verifierMisesAJour().then(
                (resultat) => {
                  setSuivi({ phase: 'reponse', resultat })
                },
                () => {
                  setSuivi({ phase: 'reponse', resultat: { statut: 'erreur' } })
                }
              )
            }}
          >
            {maj.verifier}
          </button>
          <div className="liste-textes" aria-live="polite">
            {annonce ? <p className="legende">{annonce}</p> : null}
            {proposerTelechargement ? (
              <p className="corps">
                <LienExterne href={maj.url}>{maj.telecharger}</LienExterne>
              </p>
            ) : null}
          </div>
        </Tiroir>
      </div>

      <p>
        <button
          type="button"
          className="bouton-texte"
          onClick={() => {
            window.lev.agir({ type: 'revoirAccueil' })
          }}
        >
          {page.revoirAccueil}
        </button>
      </p>
      <p className="corps">
        <LienExterne href={page.decouvrir.url} ariaLabel={page.decouvrir.aria}>
          {page.decouvrir.lien}
        </LienExterne>
      </p>
      <p className="signature">{page.signatureFin}</p>
      {moteurs ? (
        <p className="legende">
          {remplir(page.moteurs, { electron: moteurs.electron, chrome: moteurs.chrome })}
        </p>
      ) : null}
    </main>
  )
}

function PhraseLien({
  avant,
  lien,
  url,
  apres
}: {
  avant: string
  lien: string
  url: string
  apres: string
}): React.JSX.Element {
  return (
    <p className="corps">
      {avant}
      <LienExterne href={url}>{lien}</LienExterne>
      {apres}
    </p>
  )
}

function Tiroir({
  titre,
  children
}: {
  titre: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <details className="carte repli">
      <summary>
        <span>{titre}</span>
        <Chevron />
      </summary>
      <div className="corps-repli">{children}</div>
    </details>
  )
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
