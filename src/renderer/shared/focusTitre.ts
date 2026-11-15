import { useEffect } from 'react'

export function useFocusTitre(pret: boolean): void {
  useEffect(() => {
    if (!pret) {
      return
    }
    const titre = document.querySelector('h1')
    if (titre instanceof HTMLElement) {
      titre.focus()
    }
  }, [pret])
}
