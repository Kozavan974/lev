# Hyperframes Composition Brief : Lèv

## Objectif
Vidéo de lancement courte et sobre pour Lèv, l'application de pauses actives d'Ekilib.re.

## Sortie
- Composition : `brag-output/composition/`
- Vidéo : `brag-output/brag.mp4`
- Format : landscape — 1920×1080, 30 i/s
- Durée : 33 s (intro de 10 s fournie par Laurent + 23 s ; dépassement de la fenêtre 15–25 s demandé par lui)

## Matière source
- Projet : `C:\Lev`
- Fichiers lus : `README.md`, `package.json`, `src/content/fr.json`, `src/content/idees.fr.json`, `src/renderer/shared/jetons.css`, `src/renderer/shared/Logo.tsx`, `src/renderer/shared/Pictogrammes.tsx`, `src/renderer/notification/Notification.tsx`, `AnneauPause.tsx`, `notification.css`, `src/renderer/shared/controles.css`, `src/renderer/app/application.css` (animation du logo), maquettes de `docs/maquettes/`
- Nom : Lèv
- Signatures : « Lèv — levez-vous, respirez. » (accroche) ; « Une pause, naturellement. » (fin)
- Moment d'interface recréé : la notification « Envie d'un petit mouvement ? », le bouton « Faire la pause (30 s) », l'anneau de pause guidée, le message « Chaque petite pause compte. », l'écran de respiration guidée, l'icône de la zone de notification et sa pastille « bientôt »
- Textes repris tels quels : titres et boutons de `fr.json`, idée « Tu peux marcher jusqu'au bout du couloir, puis revenir. » (`idees.fr.json`), mentions « Aucun compte / Aucune inscription / Aucune donnée personnelle » (`accueil.mentions`), « Logiciel libre pour Windows, proposé par Ekilib.re » (README), lien `github.com/Kozavan974/lev`

## Direction créative
- Preset : `polished`
- Direction : « film produit calme, comme un lever de soleil au bureau »
- Angle : la vidéo passe du thème sombre de Lèv au thème clair au moment où l'on accepte la pause.
- À éviter : langage SaaS générique, visuels abstraits, ton culpabilisant, chiffres de sédentarité

## Identité visuelle
- Fonds : `#1c1a2b` (sombre) → dégradé `#fdf1e7 / #f9e6e4 / #ece6f3` (clair)
- Texte : `#f3e9e2` / `#2e2a3f` ; secondaire `#b3aec4` / `#5f5a73`
- Action : `#5fcfc6` / `#0e6f6a` ; soleil `#f1be5a`
- Police : Atkinson Hyperlegible 400/700, fichiers du projet copiés dans `assets/fonts/`

## Storyboard
Voir `brag-plan.md`.
0. Intro de Laurent — 10 s — vidéo muette agrandie en 1920×1080
1. Accroche — 3,3 s — « Lèv — levez-vous, respirez. », pastille « bientôt »
2. Notification — 5,4 s — titre, idée, curseur, clic sur « Faire la pause (30 s) »
3. 30 secondes — 4,4 s — anneau en accéléré, lever de jour, « Chaque petite pause compte. »
4. Respiration — 4,4 s — bulle et quatre temps
5. Marque — 5,5 s (+0,4 s de fondu) — logo qui se redresse, devise, mentions, lien GitHub

## Audio
- Rôle : nappe chaleureuse, accents rares
- Musique : `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3` (Sascha Ende, ende.app, CC BY 4.0), volume 0,55, fondu d'entrée 0,4 s, fondu de sortie 1,6 s
- Repères : grille détectée avec `hyperframes beats` (110 BPM). Verrous : accroche 10,37 s, clic 18,55 s, « èv » 27,82 s, devise 28,38 s
- Réaction audio : RMS extrait avec `extract-audio-data.py` (media-use) ; module le halo du soleil (scène 3), le halo de la bulle (scène 4) et la lueur de la bulle du logo (scène 5)
- Bruitages : frappes (`keypress-*`), pastille (`bong_001`), carte (`card-slide-1`), clic (`mouseclick1`), anneau complet (`impactBell_heavy_000`, bas), logo (`impactSoft_medium_001`)
- Fichiers copiés dans `composition/assets/`

## Instructions Hyperframes
Conventions HyperFrames actuelles ; `hyperframes check` comme seul contrôle avant rendu ; rendu local.


## Modifications validées (21/11/2026, 2e passe)
- Ligne finale : « Gratuit et libre pour Windows, proposé par Ekilib.re ».
- Écran du lien GitHub tenu ≈2,6 s une fois complet, puis séquence de fin de Laurent (10 s, sans son) en fondu à 33 s. Durée totale : 43 s.
- Vignette : la première image de la vidéo (l'icône Lèv de l'intro), sans image d'affiche incrustée.
- Musique remplacée par « Emotional Piano » (jonasblakewood), fournie par Laurent : piano calme, volume 0,35 avant normalisation, fondu de sortie 2,5 s. Accroche recalée à 10,54 s et ligne finale à 30,2 s sur sa grille. Mixage final normalisé à −16 LUFS, crête −1,5 dBTP.
