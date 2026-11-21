# Lèv

Lèv t'invite à faire une pause, naturellement. C'est une application Windows qui reste dans la zone de notification. Elle propose de bouger, de quitter l'écran des yeux, de respirer, et de vérifier ton installation. Tu choisis le rythme. Rien n'est compté, rien n'est reproché.

Lèv est un logiciel libre sous [licence MIT](LICENSE), proposé par l'association [Ekilib.re](https://ekilib.re).

## Télécharger

L'installateur Windows est publié sur les [Releases GitHub](https://github.com/Kozavan974/lev/releases/latest).

## Ce que Lèv propose

- **Pauses actives.** Des invitations pour les yeux, pour bouger, pour boire, pour la posture. Chaque mouvement a une variante à faire assis.
- **Séquence de travail.** Un temps de concentration, une courte pause, puis une grande pause. L'icône indique le temps qui reste.
- **Respiration guidée.** Un rythme à suivre, le temps d'un cycle, puis l'écran se ferme.
- **Ergonomie du poste.** Cinq réglages simples pour l'écran, le siège et la posture.
- **Confidentialité hors ligne.** Aucun compte, aucune mesure d'audience. Les réglages restent sur ton ordinateur. Lèv ne lit ni tes frappes, ni les titres de fenêtres, ni l'écran. Le seul appel réseau spontané est la vérification des mises à jour, au plus une fois par semaine, que tu peux désactiver. Rien n'est téléchargé ni installé tout seul.

## Crédits

La police [Atkinson Hyperlegible](https://www.brailleinstitute.org/freefont/) est créée par le Braille Institute of America. Elle est distribuée sous licence SIL Open Font License 1.1. Le texte de cette licence est dans `resources/fonts/AtkinsonHyperlegible-LICENCE.txt`.

## Développer

Prérequis : Node.js et npm.

```bash
npm install
npm run dev
npm test
npm run dist
```

`npm run dev` lance Lèv en développement. `npm test` exécute la suite Vitest. `npm run dist` produit l'installateur Windows (`Lev-Setup-1.1.1.exe`).
