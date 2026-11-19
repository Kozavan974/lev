import { useState } from 'react'
import textes from '../../content/fr.json'

export function LienExterne({
  href,
  children,
  ariaLabel
}: {
  href: string
  children: string
  ariaLabel?: string
}): React.JSX.Element {
  const [echec, setEchec] = useState(false)

  return (
    <>
      <a
        href={href}
        aria-label={ariaLabel}
        onClick={(evenement) => {
          evenement.preventDefault()
          void window.lev.ouvrirLien(href).then((ouvert) => {
            setEchec(!ouvert)
          })
        }}
        onAuxClick={(evenement) => {
          evenement.preventDefault()
        }}
      >
        {children}
      </a>
      {echec ? (
        <span className="legende" role="status">
          {textes.lien.echec}
        </span>
      ) : null}
    </>
  )
}
