import { useState, type FormEvent } from 'react'
import textes from '../../content/fr.json'
import { formaterHeure, remplir } from '../../partage/format'
import type { Frequence, Jours, Rappel, Repetition, RythmeSequence } from '../../partage/modeles'
import { FREQUENCES } from '../../partage/modeles'
import type { ActionEcran, ClefOption } from '../../preload/contrat'
import { Marque } from '../shared/Marque'
import { jouerSonDoux } from '../shared/son'
import { useEtatEcran } from '../shared/useEtatEcran'
import { useFocusTitre } from '../shared/focusTitre'

const PASTILLES = [20, 30, 60, 120, 240] as const
const REPETITIONS = ['jour', 'semaine', 'une'] as const
const JOURS = ['semaine', 'samedi', 'jour'] as const
const RYTHMES = ['25-5', '50-10', 'heure', 'autre'] as const
const THEMES = ['auto', 'clair', 'sombre'] as const
const OPTIONS = [
  'attendreAccalmie',
  'pausesSpontanees',
  'nePasDeranger',
  'proposerEspacer',
  'mouvementsAssis',
  'son',
  'lancerAuDemarrage'
] as const satisfies readonly ClefOption[]

const HEURE = /^([01]\d|2[0-3]):[0-5]\d$/

export function MesRappels(): React.JSX.Element {
  const etat = useEtatEcran()
  useFocusTitre(etat !== null)
  const [nom, setNom] = useState('')
  const [mode, setMode] = useState<'recurrent' | 'heure'>('recurrent')
  const [frequence, setFrequence] = useState<Frequence>(60)
  const [heure, setHeure] = useState('15:00')
  const [repetition, setRepetition] = useState<Repetition>('jour')

  if (!etat) {
    return <main className="application" />
  }

  const { reglages, bandeau } = etat
  const nomPropre = nom.trim()

  function soumettre(evenement: FormEvent<HTMLFormElement>): void {
    evenement.preventDefault()
    if (!nomPropre) {
      return
    }
    window.lev.agir({
      type: 'ajouter',
      nom: nomPropre,
      mode,
      frequenceMin: frequence,
      heure,
      repetition
    })
    setNom('')
  }

  return (
    <main className="application">
      <Marque titre={textes.rappels.titre} niveau="page" />
      <section className="carte">
        {reglages.rappels.map((rappel) => (
          <LigneRappel key={rappel.id} rappel={rappel} />
        ))}
        <div className="ligne ligne-sequences">
          <div className="sequences-entete">
            <label className="ligne-nom">
              <input
                className="case"
                type="checkbox"
                checked={reglages.sequences.actif}
                onChange={(evenement) => {
                  window.lev.agir({ type: 'sequences', actif: evenement.target.checked })
                }}
              />
              <span>{textes.rappels.sequences}</span>
            </label>
            <div className="ligne-reglages">
              <select
                className="select"
                aria-label={textes.rappels.sequences}
                value={reglages.sequences.rythme}
                onChange={(evenement) => {
                  const rythme = evenement.target.value
                  if (estRythme(rythme)) {
                    window.lev.agir({ type: 'sequences', rythme })
                  }
                }}
              >
                {RYTHMES.map((rythme) => (
                  <option key={rythme} value={rythme}>
                    {textes.rappels.rythmes[rythme]}
                  </option>
                ))}
              </select>
            </div>
            <span className="ligne-corbeille" />
          </div>
          <p className="sequences-precision">{textes.rappels.sequencesPrecision}</p>
        </div>
        {reglages.sequences.rythme === 'autre' ? (
          <div className="champs-rythme">
            <label className="choix">
              {textes.rappels.travail}
              <input
                className="champ"
                type="number"
                min={10}
                max={120}
                value={reglages.sequences.travailMin}
                onChange={(evenement) => {
                  envoyerMinutes('travailMin', evenement.target.value, 10, 120)
                }}
              />
            </label>
            <label className="choix">
              {textes.rappels.pauseRythme}
              <input
                className="champ"
                type="number"
                min={1}
                max={30}
                value={reglages.sequences.pauseMin}
                onChange={(evenement) => {
                  envoyerMinutes('pauseMin', evenement.target.value, 1, 30)
                }}
              />
            </label>
          </div>
        ) : null}
        {bandeau?.genre === 'retrait' ? (
          <Bandeau texte={remplir(textes.rappels.retire, { nom: bandeau.nom })} />
        ) : null}
      </section>

      <div className="tiroirs">
        <details className="carte repli">
          <summary>
            <span>
              {textes.rappels.horaires}
              <span className="repli-resume">
                {` · ${reglages.horaires.debut} – ${reglages.horaires.fin}`}
              </span>
            </span>
            <Chevron />
          </summary>
          <div className="corps-repli">
            <div className="horaires-ligne">
              <label className="choix">
                {textes.rappels.de}
                <input
                  className="champ"
                  type="time"
                  value={reglages.horaires.debut}
                  onChange={(evenement) => {
                    if (HEURE.test(evenement.target.value)) {
                      window.lev.agir({
                        type: 'horaires',
                        debut: evenement.target.value,
                        fin: reglages.horaires.fin,
                        jours: reglages.horaires.jours
                      })
                    }
                  }}
                />
              </label>
              <label className="choix">
                {textes.rappels.a}
                <input
                  className="champ"
                  type="time"
                  value={reglages.horaires.fin}
                  onChange={(evenement) => {
                    if (HEURE.test(evenement.target.value)) {
                      window.lev.agir({
                        type: 'horaires',
                        debut: reglages.horaires.debut,
                        fin: evenement.target.value,
                        jours: reglages.horaires.jours
                      })
                    }
                  }}
                />
              </label>
              <select
                className="select"
                aria-label={textes.rappels.horaires}
                value={reglages.horaires.jours}
                onChange={(evenement) => {
                  const jours = evenement.target.value
                  if (estJours(jours)) {
                    window.lev.agir({
                      type: 'horaires',
                      debut: reglages.horaires.debut,
                      fin: reglages.horaires.fin,
                      jours
                    })
                  }
                }}
              >
                {JOURS.map((jours) => (
                  <option key={jours} value={jours}>
                    {textes.rappels.jours[jours]}
                  </option>
                ))}
              </select>
            </div>
            <p className="precision">{textes.rappels.horsHoraires}</p>
          </div>
        </details>

        <details className="carte repli">
          <summary>
            <span>{textes.rappels.ajout}</span>
            <Chevron />
          </summary>
          <form className="corps-repli" onSubmit={soumettre}>
            <label className="question">
              {textes.rappels.quoi}
              <input
                className="champ champ-nom"
                type="text"
                maxLength={40}
                value={nom}
                placeholder={textes.rappels.exemple}
                onChange={(evenement) => {
                  setNom(evenement.target.value)
                }}
              />
            </label>
            <div className="groupe-pastilles">
              {textes.rappels.suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="bouton bouton-secondaire pastille"
                  onClick={() => {
                    setNom(suggestion)
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <fieldset className="question">
              <legend>{textes.rappels.quand}</legend>
              <div className="segment">
                <button
                  type="button"
                  className={
                    mode === 'recurrent'
                      ? 'bouton bouton-principal pastille'
                      : 'bouton bouton-secondaire pastille'
                  }
                  aria-pressed={mode === 'recurrent'}
                  onClick={() => {
                    setMode('recurrent')
                  }}
                >
                  {textes.rappels.regulier}
                </button>
                <button
                  type="button"
                  className={
                    mode === 'heure'
                      ? 'bouton bouton-principal pastille'
                      : 'bouton bouton-secondaire pastille'
                  }
                  aria-pressed={mode === 'heure'}
                  onClick={() => {
                    setMode('heure')
                  }}
                >
                  {textes.rappels.heurePrecise}
                </button>
              </div>
              {mode === 'recurrent' ? (
                <div className="groupe-pastilles">
                  {PASTILLES.map((valeur) => (
                    <button
                      key={valeur}
                      type="button"
                      className={
                        frequence === valeur
                          ? 'bouton bouton-principal pastille'
                          : 'bouton bouton-secondaire pastille'
                      }
                      aria-pressed={frequence === valeur}
                      onClick={() => {
                        setFrequence(valeur)
                      }}
                    >
                      {textes.rappels.frequencePastille[valeur]}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="horaires-ligne">
                  <input
                    className="champ"
                    type="time"
                    aria-label={textes.rappels.heurePrecise}
                    value={heure}
                    onChange={(evenement) => {
                      if (HEURE.test(evenement.target.value)) {
                        setHeure(evenement.target.value)
                      }
                    }}
                  />
                  <div className="groupe-pastilles">
                    {REPETITIONS.map((valeur) => (
                      <button
                        key={valeur}
                        type="button"
                        className={
                          repetition === valeur
                            ? 'bouton bouton-principal pastille'
                            : 'bouton bouton-secondaire pastille'
                        }
                        aria-pressed={repetition === valeur}
                        onClick={() => {
                          setRepetition(valeur)
                        }}
                      >
                        {textes.rappels.repetitionListe[valeur]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </fieldset>
            <div className="ajout-bas">
              <p className="phrase" aria-live="polite">
                {phraseAjout(nomPropre, mode, frequence, heure, repetition)}
              </p>
              <button type="submit" className="bouton bouton-secondaire" disabled={!nomPropre}>
                {textes.rappels.ajouter}
              </button>
            </div>
          </form>
        </details>

        <details className="carte repli">
          <summary>
            <span>{textes.rappels.autres}</span>
            <Chevron />
          </summary>
          <div className="corps-repli">
            <fieldset className="question">
              <legend>{textes.rappels.theme}</legend>
              {THEMES.map((theme) => (
                <label key={theme} className="choix">
                  <input
                    className="case"
                    type="radio"
                    name="theme"
                    checked={reglages.theme === theme}
                    onChange={() => {
                      window.lev.agir({ type: 'theme', theme })
                    }}
                  />
                  <span>{textes.rappels.themes[theme]}</span>
                </label>
              ))}
            </fieldset>
            {OPTIONS.map((cle) => (
              <label key={cle} className="choix">
                <input
                  className="case"
                  type="checkbox"
                  checked={reglages.options[cle]}
                  onChange={(evenement) => {
                    const coche = evenement.target.checked
                    window.lev.agir({ type: 'option', cle, valeur: coche })
                    if (cle === 'son' && coche) {
                      jouerSonDoux()
                    }
                  }}
                />
                <span>{textes.rappels.options[cle]}</span>
              </label>
            ))}
            <button
              type="button"
              className="bouton bouton-discret"
              onClick={() => {
                window.lev.agir({ type: 'retablir' })
              }}
            >
              {textes.rappels.retablir}
            </button>
            {bandeau?.genre === 'restauration' ? <Bandeau texte={textes.rappels.retabli} /> : null}
          </div>
        </details>
      </div>

      <p className="lien-bas">
        <button
          type="button"
          className="bouton-texte"
          onClick={() => {
            window.lev.agir({ type: 'ouvrirEcran', ecran: 'apropos' })
          }}
        >
          {textes.rappels.apropos}
        </button>
      </p>
    </main>
  )
}

function LigneRappel({ rappel }: { rappel: Rappel }): React.JSX.Element {
  return (
    <div className="ligne">
      <label className="ligne-nom">
        <input
          className="case"
          type="checkbox"
          checked={rappel.actif}
          onChange={(evenement) => {
            window.lev.agir({ type: 'activer', id: rappel.id, actif: evenement.target.checked })
          }}
        />
        <span>{rappel.nom}</span>
      </label>
      <div className="ligne-reglages">
        {rappel.mode === 'heure' ? (
          <>
            <input
              className="champ"
              type="time"
              aria-label={rappel.nom}
              value={rappel.heure ?? ''}
              onChange={(evenement) => {
                if (HEURE.test(evenement.target.value)) {
                  window.lev.agir({ type: 'heure', id: rappel.id, heure: evenement.target.value })
                }
              }}
            />
            <select
              className="select"
              aria-label={rappel.nom}
              value={rappel.repetition ?? 'jour'}
              onChange={(evenement) => {
                const valeur = evenement.target.value
                if (estRepetition(valeur)) {
                  window.lev.agir({ type: 'repetition', id: rappel.id, repetition: valeur })
                }
              }}
            >
              {REPETITIONS.map((valeur) => (
                <option key={valeur} value={valeur}>
                  {textes.rappels.repetitionListe[valeur]}
                </option>
              ))}
            </select>
          </>
        ) : (
          <select
            className="select"
            aria-label={rappel.nom}
            value={rappel.frequenceMin ?? 60}
            onChange={(evenement) => {
              const valeur = Number(evenement.target.value)
              if (estFrequence(valeur)) {
                window.lev.agir({ type: 'frequence', id: rappel.id, frequenceMin: valeur })
              }
            }}
          >
            {FREQUENCES.map((valeur) => (
              <option key={valeur} value={valeur}>
                {textes.rappels.frequenceListe[valeur]}
              </option>
            ))}
          </select>
        )}
      </div>
      <span className="ligne-corbeille">
        {rappel.origine === 'perso' ? (
          <button
            type="button"
            className="bouton bouton-discret corbeille"
            aria-label={remplir(textes.rappels.retirer, { nom: rappel.nom })}
            onClick={() => {
              window.lev.agir({ type: 'retirer', id: rappel.id })
            }}
          >
            <Corbeille />
          </button>
        ) : null}
      </span>
    </div>
  )
}

function Bandeau({ texte }: { texte: string }): React.JSX.Element {
  return (
    <p className="bandeau" role="status">
      <span>{texte}</span>
      <button
        type="button"
        className="bouton-texte"
        onClick={() => {
          window.lev.agir({ type: 'annuler' })
        }}
      >
        {textes.rappels.annuler}
      </button>
    </p>
  )
}

function Chevron(): React.JSX.Element {
  return (
    <svg className="chevron" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 9l6 6 6-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Corbeille(): React.JSX.Element {
  return (
    <svg className="corbeille-icone" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 7h14M9 7V5h6v2M7 7l1 12h8l1-12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function phraseAjout(
  nom: string,
  mode: 'recurrent' | 'heure',
  frequence: Frequence,
  heure: string,
  repetition: Repetition
): string {
  if (!nom) {
    return textes.rappels.sansNom
  }
  if (mode === 'heure') {
    return remplir(textes.rappels.phraseHeure, {
      nom,
      heure: formaterHeure(heure),
      repetition: textes.rappels.repetitionPhrase[repetition]
    })
  }
  return remplir(textes.rappels.phraseRegulier, {
    nom,
    frequence: phraseFrequence(frequence)
  })
}

function phraseFrequence(frequence: Frequence): string {
  switch (frequence) {
    case 20:
      return textes.rappels.frequencePhrase['20']
    case 30:
      return textes.rappels.frequencePhrase['30']
    case 120:
      return textes.rappels.frequencePhrase['120']
    case 240:
      return textes.rappels.frequencePhrase['240']
    default:
      return textes.rappels.frequencePhrase['60']
  }
}

function envoyerMinutes(
  champ: 'travailMin' | 'pauseMin',
  valeur: string,
  min: number,
  max: number
): void {
  const nombre = Number(valeur)
  if (!Number.isInteger(nombre) || nombre < min || nombre > max) {
    return
  }
  const action: ActionEcran =
    champ === 'travailMin'
      ? { type: 'sequences', travailMin: nombre }
      : { type: 'sequences', pauseMin: nombre }
  window.lev.agir(action)
}

function estFrequence(valeur: number): valeur is Frequence {
  return FREQUENCES.some((frequence) => frequence === valeur)
}

function estRepetition(valeur: string): valeur is Repetition {
  return REPETITIONS.some((repetition) => repetition === valeur)
}

function estJours(valeur: string): valeur is Jours {
  return JOURS.some((jours) => jours === valeur)
}

function estRythme(valeur: string): valeur is RythmeSequence {
  return RYTHMES.some((rythme) => rythme === valeur)
}
