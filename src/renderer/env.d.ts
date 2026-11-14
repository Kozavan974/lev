/// <reference types="vite/client" />

import type { ApiLev } from '../preload/contrat'

declare global {
  interface Window {
    lev: ApiLev
  }
}
