import catalogue from '../content/astuces.fr.json'
import {
  ECRANS_NAVIGATION,
  type AstuceNotification,
  type EcranNavigation
} from '../preload/contrat'

export function identifiantsAstuces(): readonly string[] {
  return catalogue.astuces.map((astuce) => astuce.id)
}

export function lireAstuce(id: string): AstuceNotification | null {
  const trouvee = catalogue.astuces.find((astuce) => astuce.id === id)
  if (!trouvee || !estEcran(trouvee.ecran)) {
    return null
  }
  if (trouvee.lien !== null && trouvee.ecran === null) {
    return null
  }
  return { texte: trouvee.texte, lien: trouvee.lien, ecran: trouvee.ecran }
}

function estEcran(valeur: string | null): valeur is EcranNavigation | null {
  if (valeur === null) {
    return true
  }
  return ECRANS_NAVIGATION.some((ecran) => ecran === valeur)
}
