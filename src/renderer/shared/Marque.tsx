import { Logo } from './Logo'
import './marque.css'

export function Marque({
  titre,
  detail,
  niveau
}: {
  titre: string
  detail?: string
  niveau: 'page' | 'menu'
}): React.JSX.Element {
  return (
    <div className="marque">
      <span className="marque-icone" aria-hidden="true">
        <Logo className="marque-logo" />
      </span>
      <div className="marque-textes">
        {niveau === 'page' ? (
          <h1 className="marque-titre marque-titre-page" tabIndex={-1}>
            {titre}
          </h1>
        ) : (
          <p className="marque-titre">{titre}</p>
        )}
        {detail ? <p className="marque-detail">{detail}</p> : null}
      </div>
    </div>
  )
}
