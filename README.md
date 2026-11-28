# Lèv

Lèv t'invite à faire une pause, naturellement. C'est une application Windows qui reste dans la zone de notification. Elle propose de bouger, de quitter l'écran des yeux, de respirer, et de vérifier ton installation. Tu choisis le rythme. Rien n'est compté, rien n'est reproché.

Lèv est un logiciel libre sous [licence MIT](LICENSE), proposé par l'association [Ekilib.re](https://ekilib.re).

## Télécharger

L'installateur Windows est publié sur les [Releases GitHub](https://github.com/Kozavan974/lev/releases/latest).

## Déploiement en entreprise (Intune / Silent install)

L'installateur est produit par `electron-builder`, cible NSIS one-click. Il s'installe pour l'utilisateur courant, sans droits administrateur.

Installation silencieuse. Le `/S` est en majuscule, et la commande reste bloquante jusqu'à la fin de l'installation :

```text
Lev-Setup-<version>.exe /S
```

L'application est alors dans `%LOCALAPPDATA%\Programs\lev\Lèv.exe`.

Désinstallation silencieuse :

```text
"%LOCALAPPDATA%\Programs\lev\Uninstall Lèv.exe" /S
```

Un double-clic sur le même fichier, sans `/S`, lance l'installation manuelle, au même endroit. La vérification des mises à jour ne télécharge rien et n'installe rien.

## Ce que Lèv propose

- **Pauses actives.** Des invitations pour les yeux, pour bouger, pour boire, pour la posture. Chaque mouvement a une variante à faire assis. Sur un rappel pour bouger, « Faire la pause (30 s) » guide le geste, puis la fenêtre se ferme.
- **Absence et réunion.** Si tu t'absentes au moins 5 minutes, les rappels se suspendent et repartent à ton retour, sans rattrapage. Tu peux décocher cette détection. « En réunion (1 h) » met les rappels en pause pour une heure, et indique l'heure de reprise.
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
npm run typecheck
npm run dist
```

`npm run dev` lance Lèv en développement. `npm test` exécute la suite Vitest. `npm run typecheck` vérifie les types. `npm run dist` produit l'installateur Windows (`Lev-Setup-1.2.2.exe`).

Le cahier des charges est dans [docs/CDC.md](docs/CDC.md). En cas d'écart avec une maquette (`docs/maquettes/`), ce document fait foi.

```text
src/main/       processus principal : boucle, moteur (scheduler/), réglages, fenêtres, zone de notification
src/preload/    pont sécurisé entre les fenêtres et le processus principal
src/renderer/   écrans React : notification, menu, application
src/content/    textes français (fr.json, idees.fr.json, guide.fr.json, astuces.fr.json)
src/partage/    types et calculs utilisés par le processus principal et les écrans
```

## Contribuer

Lis [docs/CDC.md](docs/CDC.md) avant de modifier un comportement. Les textes de l'interface sont dans `src/content/`, pas dans les composants. TypeScript strict, aucun `any`. Tout ce qui dépend de Windows reste dans `src/main/platform/`. Les fenêtres Application et Menu se créent à la demande et se détruisent à la fermeture. Le tutoiement reste une invitation, jamais un ordre ni un reproche. Avant de proposer une modification, lance `npm test` et `npm run typecheck`.
