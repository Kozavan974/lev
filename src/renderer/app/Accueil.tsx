import textes from '../../content/fr.json'
import { Logo } from '../shared/Logo'
import { useEtatEcran } from '../shared/useEtatEcran'
import { useFocusTitre } from '../shared/focusTitre'

export function Accueil(): React.JSX.Element {
  const etat = useEtatEcran()
  useFocusTitre(etat !== null)

  if (!etat) {
    return <main className="application" />
  }

  return (
    <main className="accueil-scene">
      <section className="accueil-carte">
        <span className="accueil-logo" aria-hidden="true">
          <Logo className="accueil-logo-dessin" />
        </span>
        <h1 className="accueil-titre" tabIndex={-1}>
          {textes.accueil.titre}
        </h1>
        <div className="accueil-textes">
          <p className="accueil-texte">{textes.accueil.suite}</p>
          <p className="accueil-texte">{textes.accueil.choix}</p>
        </div>
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
