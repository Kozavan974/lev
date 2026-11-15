import { Logo } from './Logo'
import './marque.css'

export function Marque({
  titre,
  detail,
  niveau
}: {
  titre: string
  detail: string
  niveau: 'page' | 'menu'
}): React.JSX.Element {
  return (
    <div className="marque">
      <span className="marque-icone" aria-hidden="true">
        <Logo className="marque-logo" />
      </span>
      <div className="marque-textes">
        {niveau === 'page' ? (
          <h1 className="marque-titre marque-titre-page">{titre}</h1>
        ) : (
          <p className="marque-titre">{titre}</p>
        )}
        <p className="marque-detail">{detail}</p>
      </div>
    </div>
  )
}
