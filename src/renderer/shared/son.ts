const cyclesJoues = new Set<number>()

let contexte: AudioContext | null = null

function contexteAudio(): AudioContext | null {
  if (typeof AudioContext === 'undefined') {
    return null
  }
  contexte ??= new AudioContext()
  return contexte
}

/** Deux sinus doux, environ 300 ms. Aucun fichier. */
export function jouerSonDoux(): void {
  const audio = contexteAudio()
  if (!audio) {
    return
  }
  const lancer = (): void => {
    const debut = audio.currentTime
    const gain = audio.createGain()
    gain.connect(audio.destination)
    gain.gain.setValueAtTime(0.0001, debut)
    gain.gain.exponentialRampToValueAtTime(0.04, debut + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, debut + 0.32)
    poserNote(audio, gain, 392, debut, 0.3)
    poserNote(audio, gain, 493.88, debut + 0.09, 0.23)
  }
  if (audio.state === 'suspended') {
    void audio.resume().then(lancer)
    return
  }
  lancer()
}

/** Joue une fois par cycle de notification, seulement si l'option est cochée. */
export function jouerPourCycle(cycle: number, actif: boolean): void {
  if (!actif || cyclesJoues.has(cycle)) {
    return
  }
  cyclesJoues.add(cycle)
  jouerSonDoux()
}

function poserNote(
  audio: AudioContext,
  gain: GainNode,
  frequence: number,
  debut: number,
  duree: number
): void {
  const oscillateur = audio.createOscillator()
  oscillateur.type = 'sine'
  oscillateur.frequency.setValueAtTime(frequence, debut)
  oscillateur.connect(gain)
  oscillateur.start(debut)
  oscillateur.stop(debut + duree)
}
