/** shellapi.h — une application est en plein écran. */
export const QUNS_BUSY = 2

/** shellapi.h — plein écran Direct3D exclusif. */
export const QUNS_RUNNING_D3D_FULL_SCREEN = 3

/** shellapi.h — mode présentation de Windows. */
export const QUNS_PRESENTATION_MODE = 4

/** Ces trois états retiennent une notification. Les autres, dont l'heure calme, non. */
export function etatRetientNotification(etat: number): boolean {
  return (
    etat === QUNS_BUSY || etat === QUNS_RUNNING_D3D_FULL_SCREEN || etat === QUNS_PRESENTATION_MODE
  )
}
