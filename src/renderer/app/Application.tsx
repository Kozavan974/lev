import { Accueil } from './Accueil'
import { APropos } from './APropos'
import { GuidePoste } from './GuidePoste'
import { MesRappels } from './MesRappels'
import { Respiration } from './Respiration'
import { useEtatEcran } from '../shared/useEtatEcran'
import './application.css'

export function Application(): React.JSX.Element {
  const etat = useEtatEcran()
  if (!etat) {
    return <main className="application" />
  }
  if (etat.ecran === 'accueil') {
    return <Accueil />
  }
  if (etat.ecran === 'apropos') {
    return <APropos />
  }
  if (etat.ecran === 'poste') {
    return <GuidePoste />
  }
  if (etat.ecran === 'respiration') {
    return <Respiration />
  }
  return <MesRappels />
}
