import { useCallback, useEffect, useRef, useState } from 'react'
import textes from '../../content/fr.json'
import type { ReponseBouton, VueMessage, VueNotification } from '../../preload/contrat'
import { Logo } from '../shared/Logo'
import { PictoBouger, PictoLibre, PictoPosture, PictoYeux } from '../shared/Pictogrammes'
import './notification.css'

export function Notification(): React.JSX.Element {
  const [vue, setVue] = useState<VueNotification | null>(null)
  const [message, setMessage] = useState<VueMessage | null>(null)
  const [sortie, setSortie] = useState(false)
  const carteRef = useRef<HTMLElement>(null)
  const vueRef = useRef(vue)
  const messageRef = useRef(message)
  const sortieRef = useRef(sortie)
  const survol = useRef(false)
  const aLeFocus = useRef(false)
  const restant = useRef(0)
  const echeance = useRef(0)
  const minuteur = useRef<number | null>(null)
  const ignoreExpiration = useRef(false)
  const generation = useRef(0)
  const repondreRef = useRef<(reponse: ReponseBouton) => void>(() => undefined)
  const suspensionRef = useRef<(origine: 'survol' | 'focus', actif: boolean) => void>(
    () => undefined
  )

  const arreterDisparition = useCallback((): void => {
    if (minuteur.current !== null) {
      window.clearTimeout(minuteur.current)
      minuteur.current = null
    }
  }, [])

  const peutCompter = useCallback(
    (): boolean =>
      vueRef.current !== null &&
      messageRef.current === null &&
      !sortieRef.current &&
      !ignoreExpiration.current,
    []
  )

  const lancerDisparition = useCallback((): void => {
    arreterDisparition()
    if (!peutCompter() || survol.current || aLeFocus.current) {
      return
    }
    echeance.current = Date.now() + restant.current
    minuteur.current = window.setTimeout(() => {
      if (!peutCompter()) {
        return
      }
      ignoreExpiration.current = true
      window.lev.expirer()
      setSortie(true)
    }, restant.current)
  }, [arreterDisparition, peutCompter])

  const poserSuspension = useCallback(
    (origine: 'survol' | 'focus', actif: boolean): void => {
      if (origine === 'survol') {
        survol.current = actif
      } else {
        aLeFocus.current = actif
      }
      if (!peutCompter()) {
        return
      }
      if (survol.current || aLeFocus.current) {
        if (minuteur.current !== null) {
          restant.current = Math.max(0, echeance.current - Date.now())
          arreterDisparition()
        }
        return
      }
      lancerDisparition()
    },
    [arreterDisparition, lancerDisparition, peutCompter]
  )

  const repondre = useCallback(
    (reponse: ReponseBouton): void => {
      if (!vueRef.current || messageRef.current || ignoreExpiration.current) {
        return
      }
      ignoreExpiration.current = true
      arreterDisparition()
      window.lev.repondre(reponse)
    },
    [arreterDisparition]
  )
  useEffect(() => {
    vueRef.current = vue
    messageRef.current = message
    sortieRef.current = sortie
    repondreRef.current = repondre
    suspensionRef.current = poserSuspension
  }, [vue, message, sortie, repondre, poserSuspension])

  useEffect(() => {
    const retirerVue = window.lev.surAffichage((recue) => {
      generation.current += 1
      ignoreExpiration.current = false
      survol.current = false
      setSortie(false)
      setMessage(null)
      setVue(recue)
    })
    const retirerMessage = window.lev.surMessage((recu) => {
      ignoreExpiration.current = true
      arreterDisparition()
      setMessage(recu)
    })
    window.lev.prete()
    return () => {
      retirerVue()
      retirerMessage()
      arreterDisparition()
    }
  }, [arreterDisparition])

  const cycle = vue?.cycle
  const delaiDisparition = vue?.delaiDisparitionMs
  useEffect(() => {
    if (cycle === undefined || message || sortie) {
      arreterDisparition()
      return
    }
    restant.current = delaiDisparition ?? 0
    lancerDisparition()
    return arreterDisparition
  }, [cycle, delaiDisparition, message, sortie, arreterDisparition, lancerDisparition])

  useEffect(() => {
    if (!message || sortie) {
      return
    }
    const attente = window.setTimeout(() => {
      setSortie(true)
    }, message.dureeMs)
    return () => {
      window.clearTimeout(attente)
    }
  }, [message, sortie])

  useEffect(() => {
    if (!sortie) {
      return
    }
    const carte = carteRef.current
    const generationAttendue = generation.current
    let fait = false
    const terminer = (evenement?: Event): void => {
      if (evenement instanceof TransitionEvent && evenement.propertyName !== 'opacity') {
        return
      }
      if (fait || generation.current !== generationAttendue) {
        return
      }
      fait = true
      window.lev.masquageTermine()
    }
    const secours = window.setTimeout(() => {
      terminer()
    }, 250)
    carte?.addEventListener('transitionend', terminer)
    return () => {
      window.clearTimeout(secours)
      carte?.removeEventListener('transitionend', terminer)
    }
  }, [sortie])

  useEffect(() => {
    const carte = carteRef.current
    if (!carte) {
      return
    }
    const mesurer = (): void => {
      window.lev.definirHauteur(carte.getBoundingClientRect().height)
    }
    const observateur = new ResizeObserver(mesurer)
    observateur.observe(carte)
    mesurer()
    return () => {
      observateur.disconnect()
    }
  }, [vue, message, sortie])

  useEffect(() => {
    const gagner = (): void => {
      suspensionRef.current('focus', true)
    }
    const perdre = (): void => {
      suspensionRef.current('focus', false)
    }
    const surTouche = (evenement: KeyboardEvent): void => {
      if (evenement.key !== 'Escape') {
        return
      }
      evenement.preventDefault()
      repondreRef.current('plusTard')
    }
    window.addEventListener('focus', gagner)
    window.addEventListener('blur', perdre)
    window.addEventListener('keydown', surTouche)
    return () => {
      window.removeEventListener('focus', gagner)
      window.removeEventListener('blur', perdre)
      window.removeEventListener('keydown', surTouche)
    }
  }, [])

  const visible = vue !== null || message !== null

  return (
    <div
      className="notification-scene"
      onMouseEnter={() => {
        poserSuspension('survol', true)
      }}
      onMouseLeave={() => {
        poserSuspension('survol', false)
      }}
    >
      {visible ? (
        <article
          ref={carteRef}
          className={sortie ? 'notification-carte sortie' : 'notification-carte'}
          aria-labelledby={message ? undefined : 'notification-titre'}
        >
          <Logo />
          {message ? (
            <p className="notification-message" role="status">
              {message.texte}
            </p>
          ) : vue ? (
            <>
              <header className="notification-entete">
                <span className="notification-picto">{picto(vue.type)}</span>
                <div className="notification-texte">
                  <h1 id="notification-titre" className="notification-titre">
                    {vue.titre}
                  </h1>
                  <p className="notification-phrase">{vue.phrase}</p>
                </div>
              </header>
              {vue.idee ? (
                <div className="notification-idee">
                  <p className="notification-idee-texte">{vue.idee}</p>
                  <div className="notification-idee-actions">
                    <button
                      type="button"
                      className="bouton bouton-secondaire"
                      onClick={() => window.lev.autreIdee()}
                    >
                      {textes.notification.idee.autre}
                    </button>
                    <button
                      type="button"
                      className="bouton bouton-secondaire"
                      onClick={() => window.lev.definirVariante(!vue.assis)}
                    >
                      {vue.assis ? textes.notification.idee.debout : textes.notification.idee.assis}
                    </button>
                  </div>
                </div>
              ) : null}
              <div className="notification-actions">
                <button
                  type="button"
                  className="bouton bouton-principal"
                  onClick={() => repondre('jeLeFais')}
                >
                  {textes.notification.boutons.jeLeFais}
                </button>
                <button
                  type="button"
                  className="bouton bouton-secondaire"
                  onClick={() => repondre('dans5min')}
                >
                  {textes.notification.boutons.dans5min}
                </button>
                <button
                  type="button"
                  className="bouton bouton-discret"
                  onClick={() => repondre('plusTard')}
                >
                  {textes.notification.boutons.plusTard}
                </button>
              </div>
            </>
          ) : null}
        </article>
      ) : null}
    </div>
  )
}

function picto(type: VueNotification['type']): React.JSX.Element {
  if (type === 'yeux') {
    return <PictoYeux />
  }
  if (type === 'bouger') {
    return <PictoBouger />
  }
  if (type === 'posture') {
    return <PictoPosture />
  }
  return <PictoLibre />
}
