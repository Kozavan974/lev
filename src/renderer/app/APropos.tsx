import textes from '../../content/fr.json'
import { remplir } from '../../partage/format'
import { LienExterne } from '../shared/LienExterne'
import { RetourRappels } from '../shared/RetourRappels'
import { useEtatEcran } from '../shared/useEtatEcran'
import { useFocusTitre } from '../shared/focusTitre'

/** Les mises à jour restent désactivées tant que l'hébergement n'est pas décidé. */
const MISES_A_JOUR_ACTIVES = false

export function APropos(): React.JSX.Element {
  const etat = useEtatEcran()
  useFocusTitre(etat !== null)

  if (!etat) {
    return <main className="application" />
  }

  const page = textes.apropos

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
          {MISES_A_JOUR_ACTIVES ? <p className="legende">{page.ekilib.miseAJour}</p> : null}
        </Tiroir>
      </div>

      <p className="signature">{page.signatureFin}</p>
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
