import { useEffect, useState } from 'react'
import textes from '../../content/fr.json'
import { remplir } from '../../partage/format'
import type { EtatMaj, VersionsTechniques } from '../../preload/contrat'
import { LienExterne } from '../shared/LienExterne'
import { RetourRappels } from '../shared/RetourRappels'
import { useEtatEcran } from '../shared/useEtatEcran'
import { useFocusTitre } from '../shared/focusTitre'

type SuiviMaj = { phase: 'repos' } | { phase: 'cours' } | { phase: 'reponse'; resultat: EtatMaj }

export function APropos(): React.JSX.Element {
  const etat = useEtatEcran()
  const [suivi, setSuivi] = useState<SuiviMaj>({ phase: 'repos' })
  const [moteurs, setMoteurs] = useState<VersionsTechniques | null>(null)
  useFocusTitre(etat !== null)
  useEffect(() => {
    let actif = true
    void window.lev.versionsTechniques().then(
      (valeur) => {
        if (actif) {
          setMoteurs(valeur)
        }
      },
      () => {
        if (actif) {
          setMoteurs(null)
        }
      }
    )
    return () => {
      actif = false
    }
  }, [])

  if (!etat) {
    return <main className="application" />
  }

  const page = textes.apropos
  const maj = page.ekilib.maj
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

        <Tiroir
          titre={page.ekilib.titre}
          classe="repli-ekilib"
          resume={
            <>
              {page.ekilib.titreAvant}
              <Coeur />
              {page.ekilib.titreApres}
            </>
          }
        >
          <div className="ekilib">
            <ul className="ekilib-badges">
              {page.ekilib.badges.map((badge) => (
                <li key={badge}>{badge}</li>
              ))}
            </ul>
            <p className="corps ekilib-origine">
              {page.ekilib.avant}
              <LienExterne href={page.ekilib.url}>{page.ekilib.lien}</LienExterne>
              {page.ekilib.apres}
              <strong>{page.ekilib.chaquePas}</strong>
            </p>
            <div className="ekilib-encart">
              <PhraseLien
                avant={page.ekilib.maisonsAvant}
                lien={page.ekilib.maisonsLien}
                url={page.ekilib.maisonsUrl}
                apres={page.ekilib.maisonsApres}
              />
              <p className="corps">
                <LienExterne href={page.ekilib.procheUrl}>{page.ekilib.proche}</LienExterne>
              </p>
            </div>
            <div className="ekilib-liens">
              <LienExterne href={page.decouvrir.url} ariaLabel={page.decouvrir.aria}>
                {page.decouvrir.lien}
              </LienExterne>
              <LienExterne href={page.code.url} ariaLabel={page.code.aria}>
                {page.code.lien}
              </LienExterne>
            </div>
            <div className="ekilib-maj">
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
            </div>
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
      {moteurs ? (
        <p className="legende signature-technique">
          {remplir(page.moteurs, {
            version: moteurs.version,
            electron: moteurs.electron,
            chrome: moteurs.chrome
          })}
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
  classe,
  resume,
  children
}: {
  titre: string
  classe?: string
  resume?: React.ReactNode
  children: React.ReactNode
}): React.JSX.Element {
  const classes = classe ? `carte repli ${classe}` : 'carte repli'
  return (
    <details className={classes}>
      <summary aria-label={resume ? titre : undefined}>
        <span className={resume ? 'repli-titre' : undefined}>{resume ?? titre}</span>
        <Chevron />
      </summary>
      <div className="corps-repli">{children}</div>
    </details>
  )
}

function Coeur(): React.JSX.Element {
  return (
    <svg className="ekilib-coeur" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 20.2c-.3 0-6.8-4.1-8.8-7.7-1.4-2.5-.6-5.4 2.1-6.4 1.8-.7 3.5-.1 4.6 1.4L12 10.2l2.1-2.7c1.1-1.5 2.8-2.1 4.6-1.4 2.7 1 3.5 3.9 2.1 6.4-2 3.6-8.5 7.7-8.8 7.7Z"
      />
    </svg>
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
