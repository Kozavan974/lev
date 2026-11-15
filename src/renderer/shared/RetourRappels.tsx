import textes from '../../content/fr.json'

export function RetourRappels(): React.JSX.Element {
  return (
    <p className="retour">
      <button
        type="button"
        className="bouton-texte"
        onClick={() => {
          window.lev.agir({ type: 'ouvrirEcran', ecran: 'rappels' })
        }}
      >
        {textes.application.retourRappels}
      </button>
    </p>
  )
}
