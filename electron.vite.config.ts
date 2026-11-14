import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import type { Plugin } from 'vite'
import { POLITIQUE_PRODUCTION } from './src/main/politiqueContenu'

function injecterPolitiqueProduction(): Plugin {
  return {
    name: 'lev:politique-contenu',
    apply: 'build',
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: {
            'http-equiv': 'Content-Security-Policy',
            content: POLITIQUE_PRODUCTION
          },
          injectTo: 'head'
        }
      ]
    }
  }
}

export default defineConfig({
  main: {
    // electron-store est en ESM pur. Le processus principal est empaqueté en
    // CommonJS : on l'exclut de l'externalisation pour l'inclure dans le bundle
    // et éviter ERR_REQUIRE_ESM. Electron lui-même reste externe.
    plugins: [externalizeDepsPlugin({ exclude: ['electron-store'] })]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@polices': resolve('resources/fonts')
      }
    },
    plugins: [react(), injecterPolitiqueProduction()]
  }
})
