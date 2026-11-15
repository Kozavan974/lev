import { useState } from 'react'
import textes from '../../content/fr.json'

export function LienExterne({
  href,
  children
}: {
  href: string
  children: string
}): React.JSX.Element {
  const [echec, setEchec] = useState(false)

  return (
    <>
      <a
        href={href}
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
