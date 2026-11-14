import { app, session, type WebContents } from 'electron'
import { POLITIQUE_DEVELOPPEMENT, POLITIQUE_PRODUCTION } from './politiqueContenu'

export function installerPolitiqueContenu(): void {
  const politique = app.isPackaged ? POLITIQUE_PRODUCTION : POLITIQUE_DEVELOPPEMENT
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [politique]
      }
    })
  })
}

export function attacherSecurite(contenu: WebContents): void {
  contenu.setWindowOpenHandler(() => ({ action: 'deny' }))
  contenu.on('will-navigate', (evenement) => {
    evenement.preventDefault()
  })
}
