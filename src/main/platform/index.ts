import { configurerWindows } from './win32'

export function configurerPlateforme(): void {
  if (process.platform === 'win32') {
    configurerWindows()
  }
}
