import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Application } from './app/Application'
import { Menu } from './menu/Menu'
import { Notification } from './notification/Notification'
import './shared/base.css'

type Route = 'notification' | 'menu' | 'app'

function routeDepuisHash(hash: string): Route {
  if (hash === '#/notification') {
    return 'notification'
  }
  if (hash === '#/menu') {
    return 'menu'
  }
  return 'app'
}

function Racine(): React.JSX.Element {
  const [route, setRoute] = useState<Route>(() => routeDepuisHash(window.location.hash))

  useEffect(() => {
    const appliquer = (): void => {
      setRoute(routeDepuisHash(window.location.hash))
    }
    window.addEventListener('hashchange', appliquer)
    return () => {
      window.removeEventListener('hashchange', appliquer)
    }
  }, [])

  useEffect(() => {
    document.documentElement.dataset.route = route
    if (route === 'notification' || route === 'menu') {
      document.documentElement.dataset.fond = 'transparent'
    } else {
      delete document.documentElement.dataset.fond
    }
  }, [route])

  if (route === 'notification') {
    return <Notification />
  }
  if (route === 'menu') {
    return <Menu />
  }
  return <Application />
}

const conteneur = document.getElementById('racine')
if (!conteneur) {
  throw new Error('Conteneur racine introuvable.')
}

createRoot(conteneur).render(
  <StrictMode>
    <Racine />
  </StrictMode>
)
