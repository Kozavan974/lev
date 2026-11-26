# Brag Plan : Lèv

Exécution : `/brag --full` (flux complet avec HyperFrames, demandé explicitement).

Modifications validées par Laurent (21/11/2026) : ajout en ouverture de sa vidéo d'intro de 10 s (sans son), accroche remplacée par la signature « Lèv — levez-vous, respirez. », lien final vers le téléchargement GitHub. La durée passe donc à 33 s, au-delà de la fenêtre habituelle de 15–25 s, à sa demande.

## C'est quoi, cette appli ?
Lèv est une application Windows gratuite et libre (MIT) d'Ekilib.re, qui reste discrète dans la zone de notification et t'invite, sans jamais rien compter ni reprocher, à bouger, reposer tes yeux et respirer.

## L'angle
**La pause comme un lever de soleil.** La vidéo commence dans la palette sombre de Lèv (thème sombre : #1c1a2b → #3a2a3c), en plein travail. Au moment où l'utilisateur accepte la pause, le fond glisse vers le dégradé clair de l'appli (#fdf1e7 → #ece6f3), comme un lever de jour. Le ton reste celui de Lèv : un compagnon bienveillant, jamais un coach. Pas de chiffre culpabilisant, pas d'« alerte sédentarité ».

## Accroche (0–13,3 s)
D'abord la vidéo d'intro fournie par Laurent (0–10 s, sans son d'origine) : l'icône Lèv dont le « L » devient une silhouette qui se lève, des particules dorées, puis le mot « LEV ». Elle se termine sur un fond vert sombre, qui enchaîne naturellement avec le thème sombre de l'appli.
Puis (10–13,3 s) : un bureau en plein travail, des lignes de document qui se tapent, l'icône Lèv dans la barre des tâches, la pastille dorée « bientôt ». Par-dessus, en grand : **« Lèv — levez-vous, respirez. »**

## Moments clés
- La vraie notification « Envie d'un petit mouvement ? » qui glisse en bas à droite, avec une idée concrète et les boutons « Je le fais », « Dans 5 min », « Plus tard ».
- Le clic sur « Faire la pause (30 s) » et l'anneau de 30 secondes qui se remplit, puis « Chaque petite pause compte. »
- La respiration carrée : la bulle dorée qui grandit et se rétracte, les quatre temps « Inspire, Garde, Souffle, Pause » qui s'allument l'un après l'autre.

## Fin / chute
Le logo se redresse (l'animation réelle de l'appli : le « L » passe de penché à droit, la bulle monte). « Lèv ». « Une pause, naturellement. » Puis les trois promesses : « Aucun compte · Aucune inscription · Aucune donnée personnelle ». Dernière ligne : « Gratuit et libre, pour Windows · github.com/Kozavan974/lev ».

## Parcours utilisateur montré
Pastille « bientôt » sur l'icône → notification de pause → clic « Faire la pause (30 s) » → anneau de 30 s → message de fin. Puis respiration guidée comme deuxième usage.

## Ton
- Preset : `polished`
- Direction créative : « film produit calme, comme un lever de soleil au bureau »
- Interprétation : peu de texte, des tenues longues, des fondus doux (0,6–0,8 s), aucun effet agressif. La seule montée d'énergie arrive au clic, avec la musique.

## Format : landscape — 1920×1080, 30 i/s
## Durée : 33 s (intro 10 + 3,3 + 5,4 + 4,4 + 4,4 + 5,5)

## Identité visuelle (tirée du projet)
- Fond clair : dégradé `#fdf1e7 → #f9e6e4 → #ece6f3` (`--fond`)
- Fond sombre : dégradé `#1c1a2b → #2a2238 → #3a2a3c` (thème sombre)
- Action : `#0e6f6a` (clair) / `#5fcfc6` (sombre)
- Soleil (bulle, pastille) : `#f1be5a`, halo `rgba(233,196,106,0.35)`
- Texte : `#2e2a3f` (clair) / `#f3e9e2` (sombre) ; texte secondaire `#5f5a73`
- Accents : cœur `#c98480`, signature `#9a524e`
- Cartes : blanc translucide `rgba(255,255,255,0.62)`, rayon 12 px, ombre douce
- Police titres et texte : Atkinson Hyperlegible (gras 700 / normal 400), fournie dans `resources/fonts/`
- Élément visuel le plus fort : le logo « L qui se redresse » avec sa bulle dorée (`src/renderer/shared/Logo.tsx`, animation `accueil-logo-redresse` dans `application.css`)

## Texte de partage (brouillon)
Lèv t'invite à bouger, à reposer tes yeux et à respirer, sans rien compter ni rien reprocher. Gratuit, libre, sans compte. Une création de la Maison Sport Santé Ekilib.re : https://github.com/Kozavan974/lev/releases/latest
Musique : Sascha Ende, ende.app (CC BY 4.0).

## Direction audio
- Rôle : nappe chaleureuse et discrète
- Musique : `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3` (≈110 BPM). Le début est très calme et la piste s'ouvre vers 8,7 s, ce qui colle à l'angle (le clic sur la pause « allume » la vidéo).
- Traitement : la musique démarre à 0 s, sous la vidéo d'intro (dont le son d'origine est coupé). Son début très calme accompagne la silhouette qui se lève, et sa première montée (≈8,7 s) arrive avec les particules et le mot « LEV ». Fondu de sortie sur 32–33 s.
- Repères musicaux : le preset ne couvre que les 25 premières secondes ; les temps forts au-delà seront détectés sur la piste complète au montage. Repères déjà connus : 18,56 s (clic « Faire la pause »), 22,93 s (passage à la respiration).
- Réaction à la musique : subtile ; seul le halo doré de la bulle respire avec la musique. Pas de barres d'égaliseur.
- Bruitages : rares, calés sur les vrais mouvements : quelques frappes douces dans l'accroche, une note discrète à l'arrivée de la pastille puis de la notification, un clic au bouton, un léger carillon quand l'anneau est complet. Aucun bruitage pendant la respiration.
- Retenue : rien de sec ni de criard ; l'appli promet le calme, le son aussi.

## Storyboard

### Scène 0 — Intro de Laurent — 10 s (0,0–10,0)
La vidéo fournie (1280×720, 24 i/s) agrandie en 1920×1080, sans son. Aucun texte ajouté.
Séquentiel / interaction : non.
Intention audio : la musique s'installe doucement, puis s'ouvre avec les particules.
Transition : fondu court vers le fond sombre → Scène 1

### Scène 1 — « Lèv — levez-vous, respirez. » — 3,3 s (10,0–13,3)
Fond sombre de Lèv. Une fenêtre de document flou (lignes grisées, comme dans la maquette « Rappel bouger ») où du texte se tape. En bas, une barre des tâches sombre avec l'icône Lèv (L blanc sur carré turquoise, bulle dorée) et l'heure « 10h40 ». Vers 11,6 s, la pastille dorée « bientôt » apparaît sur l'icône. Titre central, grand : « Lèv — levez-vous, respirez. » (entrée à 10,5 s, tenu jusqu'à 13,1 s).
Séquentiel / interaction : oui, frappe simulée dans le document, puis pastille qui apparaît.
Intention audio : calme, concentré.
Idée couplée au son : frappes douces sous la saisie ; une note légère à la pastille.
Musique : intro très douce.
Transition : douce → Scène 2

### Scène 2 — La pause proposée — 5,4 s (13,3–18,7)
La vraie notification Lèv (thème sombre) glisse en bas à droite : pictogramme « bouger », titre « Envie d'un petit mouvement ? », sous-titre « Quelques pas suffisent, à ton rythme. », bloc idée « Tu peux marcher jusqu'au bout du couloir, puis revenir. » avec « Une autre idée » / « Je reste assis », puis les boutons « Je le fais », « Faire la pause (30 s) », « Dans 5 min », « Plus tard ». À lire : le titre (≈1,5 s) et l'idée (≈2,7 s). Vers 17,5 s, un curseur glisse vers « Faire la pause (30 s) » et clique vers 18,6 s.
Séquentiel / interaction : oui, carte qui monte, curseur, clic.
Intention audio : arrivée bienveillante, puis petite impulsion au clic.
Idée couplée au son : note douce à l'arrivée de la carte ; clic calé sur le temps fort 18,56 s.
Transition : douce, sur le clic → Scène 3

### Scène 3 — 30 secondes — 4,4 s (18,7–23,1)
La carte se resserre sur l'anneau de pause guidée (vrai composant `AnneauPause`) : « 30 s » qui décompte en accéléré pendant que l'anneau turquoise se remplit (≈2 s). Pendant ce temps, le fond passe du sombre au dégradé clair : le lever de soleil. À l'anneau complet, message de l'appli : « Chaque petite pause compte. » (entrée ≈21,6 s, tenu jusqu'à 23,0 s).
Séquentiel / interaction : oui, décompte et remplissage de l'anneau.
Intention audio : la musique s'ouvre, chaleur qui monte.
Idée couplée au son : léger carillon à l'anneau complet.
Transition : fondu lent → Scène 4

### Scène 4 — Un moment pour souffler — 4,4 s (23,1–27,5)
Écran de respiration guidée (thème clair, comme la maquette « Respiration guidée »). Titre « Un moment pour souffler », la bulle dorée et son halo qui grandissent puis se rétractent, les quatre étiquettes « Inspire », « Garde », « Souffle », « Pause » qui s'allument l'une après l'autre (≈0,9 s chacune, déjà visibles, donc lisibles). Les réglages ne sont pas montrés : on reste sur la bulle.
Séquentiel / interaction : oui, les quatre temps s'allument tour à tour.
Intention audio : apaisement ; la musique continue seule, sans bruitage.
Idée couplée au son : aucune (silence de bruitages volontaire).
Transition : fondu lent → Scène 5

### Scène 5 — Lèv — 5,5 s (27,5–33,0)
Fond clair. Le logo se redresse (animation réelle de l'accueil) sur un temps fort, puis le mot « Lèv ». ≈1 s après : « Une pause, naturellement. » (tenue jusqu'à la fin). ≈2,2 s après le début, les trois mentions apparaissent l'une après l'autre puis restent ensemble : « Aucun compte · Aucune inscription · Aucune donnée personnelle ». ≈3,8 s après le début, petite ligne finale : « Gratuit et libre, pour Windows · github.com/Kozavan974/lev ». Fondu de sortie sur les dernières 0,6 s.
Séquentiel / interaction : oui, logo qui se redresse, puis les trois mentions.
Intention audio : conclusion chaleureuse, puis fondu.
Idée couplée au son : le redressement du logo sur le temps fort ; pas d'autre bruitage.
Transition : fin

**Ambiance musicale :** chaleureuse, posée, qui s'éclaire au milieu.
**Résumé audio :** une nappe calme sous l'intro, qui s'ouvre avec les particules, reste discrète pendant le travail, qui s'ouvre au moment où l'on accepte la pause, se pose pendant la respiration et se referme doucement sur le logo.

## Données et confidentialité
Aucune donnée réelle n'apparaît : les textes viennent de `src/content/fr.json` et `idees.fr.json`, le document en arrière-plan est flou et fictif, l'heure (10h40) vient des maquettes.


## Modifications validées (21/11/2026, 2e passe)
- Ligne finale : « Gratuit et libre pour Windows, proposé par Ekilib.re ».
- Écran du lien GitHub tenu ≈2,6 s une fois complet, puis séquence de fin de Laurent (10 s, sans son) en fondu à 33 s. Durée totale : 43 s.
- Vignette : la première image de la vidéo (l'icône Lèv de l'intro), sans image d'affiche incrustée.
- Musique remplacée par « Emotional Piano » (jonasblakewood), fournie par Laurent : piano calme, volume 0,35 avant normalisation, fondu de sortie 2,5 s. Accroche recalée à 10,54 s et ligne finale à 30,2 s sur sa grille. Mixage final normalisé à −16 LUFS, crête −1,5 dBTP.
