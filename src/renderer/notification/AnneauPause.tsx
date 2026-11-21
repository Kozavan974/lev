import { useEffect, useRef, useState } from 'react'
import textes from '../../content/fr.json'
import { remplir } from '../../partage/format'
import { PAUSE_GUIDEE_MS, progressionAnneau } from '../../partage/anneauPause'

const RAYON = 15
const TOUR = 2 * Math.PI * RAYON

export function AnneauPause({ onTerminer }: { onTerminer: () => void }): React.JSX.Element {
  const [ecoule, setEcoule] = useState(0)
  const [reduit, setReduit] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  const [anime, setAnime] = useState(false)
  const debut = useRef(Date.now())
  const finir = useRef(onTerminer)
  finir.current = onTerminer

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const suivre = (): void => {
      setReduit(media.matches)
    }
    media.addEventListener('change', suivre)
    return () => {
      media.removeEventListener('change', suivre)
    }
  }, [])

  useEffect(() => {
    if (reduit) {
      return
    }
    const cadre = window.requestAnimationFrame(() => {
      setAnime(true)
    })
    return () => {
      window.cancelAnimationFrame(cadre)
    }
  }, [reduit])

  useEffect(() => {
    const fin = window.setTimeout(() => {
      finir.current()
    }, PAUSE_GUIDEE_MS)
    const tic = window.setInterval(() => {
      const passe = Date.now() - debut.current
      if (passe < PAUSE_GUIDEE_MS) {
        setEcoule(passe)
      }
    }, 1000)
    return () => {
      window.clearTimeout(fin)
      window.clearInterval(tic)
    }
  }, [])

  const reste = Math.max(1, Math.ceil((PAUSE_GUIDEE_MS - ecoule) / 1000))
  const offset = reduit ? TOUR * (1 - progressionAnneau(ecoule)) : anime ? 0 : TOUR

  return (
    <div
      className="notification-anneau"
      style={{ ['--duree-pause-guidee' as string]: `${PAUSE_GUIDEE_MS}ms` }}
    >
      <svg className="notification-anneau-dessin" viewBox="0 0 36 36" aria-hidden="true">
        <circle className="anneau-piste" cx="18" cy="18" r={RAYON} />
        <circle
          className="anneau-progression"
          cx="18"
          cy="18"
          r={RAYON}
          strokeDasharray={TOUR}
          strokeDashoffset={offset}
        />
      </svg>
      <p className="anneau-reste" role="timer">
        {remplir(textes.notification.pauseGuidee.reste, { secondes: String(reste) })}
      </p>
    </div>
  )
}
