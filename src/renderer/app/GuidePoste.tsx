import guide from '../../content/guide.fr.json'
import textes from '../../content/fr.json'
import { remplir } from '../../partage/format'
import { LienExterne } from '../shared/LienExterne'
import { RetourRappels } from '../shared/RetourRappels'
import { useEtatEcran } from '../shared/useEtatEcran'
import { useFocusTitre } from '../shared/focusTitre'

export function GuidePoste(): React.JSX.Element {
  const etat = useEtatEcran()
  useFocusTitre(etat !== null)

  if (!etat) {
    return <main className="application" />
  }

  const total = String(guide.etapes.length)

  return (
    <main className="application">
      <RetourRappels />
      <h1 className="titre-ecran" tabIndex={-1}>
        {textes.poste.titre}
      </h1>
      {guide.etapes.map((etape, index) => {
        const coche = etat.reglages.guidePoste[index] === true
        return (
          <section className="carte" key={etape.titre}>
            <p className="legende">
              {remplir(textes.poste.etape, { numero: String(index + 1), total })}
            </p>
            <label className="choix">
              <input
                className="case"
                type="checkbox"
                checked={coche}
                onChange={(evenement) => {
                  window.lev.agir({ type: 'guide', index, coche: evenement.target.checked })
                }}
              />
              <span className="titre-carte">{etape.titre}</span>
            </label>
            <p className="corps">{etape.texte}</p>
          </section>
        )
      })}
      <aside className="encadre">
        <h2 className="sous-titre">{guide.encadre.titre}</h2>
        <p className="corps">{guide.encadre.texte}</p>
      </aside>
      <div className="guide-actions">
        <button
          type="button"
          className="bouton bouton-principal"
          onClick={() => {
            window.lev.agir({ type: 'fermerGuide' })
          }}
        >
          {textes.poste.toutBon}
        </button>
        <button
          type="button"
          className="bouton bouton-secondaire"
          onClick={() => {
            window.lev.agir({ type: 'fermerGuide' })
          }}
        >
          {textes.poste.plusTard}
        </button>
      </div>
      <footer className="guide-ressources">
        <p className="legende">
          {guide.source} <LienExterne href={guide.lien.url}>{guide.lien.libelle}</LienExterne>
        </p>
        <h2 className="sous-titre">{textes.poste.video.titre}</h2>
        <p className="legende">{textes.poste.video.texte}</p>
        <p className="corps">
          <LienExterne href={textes.poste.video.url} ariaLabel={textes.poste.video.aria}>
            {textes.poste.video.lien}
          </LienExterne>
        </p>
      </footer>
    </main>
  )
}
