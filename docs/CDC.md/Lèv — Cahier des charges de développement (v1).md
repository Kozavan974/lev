# Lèv — Cahier des charges de développement (v1)

Nov 13, 2026 · @Laurent

## 1. Présentation

Lèv est une application de bureau gratuite qui invite, sans jamais l'imposer, à bouger et à reposer ses yeux pendant le travail sur écran. Elle est éditée par l'association Ekilib.re, Maison Sport-Santé au Tampon (La Réunion).

- **Signatures** : « Lèv — une pause, naturellement. » et « Lèv — levez-vous, respirez. »
- **Public** : grand public, toute personne qui travaille sur ordinateur.
- **Plateforme** : Windows 10 et 11 pour la v1. Le code doit rester portable vers macOS, puis Linux.
- **Promesse** : aucun compte, aucune inscription, aucune donnée personnelle demandée. Tout reste sur l'ordinateur.
- **Posture** : un compagnon bienveillant, jamais un coach exigeant.

### Périmètre de la v1

1. Rappels récurrents (cligner des yeux, marcher, point posture, rappels libres) et rappels à heure fixe.
2. Notifications non bloquantes en bas à droite, avec trois réponses : « Je le fais », « Dans 5 min », « Plus tard ».
3. Séquences de travail de type Pomodoro.
4. Choix du bon moment : attendre une accalmie, tenir compte des pauses spontanées, horaires de travail, mise en veille.
5. Icône dans la zone de notification avec trois états (calme, bientôt, pause proposée) et un menu.
6. Écrans annexes : premier lancement, « Mes rappels », « À propos », « Bien installer mon poste », respiration guidée.
7. Thème clair et thème sombre.

### Hors périmètre, par décision

- Statistiques, historiques, séries, badges, objectifs.
- Compte utilisateur, synchronisation, version « entreprise » avec suivi des salariés.
- Surveillance par webcam, blocage de l'écran pendant une pause, exercices en vidéo.
- Toute mention d'autres applications dans l'interface.

### Maquettes de référence

Les maquettes validées sont sur le canevas [Lèv — maquettes de l'application de bureau](https://claude.ai/artifact/LL227Csxua8PXbPcK7ptej). Cursor ne peut pas ouvrir ce lien : exporter chaque planche en image dans le dossier `docs/maquettes/` du projet avant de commencer. En cas d'écart entre une maquette et ce document, ce document fait foi.

## 2. Décisions structurantes

Ces décisions sont prises. Elles ne sont pas à rediscuter pendant le développement.

| Sujet | Décision |
| --- | --- |
| Nom | Lèv |
| Adresse à l'utilisateur | Tutoiement partout dans l'interface. Les deux signatures restent telles quelles |
| Voix | Lèv parle à la première personne dans l'accueil et les notifications (« Je te rappellerai… »), et à la troisième personne dans les réglages et « À propos » (« Lèv retient ton rythme ») |
| Réglage | Zéro réglage obligatoire. L'application fonctionne dès le premier lancement |
| Enregistrement | Pas de bouton « Enregistrer ». Tout changement s'applique immédiatement |
| Notifications | Non bloquantes, en bas à droite, sans prise de focus. Jamais de fenêtre centrée ni d'écran assombri |
| Boutons de réponse | « Je le fais » (principal), « Dans 5 min », « Plus tard ». Jamais « OK » ni « Ignorer » |
| Pastille « bientôt » | Affichée 2 minutes avant une pause |
| Réponse à « Dans 5 min » | « D'accord, je reviens dans 5 minutes. » |
| Compte à rebours | Aucun minuteur qui défile. On affiche une heure (« Reprise à 10h50 ») ou une ligne de parcours |
| Manques | L'interface ne commente jamais une pause passée ou manquée. Aucun compteur de ce qui n'a pas été fait |
| Mascotte | Aucune. Le seul personnage est le logo |
| À propos | Une seule section, qui regroupe l'application et Ekilib.re |
| Contact | Pas de numéro de téléphone. Renvoi vers ekilib.re |
| Repère « bouger » | 5 minutes de marche toutes les 30 minutes (Anses, octobre 2025) |
| Repère « yeux » | 20 minutes par défaut. C'est un choix de l'application, présenté comme tel |
| Respiration | Respiration carrée 4-4-4-4 par défaut, temps réglables |
| Idées de mouvement | Rédigées et validées par les enseignants en APA d'Ekilib.re, toujours avec une variante assise |
| Santé | Application de bien-être. Aucun bénéfice médical annoncé. Mention « ne remplace pas un avis médical » |

## 3. Pile technique et architecture

Lèv est une application Electron écrite en TypeScript, avec une interface en React. Ce choix privilégie la simplicité de développement dans Cursor et la portabilité vers macOS et Linux avec un seul code.

| Brique | Choix | Rôle |
| --- | --- | --- |
| Socle | Electron, dernière version stable | Fenêtres, zone de notification, démarrage automatique, détection d'inactivité |
| Langage | TypeScript en mode strict | Tout le code |
| Interface | React + Vite (gabarit `electron-vite`) | Tous les écrans |
| Styles | CSS natif avec variables (jetons de la section 9) | Pas de bibliothèque de composants |
| Stockage | `electron-store` (un fichier JSON local) | Réglages et rappels |
| Empaquetage | `electron-builder`, installateur NSIS par utilisateur | Installation sans droits administrateur |
| Mises à jour | `electron-updater` | Voir section 13 |
| Tests | Vitest pour le moteur. Les écrans sont vérifiés à la main | Voir section 14 |

Contrepartie assumée : une application Electron pèse environ 100 Mo et consomme plus de mémoire qu'une application native. Objectifs : moins de 150 Mo de mémoire au repos, processeur proche de 0 % entre deux rappels. Si ces objectifs ne sont pas tenus, l'alternative à étudier est Tauri, plus légère mais qui demande du Rust.

Une dépendance d'appel natif est à prévoir au lot 3 pour interroger Windows (section 5.9). Elle est proposée et validée à ce moment-là.

### Organisation du code

```text
.cursor/rules/         règles pour Cursor (section 17)
docs/
  CDC.md               ce cahier des charges
  maquettes/           images des maquettes
resources/
  fonts/               AtkinsonHyperlegible-Regular.woff2, -Bold.woff2, licence
  icons/               lev.ico, tray-calme.ico, tray-bientot.ico, tray-veille.ico
src/
  main/                processus principal (aucune interface)
    index.ts           démarrage, instance unique, cycle de vie
    scheduler/         moteur de rappels : logique pure, sans Electron, testable
      constantes.ts    toutes les durées du moteur
    tray.ts            icône, états, infobulle
    windows.ts         création et placement des fenêtres
    store.ts           lecture, écriture et migration des réglages
    platform/          tout ce qui dépend du système (win32.ts, puis darwin.ts, linux.ts)
    ipc.ts             canaux entre processus
  preload/             pont sécurisé (contextBridge), API typée
  renderer/
    notification/      la notification en bas à droite
    menu/              le menu de la zone de notification
    app/               Mes rappels, À propos, Guide du poste, Respiration, Bienvenue
    shared/            composants, jetons, pictogrammes, logo
  content/             textes et contenus (fr.json, idees.fr.json, guide.fr.json)
```

Les trois fenêtres chargent la même page, `src/renderer/index.html`, et se distinguent par l'adresse : `#/notification`, `#/menu`, `#/app`. Une seule entrée évite les erreurs de configuration de Vite entre le mode développement et l'installateur. Les dossiers `notification/`, `menu/` et `app/` rangent les composants, pas des pages séparées. Le fond de la page n'est transparent que pour `#/notification` et `#/menu`.

### Les fenêtres

| Fenêtre | Caractéristiques |
| --- | --- |
| Notification | Sans cadre, toujours au premier plan, absente de la barre des tâches, largeur 420 à 480 px. Affichée avec `showInactive()` : elle ne prend pas le focus à l'apparition. Placée à 24 px des bords de la zone de travail de l'écran principal |
| Menu | Sans cadre, 380 px de large, ouvert au clic sur l'icône, ancré près d'elle, fermé dès qu'il perd le focus |
| Application | Fenêtre classique redimensionnable (960 × 720 par défaut, minimum 480 × 600). Une seule instance, navigation interne entre les écrans |

Fermer la fenêtre « Application » ne quitte pas Lèv : seule l'entrée « Quitter » du menu arrête l'application.

### Mémoire : des fenêtres créées à la demande

Chaque fenêtre Electron lance son propre processus. Garder les trois fenêtres en mémoire ferait dépasser l'objectif de 150 Mo. Règles :

- Seul le processus principal tourne en permanence.
- **Application** : créée à la demande, détruite (`destroy()`) dès sa fermeture.
- **Menu** : créé au clic sur l'icône, détruit 60 secondes après sa fermeture.
- **Notification** : créée au premier rappel, puis conservée masquée pour réapparaître sans délai.
- La mémoire au repos est mesurée à la fin des lots 1 et 2. Si elle dépasse 150 Mo, la fenêtre de notification est elle aussi détruite après chaque usage.
- Une fenêtre unique partagée n'est pas retenue : le menu et une notification peuvent être visibles en même temps.

### Précisions propres à Windows

- **Options de la notification** : `frame: false`, `transparent: true`, `skipTaskbar: true`, `focusable: true`, affichage par `showInactive()`. Elle ne prend pas le focus à l'apparition, mais peut le recevoir par un clic ou par le raccourci clavier.
- **Ombre** : la fenêtre dépasse la carte de 30 px transparents de chaque côté, sinon l'ombre est coupée. La position de la fenêtre compense cette marge pour que la carte reste à 24 px des bords de la zone de travail.
- **Hauteur** : la hauteur de la carte varie selon le contenu. L'écran la mesure avec `ResizeObserver` et l'envoie au processus principal, qui redimensionne la fenêtre en gardant le bord bas fixe. La mesure est un nombre à virgule, alors que setBounds() n'accepte que des entiers : la hauteur est arrondie à l'entier supérieur (Math.ceil) pour ne jamais rogner la carte, et les positions à l'entier le plus proche (Math.round). Jamais de barre de défilement, jamais de vide.
- **Premier plan** : `setAlwaysOnTop(true, 'pop-up-menu')` comme point de départ. À vérifier au lot 1 : la notification reste au-dessus de la barre des tâches de Windows 11 et ne recouvre pas un jeu ou une vidéo en plein écran.
- **Position du menu** : calculée depuis `tray.getBounds()`. Si l'icône est rangée dans le tiroir des icônes masquées, ces coordonnées sont nulles ou hors écran : le menu se place alors en bas à droite de la zone de travail de l'écran principal.
- **Mise à l'échelle** : toutes les positions sont calculées en pixels logiques avec le module `screen`. À tester à 100, 125, 150, 175 et 200 %.

Trois limites des fenêtres transparentes, documentées par Electron, sont à connaître dès le lot 1 :

- **Ne jamais rendre la notification redimensionnable**, même brièvement : cela peut casser la transparence. La hauteur se change uniquement par `setBounds()`. Si, aux essais, Windows ignore ce changement ou fait scintiller la fenêtre, la solution de repli est une fenêtre de hauteur fixe (440 px), carte alignée en bas, avec `setIgnoreMouseEvents(true, { forward: true })` tant que la souris n'est pas sur la carte.
- **La zone transparente ne laisse pas passer les clics.** La marge de 30 px autour de la carte bloque donc une fine bande de l'écran tant que la notification est affichée. C'est accepté en v1.
- **La transparence disparaît quand les outils de développement sont ouverts** sur la fenêtre : ce n'est pas un défaut du code.

### Règles d'architecture

- Le moteur (`scheduler/`) ne dépend ni d'Electron ni de l'horloge réelle : l'heure et le temps d'inactivité lui sont injectés. C'est ce qui le rend testable.
- Les écrans ne lisent ni n'écrivent jamais le fichier de réglages : ils passent par l'API du `preload`.
- Tout appel propre à Windows passe par `platform/`. Aucun `process.platform` ailleurs dans le code.
- Aucun texte en dur dans les composants : tous les libellés viennent de `content/fr.json`.

## 4. Modèle de données

Toutes les données tiennent dans un seul fichier JSON local, géré par `electron-store` dans le dossier de données de l'utilisateur Windows. Rien n'est envoyé sur un serveur.

```ts
type Frequence = 10 | 20 | 30 | 45 | 60 | 120 | 240;        // minutes, liste unique pour toute l'application
type Repetition = 'jour' | 'semaine' | 'une';                // chaque jour, lundi-vendredi, une seule fois
type Jours = 'semaine' | 'samedi' | 'jour';                  // lun-ven, lun-sam, tous les jours

interface Rappel {
  id: string;                    // uuid
  nom: string;                   // 1 à 40 caractères, non modifiable après création en v1
  type: 'yeux' | 'bouger' | 'posture' | 'libre';
  origine: 'base' | 'perso';     // 'base' : fourni avec Lèv ; 'perso' : créé par l'utilisateur
  mode: 'recurrent' | 'heure';
  frequenceMin?: Frequence;      // si mode = 'recurrent'
  heure?: string;                // 'HH:mm', si mode = 'heure'
  repetition?: Repetition;       // si mode = 'heure'
  dernierDeclenchement?: string; // 'AAAA-MM-JJ', si mode = 'heure', voir 5.6
  actif: boolean;
  reportsDeSuite: number;        // « Plus tard » consécutifs, voir 5.7
  neRienProposerAvant?: string;  // date ISO, voir 5.7
}

interface Reglages {
  version: 1;
  premierLancementFait: boolean;
  rappels: Rappel[];
  horaires: { debut: string; fin: string; jours: Jours };       // '08:00', '18:00', 'semaine'
  sequences: {
    actif: boolean;               // true : le menu propose les séquences
    rythme: '25-5' | '50-10' | 'heure' | 'autre';
    travailMin: number;           // 25
    pauseMin: number;             // 5
    grandePauseMin: number;       // 15
    grandePauseApres: number;     // 4 séquences
  };
  options: {
    attendreAccalmie: boolean;        // true
    pausesSpontanees: boolean;        // true
    nePasDeranger: boolean;           // true
    proposerEspacer: boolean;         // true
    mouvementsAssis: boolean;         // false
    son: boolean;                     // false
    lancerAuDemarrage: boolean;       // true
  };
  theme: 'auto' | 'clair' | 'sombre';   // 'auto'
  respiration: { inspiration: number; pleine: number; expiration: number; vide: number; minutes: 1 | 3 | 5 };
  guidePoste: boolean[];                // 5 cases cochées ou non
  veilleJusqua?: string;                // date ISO, mise en veille depuis le menu
}
```

### Valeurs au premier lancement

| Rappel | Type | Réglage | Actif |
| --- | --- | --- | --- |
| Cligner des yeux | yeux | Toutes les 20 minutes | Oui |
| Marcher 5 minutes | bouger | Toutes les 30 minutes | Oui |
| Point posture | posture | Toutes les 2 heures | Oui |
| Boire un verre d'eau | libre | Toutes les heures | Non |

Respiration : 4, 4, 4, 4 secondes, 1 minute. Dans la maquette, le rappel « Pause déjeuner » et la case cochée de « Boire un verre d'eau » sont des exemples d'illustration.

### Règles

- Les quatre rappels du premier lancement ont `origine: 'base'`. Les rappels créés par l'utilisateur ont `origine: 'perso'` et `type: 'libre'`.
- Aucun rappel n'est renommable en v1 : le nom se choisit à la création.
- Les trois rappels de type `yeux`, `bouger` et `posture` ne peuvent pas être retirés, seulement décochés : ils portent un comportement que le formulaire d'ajout ne sait pas recréer. Tous les autres peuvent être retirés.
- « Rétablir les rappels d'origine » (section 7.4) remet les quatre rappels de base à leurs valeurs de départ, sans toucher aux rappels personnels.
- La liste `Frequence` est la même partout. Le formulaire d'ajout n'en propose que cinq en raccourci, mais la liste déroulante d'une ligne les propose toutes les sept.
- Le fichier porte un numéro de `version`. Toute évolution du format passe par une fonction de migration dans `store.ts`.
- Un fichier absent ou illisible est remplacé par les valeurs par défaut, sans message d'erreur technique.
- Seul `reportsDeSuite` garde une trace du comportement, et uniquement comme compteur remis à zéro. Aucun historique daté n'est conservé.

Ne sont pas enregistrés : une série de séquences en cours et les reports « Dans 5 min » en attente. Ils sont perdus quand Lèv se ferme.

## 5. Moteur de rappels

Le moteur décide quand proposer une pause. Il tourne dans le processus principal et réévalue la situation toutes les 15 secondes, et toutes les secondes tant qu'un rappel attend une accalmie (5.3). Toutes les durées ci-dessous sont des constantes regroupées dans un seul fichier, pour être ajustées facilement.

### 5.1 Quand le temps compte

Le compteur d'un rappel récurrent n'avance que si toutes ces conditions sont vraies :

- on est dans les horaires de travail (jours et heures) ;
- la session Windows est ouverte (ni verrouillée, ni en veille) ;
- Lèv n'est pas en veille depuis le menu ;
- aucune pause n'est en cours (les 5 minutes qui suivent un « Je le fais » sur « bouger », ou la pause d'une séquence).

À l'ouverture des horaires, au réveil de l'ordinateur, au déverrouillage de la session après 3 minutes ou plus, ou à la fin d'une mise en veille, tous les compteurs repartent de zéro. Après une pause, le rappel concerné repart de zéro et les autres reprennent là où ils en étaient. Lèv n'affiche jamais de rattrapage : au plus une notification à la fois, jamais une file de rappels en retard.

Horaires : si l'heure de fin est antérieure ou égale à l'heure de début (par exemple de 20:00 à 02:00), la plage passe minuit et se termine le lendemain. Le jour pris en compte pour la règle des jours travaillés est celui du début de la plage.

### 5.2 Pauses spontanées

Si l'option est active et que l'ordinateur ne reçoit ni frappe ni mouvement de souris pendant 3 minutes d'affilée, Lèv considère que l'utilisateur a fait une pause. Au retour, tous les rappels récurrents repartent de zéro. Le menu l'indique : « Tu t'es levé à 10h10 : j'ai décalé la marche. » Cette ligne n'apparaît que si le rappel « bouger » est actif, et disparaît à la prochaine notification « bouger » ou au bout de 30 minutes.

Cette détection utilise uniquement la durée écoulée depuis la dernière action (`powerMonitor.getSystemIdleTime()`). Lèv ne lit jamais ce qui est tapé.

Une séquence de travail en cours n'est pas affectée par une pause spontanée : son heure de fin ne change pas. Seuls les rappels récurrents repartent de zéro.

### 5.3 Attendre une accalmie

Quand un rappel arrive à échéance et que l'option est active, Lèv attend 4 secondes sans frappe ni souris avant d'afficher la notification. Si l'accalmie ne vient pas dans les 2 minutes, la notification s'affiche quand même.

Pendant cette attente, et seulement pendant elle, le moteur vérifie l'inactivité chaque seconde au lieu de toutes les 15 secondes. Sans cela, une accalmie de quelques secondes passerait inaperçue entre deux vérifications.

### 5.4 États et priorités

- **Bientôt** : la pastille apparaît 2 minutes avant l'échéance. Elle ne concerne pas les rappels dont la fréquence est inférieure à 30 minutes, pour ne pas clignoter en permanence.
- **Une seule notification à la fois.** Si plusieurs rappels tombent dans la même fenêtre de 2 minutes, seul le plus prioritaire s'affiche. Ordre : fin de séquence, puis rappel à heure fixe, puis les rappels récurrents du moins fréquent au plus fréquent. À fréquence égale : posture, bouger, rappel libre, yeux. Sans cela, un rappel peu fréquent serait toujours écarté : « posture » (2 heures) tombe en même temps que « bouger » (30 minutes) à chaque fois, et ne s'afficherait jamais.
- Un rappel écarté par cette règle repart de zéro, sauf un rappel à heure fixe, qui s'affiche 2 minutes après la fermeture de la notification précédente.

Tant qu'un rappel attend une accalmie ou la sortie du plein écran, l'icône reste dans l'état « bientôt ».

### 5.5 Les trois réponses

| Réponse | Effet | Message affiché 3 secondes |
| --- | --- | --- |
| Je le fais | Le rappel repart de zéro. Pour « bouger », tous les rappels sont suspendus 5 minutes | « Chaque petite pause compte. » |
| Dans 5 min | La même notification revient dans 5 minutes. Sans limite de nombre | « D'accord, je reviens dans 5 minutes. » |
| Plus tard | Le rappel repart de zéro | « Pas de souci, on reprendra plus tard. » |
| Aucune réponse | La notification s'efface seule (20 secondes pour les yeux, 60 secondes pour les autres). Le rappel repart de zéro, sans message. Le délai est suspendu tant que la souris survole la notification ou qu'elle a le focus | Aucun |

Deux notifications ne suivent pas cette dernière règle : la question de rythme (5.7), où l'absence de réponse ne change rien, et la fin de pause d'une séquence (5.8), qui reste affichée.

### 5.6 Rappels à heure fixe

- Ils se déclenchent à l'heure choisie, y compris en dehors des horaires de travail : l'utilisateur a fixé cette heure lui-même.
- Ils respectent leur répétition (chaque jour, du lundi au vendredi, une seule fois). Un rappel « une seule fois » se désactive après s'être affiché.
- Si l'ordinateur était éteint ou en veille à l'heure prévue, le rappel est abandonné pour ce jour-là.

Anti-doublon : un rappel à heure fixe se déclenche au premier passage du moteur à l'heure prévue ou dans les 10 minutes qui suivent. Le moteur inscrit alors la date du jour dans `dernierDeclenchement` et ne le redéclenche plus ce jour-là, quelle que soit la réponse. « Dans 5 min » reste possible : c'est un report de la notification, pas un nouveau déclenchement. Au-delà de 10 minutes de retard, le rappel est abandonné pour la journée.

Trois précisions. Modifier l'heure ou la répétition d'un rappel efface sa date de dernier déclenchement. La mise en veille manuelle et le plein écran retiennent aussi les rappels à heure fixe : au-delà de 10 minutes, ils sont abandonnés comme les autres. L'heure est toujours l'heure locale de l'ordinateur.

### 5.7 Le rappel qui s'adapte

Si l'option est active et qu'un rappel récurrent reçoit trois reports de suite, sa prochaine notification est remplacée par la question « Ce rythme te convient ? ». Elle propose la fréquence supérieure dans la liste 10, 20, 30, 45, 60, 120, 240 minutes.

- « Oui, toutes les 45 min » applique la nouvelle fréquence.
- « Garder ce rythme » ne change rien, et la question n'est plus posée pour ce rappel pendant 7 jours.
- Le message ne mentionne jamais le nombre de pauses passées. Le compteur revient à zéro dès un « Je le fais ».

Ce qui compte comme un report : un « Plus tard », ou une absence de réponse, sauf pour le rappel « yeux ». Celui-ci se suit normalement sans cliquer : son absence de réponse ne compte pas. « Dans 5 min » ne compte jamais.

Le compteur revient aussi à zéro quand la fréquence du rappel change. Un rappel déjà réglé sur 4 heures ne reçoit jamais la question. Sans réponse à la question, rien ne change et le compteur repart de zéro.

### 5.8 Séquences de travail

Une séquence se lance à la main depuis le menu. Rythme par défaut : 25 minutes de travail, 5 minutes de pause, une grande pause de 15 minutes après 4 séquences. Les autres rythmes : « 50-10 » (50 et 10 minutes), « une pause par heure » (55 et 5 minutes), « autre » (travail de 10 à 120 minutes, pause de 1 à 30 minutes). La grande pause s'applique à tous.

1. Le menu ne propose les séquences que si la case « Séquences de travail » est cochée dans « Mes rappels ». Elle l'est par défaut.
2. Pendant le travail, le rappel « bouger » est suspendu : c'est la pause de fin de séquence qui invite à marcher. Les autres rappels continuent. Règle provisoire (section 16) : si la séquence dure plus de 30 minutes, une notification « bouger » est proposée une fois, au milieu.
3. À la fin de la séquence, la notification « fin de séquence » s'affiche avec les trois réponses habituelles. « Je le fais » lance la pause, « Dans 5 min » prolonge le travail de 5 minutes, « Plus tard » enchaîne la séquence suivante sans pause.
4. Son titre suit le rang de la séquence : « Première séquence bouclée », « Deuxième… », jusqu'à « Dixième… », puis « Séquence 11 bouclée ». La durée et l'heure de reprise de sa phrase sont calculées.
5. Après la dernière séquence de la série (la quatrième par défaut), la phrase devient « Place à une grande pause : 15 minutes, puis on reprend à 11h30. » Après la grande pause, le compte des séquences repart à 1.
6. À la fin de la pause, une notification discrète « On reprend quand tu veux. » propose « C'est reparti » et « Encore 5 min ». Elle reste affichée jusqu'à la réponse. Sans réponse au bout de 15 minutes, les séquences s'arrêtent d'elles-mêmes. Cet écran n'est pas maquetté : reprendre le gabarit des autres notifications.
7. « Arrêter les séquences pour aujourd'hui », ou la fermeture de Lèv, revient au fonctionnement normal.

### 5.9 Ne pas déranger et mise en veille

- **Mise en veille manuelle**, depuis le menu : 30 minutes, 1 heure, ou jusqu'à demain (début des horaires du prochain jour travaillé). Elle sert aussi de mode réunion : c'est la seule réponse fiable pour une visioconférence en fenêtre.
- **Plein écran et présentation**, si l'option est active : Electron n'a aucune fonction pour savoir ce que font les autres applications. `platform/win32.ts` appelle la fonction Windows `SHQueryUserNotificationState` (`shell32.dll`) au moyen d'une bibliothèque d'appel natif sans compilation, par exemple Koffi. Les états « application en plein écran » (`QUNS_BUSY`, `QUNS_RUNNING_D3D_FULL_SCREEN`) et « mode présentation » (`QUNS_PRESENTATION_MODE`) retiennent la notification, qui s'affiche à la sortie de cet état.
- Cet appel n'est fait qu'au moment où un rappel arrive à échéance, puis toutes les 15 secondes tant qu'il est retenu. Jamais de commande PowerShell en tâche de fond.
- **Mode « Ne pas déranger » de Windows** : il n'est pas signalé par cette fonction, et n'est lisible que par une interface non documentée de Windows, qui peut cesser de fonctionner à toute mise à jour. Il n'est pas pris en compte en v1. L'étude technique du lot 3 dit si une solution fiable existe.
- En conséquence, l'option s'intitule « Ne pas me déranger en plein écran ou pendant une présentation ».

## 6. Icône de la zone de notification

Lèv vit dans la zone de notification de Windows, près de l'horloge, et reste silencieuse. L'icône a trois états de fonctionnement, plus un état de veille.

| État | Quand | Ce que l'on voit |
| --- | --- | --- |
| Calme | Par défaut | L'icône seule, immobile, sans chiffre ni couleur vive |
| Bientôt | 2 minutes avant une pause (voir 5.4) | Une petite pastille jaune en haut à droite de l'icône. Elle remplace la bulle du logo, pour ne pas montrer deux points jaunes |
| Pause proposée | Tant qu'une notification est affichée | La pastille reste (même icône que « bientôt »), et la notification est visible en bas à droite |

- **En veille** : l'icône passe en gris (#7b7f8c), L et bulle en blanc.
- **Infobulle** au survol : « Lèv · prochaine pause à 10h40 », ou « Lèv · en veille jusqu'à 11h00 ».
- **Clic gauche** : ouvre le menu (section 7.2). **Clic droit** : menu système minimal avec « Mes rappels » et « Quitter ».
- Les icônes sont des fichiers `.ico` contenant les tailles 16, 20, 24, 32 et 48 px. Les quatre fichiers sont déjà fournis : tray-calme.ico, tray-bientot.ico, tray-veille.ico, et lev.ico pour l'application (jusqu'à 256 px). À 16 et 24 px, on utilise le dessin simplifié du logo (section 9).
- Aucun clignotement, aucune animation de l'icône dans la barre des tâches.

## 7. Écrans

L'application compte sept écrans ou familles d'écrans. Chacun correspond à une planche du canevas de maquettes, nommée entre parenthèses.

### 7.1 Premier lancement (planche « Premier lancement »)

Affiché une seule fois, dans la fenêtre « Application ».

- Logo, puis le texte exact, sur trois lignes : « Bienvenue dans Lèv. » / « Je te rappellerai doucement de bouger et de reposer tes yeux. » / « Tu choisis le rythme — et tu peux changer d'avis à tout moment. »
- Bouton principal « Commencer » : ferme la fenêtre, Lèv démarre avec les rappels par défaut.
- Lien « Choisir mon rythme » : ouvre « Mes rappels ».
- Trois mentions cochées : « Aucun compte », « Aucune inscription », « Aucune donnée personnelle demandée ».
- Aucun tutoriel, aucune étape suivante.

### 7.2 Menu (planches « Menu » et « Menu, thème sombre »)

De haut en bas :

1. En-tête : logo, « Lèv », « Une pause, naturellement. »
2. Carte « Tes prochaines pauses » : les deux prochaines échéances, sous la forme « Cligner des yeux à 10h20 ». Le cas échéant, la ligne « Tu t'es levé à 10h10 : j'ai décalé la marche. »
3. Bouton principal « Démarrer une séquence de travail », affiché seulement si la case « Séquences de travail » est cochée dans « Mes rappels ». Sinon, « Faire une pause maintenant » devient le bouton principal. Pendant une séquence, il devient « Arrêter les séquences » et la carte affiche « Séquence 2 sur 4, jusqu'à 10h45 ».
4. Bouton secondaire « Faire une pause maintenant » : affiche tout de suite la notification « bouger ».
5. « Mettre les rappels en veille » : « Pendant 30 minutes », « Pendant 1 heure », « Jusqu'à demain ». En veille, ce bloc est remplacé par « En veille jusqu'à 11h00 » et un bouton « Reprendre ».
6. Liens : « Respirer un moment », « Bien installer mon poste », « Mes rappels », « À propos », « Quitter ».

### 7.3 Notifications

Toutes partagent le même gabarit : une carte en bas à droite, un pictogramme dans une pastille, un titre, une phrase, puis les boutons. Planches : « Rappel cligner des yeux », « Rappel bouger » (clair et sombre), « Point posture », « Fin d'une séquence de travail », « Rappel qui s'adapte ».

| Notification | Titre | Phrase | Boutons |
| --- | --- | --- | --- |
| Yeux | Tes yeux méritent une pause. | Cligne doucement une dizaine de fois, puis regarde au loin, par la fenêtre si tu peux. | Les trois réponses |
| Bouger | Envie d'un petit mouvement ? | Quelques pas suffisent, à ton rythme. | Les trois réponses |
| Bouger, variante assise | Un moment pour te détendre ? | Quelques gestes discrets, à ta place. | Les trois réponses |
| Posture | Un petit point posture ? | Relâche les épaules, pose les pieds à plat et laisse ton dos retrouver le dossier. | Les trois réponses + lien « Bien installer mon poste » |
| Rappel libre ou à heure fixe | Le nom du rappel | C'est le moment. | Les trois réponses |
| Fin de séquence | Deuxième séquence bouclée | Un moment pour te détendre ? 5 minutes, puis on reprend à 10h50. | Les trois réponses + « Arrêter les séquences pour aujourd'hui » |
| Fin de pause | On reprend quand tu veux. | (aucune) | « C'est reparti », « Encore 5 min » |
| Rythme | Ce rythme te convient ? | Je peux te proposer « Marcher 5 minutes » toutes les 45 minutes, plutôt que toutes les 30. | « Oui, toutes les 45 min », « Garder ce rythme » |

Particularités :

- **Bouger** contient un encadré « Une idée de l'équipe d'Ekilib.re » avec une idée tirée au hasard, un bouton « Une autre idée » et un bouton « Je reste assis » (qui devient « Finalement, je me lève »). Si l'option « mouvements assis » est cochée, la variante assise s'affiche d'emblée. Une même idée ne revient pas deux fois de suite.
- **Fin de séquence** affiche la ligne de parcours : un tracé courbe avec un point par séquence, les séquences faites en turquoise, la grande pause en jaune.
- Après une réponse, la carte affiche le message de la section 5.5 pendant 3 secondes, puis disparaît en fondu.
- La notification n'a pas de bouton de fermeture : « Plus tard » en tient lieu. La touche Échap vaut « Plus tard » quand la notification a le focus.

### 7.4 Mes rappels (planche « Mes rappels »)

L'écran de réglage unique. Sous-titre : « Tout est déjà réglé. Coche, ajuste ou ajoute un rappel : c'est pris en compte tout de suite. »

**La liste.** Une ligne par rappel :

- une case pour l'activer, suivie du nom ;
- pour un rappel récurrent, une liste déroulante de fréquence (10, 20, 30, 45 minutes, 1 heure, 2 heures, 4 heures) ;
- pour un rappel à heure fixe, un champ d'heure et une liste (« Chaque jour », « Du lundi au vendredi », « Une seule fois ») ;
- une corbeille, absente sur les rappels « yeux », « bouger » et « posture », qui retire le rappel immédiatement. Un bandeau « « Nom » est retiré. » avec « Annuler » reste affiché jusqu'à l'action suivante. Aucune fenêtre de confirmation.

La dernière ligne, « Séquences de travail », cochée par défaut et sans corbeille, a sa propre liste : « 25 minutes, puis 5 de pause », « 50 minutes, puis 10 de pause », « Une pause de 5 minutes par heure », « Autre rythme ». « Autre rythme » révèle deux champs en minutes (travail, pause).

**Mes horaires.** « De \[08:00\] à \[18:00\] \[du lundi au vendredi\] » (autres choix : « du lundi au samedi », « tous les jours »), puis « En dehors de ces horaires, seuls tes rappels à heure fixe s'affichent. »

**Ajouter un rappel**, en deux questions :

1. « Quoi ? » : un champ texte de 40 caractères au plus (exemple affiché : « Par exemple : m'étirer ») et quatre suggestions qui remplissent le champ : « M'étirer », « Respirer profondément », « Me redresser », « Travailler debout ».
2. « Quand ? » : deux boutons exclusifs, « Régulièrement » (sélectionné par défaut) et « À une heure précise ».
   - Régulièrement : cinq pastilles, « 20 min », « 30 min », « 1 heure » (par défaut), « 2 heures », « 4 heures ».
   - À une heure précise : un champ d'heure (15:00 par défaut) et trois pastilles, « Chaque jour » (par défaut), « Du lundi au vendredi », « Une seule fois ».

Une phrase se met à jour en direct : « Lèv te rappellera « M'étirer » toutes les heures. » ou « … à 15h00, chaque jour. » Sans nom saisi, elle indique « Donne un nom à ton rappel pour l'ajouter. » et le bouton « Ajouter le rappel » est inactif. La touche Entrée dans le champ ajoute le rappel. Après l'ajout, le rappel apparaît en fin de liste et le champ se vide.

**Autres réglages**, bloc replié par défaut, intitulé « Autres réglages : bon moment, mouvements, thème, son » :

- Thème : « Automatique, comme mon ordinateur », « Clair », « Sombre ».
- Sept cases, dans cet ordre : « Attendre que j'aie fini de taper pour afficher un rappel », « Tenir compte des pauses que je prends de moi-même », « Ne pas me déranger en plein écran ou pendant une présentation », « Me proposer d'espacer un rappel quand son rythme ne me convient pas », « Préférer des mouvements discrets, à faire assis », « Jouer un son doux avec chaque rappel », « Lancer Lèv au démarrage de l'ordinateur ».

Sous ces cases, un bouton discret « Rétablir les rappels d'origine » remet les quatre rappels de base à leurs valeurs de départ. Il agit tout de suite et affiche un bandeau « Rappels d'origine rétablis. » avec « Annuler ». Ce bouton n'est pas maquetté.

En bas de page, un lien « À propos ».

### 7.5 À propos (planche « À propos »)

Une page de lecture, en cinq blocs. Les textes exacts sont en section 10.5.

1. En-tête : « Lèv — une pause, naturellement. » et une phrase de présentation.
2. « Notre philosophie » : sept principes courts.
3. « Les repères que suit l'application » : se lever toutes les 30 minutes, marcher 5 minutes, quitter l'écran des yeux. Lien vers « Bien installer mon poste ».
4. « Textes de référence » : sept liens (section 10.3), ouverts dans le navigateur par défaut.
5. « Ekilib.re » : présentation de l'association, « Envie d'aller plus loin ? », lien vers ekilib.re, numéro de version et licence.

La page se termine par « Lèv — levez-vous, respirez. »

### 7.6 Bien installer mon poste (planche du même nom)

Cinq cartes à cocher, numérotées « Étape 1 sur 5 » à « Étape 5 sur 5 », dont l'état est mémorisé. Les textes sont en section 10.2. Suivent un encadré « Et surtout, change souvent de position », les boutons « C'est tout bon » et « Je finirai plus tard » (les deux ferment l'écran), puis la mention de source.

### 7.7 Respiration guidée (planche du même nom)

- À gauche : le titre « Un moment pour souffler », la bulle jaune, la consigne du temps en cours, quatre étiquettes (« Inspire », « Garde », « Souffle », « Pause ») dont une est mise en avant, et le bouton « Commencer », qui devient « J'ai terminé ».
- La bulle grandit pendant l'inspiration, reste pleine pendant la pause, rétrécit pendant l'expiration, reste petite pendant la seconde pause. Le changement de taille dure exactement le temps réglé.
- Consignes : « Inspire par le nez », « Garde l'air, sans forcer », « Souffle doucement », « Reste tranquille ». Au repos : « Prêt quand tu veux ». À la fin : « Chaque petite pause compte. »
- À droite, « Mon rythme » : trois rythmes tout prêts, « Carrée » (4-4-4-4), « Apaisante » (4-0-6-0), « Régulière » (5-0-5-0), puis quatre réglages avec boutons − et + : « Inspiration » et « Expiration » de 2 à 10 secondes, « Pause, poumons pleins » et « Pause, poumons vides » de 0 à 10 secondes. Une pause à 0 disparaît du cycle et affiche « Aucune ».
- « Durée » : 1, 3 ou 5 minutes. La séance se termine à la fin du cycle en cours.
- Les réglages sont mémorisés. Une modification pendant la séance s'applique au temps suivant.
- Mention en bas : « Lèv retient ton rythme pour la prochaine fois. Si tu te sens gêné, reprends simplement ta respiration habituelle. »

## 8. Textes et ton

Lèv parle comme un compagnon bienveillant, jamais comme un coach exigeant. Cette règle vaut pour chaque libellé, y compris les messages d'erreur.

### Règles d'écriture

1. Tutoiement partout, sauf dans la signature « Lèv — levez-vous, respirez. », gardée telle quelle. Phrases courtes, mots simples.
2. Une invitation ou une question, jamais un ordre ni une alerte.
3. Aucun libellé ne constate un manque, un retard ou un échec. Aucun chiffre sur ce qui n'a pas été fait.
4. Le bouton principal d'une proposition de pause est toujours « Je le fais ». Les mots « OK », « Ignorer », « Fermer », « Annuler la pause » sont interdits sur une notification.
5. Les heures s'écrivent « 10h40 ». Les durées s'écrivent en chiffres (« 5 minutes »), et en abrégé sur les boutons (« Dans 5 min »).
6. Un message d'erreur dit ce qui s'est passé et quoi faire, sans code ni terme technique.
7. Aucun titre en majuscules, aucun point d'exclamation, aucun émoji.

### Exemples de référence

| À éviter | À privilégier |
| --- | --- |
| « Vous devez bouger ! » | « Envie d'un petit mouvement ? » |
| « Alerte sédentarité » | « Un moment pour te détendre ? » |
| « Vos yeux sont fatigués » | « Tes yeux méritent une pause. » |
| « Échec : pause manquée » | « Pas de souci, on reprendra plus tard. » |
| « Atteignez votre objectif » | « Chaque petite pause compte. » |

### Organisation des textes

- Tous les libellés sont dans `content/fr.json`, avec des clés parlantes (`notification.yeux.titre`).
- Les textes exacts sont ceux des sections 5.5, 5.8, 7 et 10. Les maquettes ne font référence que pour la mise en page.
- La structure doit permettre d'ajouter une langue plus tard sans toucher au code. Seul le français est livré en v1.
- Tout nouveau texte écrit pendant le développement respecte ces règles et est signalé pour relecture.

## 9. Design

L'ambiance visée est celle d'un lever de soleil : fluide, respirante, douce. Les valeurs ci-dessous sont celles des maquettes validées. Elles sont à déclarer une seule fois, en variables CSS, et à ne jamais réécrire en dur dans un composant.

### Couleurs

| Jeton | Thème clair | Thème sombre | Usage |
| --- | --- | --- | --- |
| `--fond` | Dégradé vertical `#fdf1e7` → `#f9e6e4` (55 %) → `#ece6f3` | Dégradé vertical `#1c1a2b` → `#2a2238` (60 %) → `#3a2a3c` | Fond des fenêtres et des notifications |
| `--carte` | `rgba(255,255,255,0.62)` | `rgba(255,255,255,0.06)` | Cartes, champs, boutons secondaires |
| `--lisere` | `rgba(255,255,255,0.7)` | `rgba(255,255,255,0.08)` | Bordure des cartes |
| `--separateur` | `rgba(46,42,63,0.08)` | `rgba(255,255,255,0.08)` | Traits entre les lignes |
| `--texte` | `#2e2a3f` | `#f3e9e2` | Texte principal |
| `--texte-second` | `#5f5a73` | `#b3aec4` | Précisions, légendes, bordure des champs |
| `--action` | `#0e6f6a` | `#5fcfc6` | Boutons, liens, cases cochées |
| `--action-survol` | `#0a5551` | `#84ded6` | Survol et appui |
| `--sur-action` | `#ffffff` | `#1c1a2b` | Texte posé sur `--action` |
| `--fond-picto` | `#fde3d2` | `#3a2f3f` | Fond des pictogrammes |
| `--soleil` | `#f1be5a` | `#f1be5a` | Bulle du logo, pastille « bientôt », grande pause. Jamais de texte dans cette couleur |
| `--trace` | `#f0d9cc` | `#3a3650` | Partie non parcourue d'une ligne de parcours |

Le turquoise `--action` et le jaune `--soleil` viennent du logotype Ekilib.re. Le thème « automatique » suit le réglage clair ou sombre de Windows et change sans redémarrage.

### Typographie

- Une seule police : Atkinson Hyperlegible, graisses 400 et 700. Elle est embarquée dans l'application (licence libre OFL), jamais chargée depuis Internet.
- Échelle : 38 px (titre d'accueil), 26 px (titre d'écran), 25 px (titre de carte ou de notification), 21 px (texte d'accueil), 19 px (information importante), 17 px (texte courant), 14 px (légende).
- Le texte courant ne descend jamais sous 17 px. Le 14 px est réservé aux légendes et aux mentions.

### Formes et espaces

- Cartes : rayon de 16 px. Boutons, champs et pastilles : rayon complet (forme de pilule).
- Tout élément cliquable mesure au moins 48 px de haut.
- Espacements : 6, 10, 16, 20, 24 px. Marge interne d'une carte : 20 px.
- Ombre uniquement sous les notifications et le menu : `0 6px 24px rgba(46,42,63,0.10)`.
- Trois niveaux de bouton : principal (fond `--action`), secondaire (bordure `--action`, fond `--carte`), discret (texte `--texte-second`, sans bordure).

### Logo

Un L arrondi qui se redresse, surmonté d'une bulle qui évoque l'accent, la tête et le souffle. Deux dessins : le dessin normal, et un dessin simplifié pour 16 et 24 px.

```svg
<!-- Dessin normal -->
<svg viewBox="2.4 -1.3 24 24" fill="none">
  <path d="M9.6 8 Q8.4 12.5 9 15.2 Q9.6 18 12.6 18 H20.4"
        stroke="#0e6f6a" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="11.4" cy="3.7" r="1.9" fill="#f1be5a"/>
</svg>

<!-- Dessin simplifié, 16 et 24 px -->
<svg viewBox="3 -1.45 24 24" fill="none">
  <path d="M9.5 8.5 V14.5 Q9.5 18 13 18 H20.5"
        stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="11" cy="3.6" r="2.5" fill="#f1be5a"/>
</svg>
```

- Icône de l'application : carré aux angles arrondis (rayon de 24 % du côté), fond `#0e6f6a`, L blanc, bulle `#f1be5a`.
- Logotype : le L dessiné, suivi de « èv » en Atkinson Hyperlegible 700, couleur `#0e6f6a`.
- Variante une couleur : L et bulle dans la couleur du texte.

### Mouvement

- Une notification apparaît et disparaît en fondu de 200 ms, sans glissement.
- Chaque notification porte un petit logo Lèv dans son coin supérieur droit. À l'apparition, sa bulle monte doucement une seule fois, sur 3,2 secondes. C'est la seule animation décorative : l'icône de la zone de notification, elle, ne bouge jamais. Ce petit logo n'est pas maquetté (section 16).
- Dans la respiration guidée, la bulle change de taille entre 55 % et 100 %, sur la durée exacte du temps en cours.
- Si Windows est réglé pour limiter les animations, tout est figé : la bulle de respiration change de taille sans transition.
- Aucun compte à rebours, aucun défilement automatique.

## 10. Contenus

Les contenus sont séparés du code, dans des fichiers JSON que l'équipe d'Ekilib.re peut relire et modifier sans développeur.

### 10.1 Idées de mouvement (`content/idees.fr.json`)

Deux listes : `debout` et `assis`. Chaque idée est une phrase de 160 caractères au plus, faisable au bureau sans matériel ni tenue particulière.

Les six idées ci-dessous sont des exemples provisoires. Elles doivent être relues ou réécrites par les enseignants en APA avant diffusion. Objectif pour la v1 : au moins 15 idées par liste.

| Liste | Idée provisoire |
| --- | --- |
| debout | Va remplir ta gourde en passant par le chemin le plus long, ou monte un étage à pied. |
| debout | Marche jusqu'à une fenêtre, regarde au loin, puis roule doucement les épaules vers l'arrière, cinq fois. |
| debout | Fais le tour de l'étage à ton rythme, en laissant les bras se balancer. |
| assis | Sans te lever : décolle les talons, puis les pointes de pieds, dix fois. Laisse ensuite rouler les épaules vers l'arrière. |
| assis | Sans te lever : redresse-toi, puis tourne lentement la tête à droite et à gauche, cinq fois, sans forcer. |
| assis | Sans te lever : tends une jambe devant toi, tiens trois respirations, puis change de côté. |

### 10.2 Guide du poste (`content/guide.fr.json`)

| Étape | Titre | Texte |
| --- | --- | --- |
| 1 | L'écran | Place-le bien en face de toi, le haut de l'écran à la hauteur de tes yeux. Tourne-le de côté par rapport à la fenêtre pour éviter les reflets. |
| 2 | Le siège | Assieds-toi au fond du siège, le dos en contact avec le dossier. Tes pieds reposent à plat sur le sol, ou sur un repose-pieds. |
| 3 | Le clavier et la souris | Laisse 10 à 15 cm entre le bord du bureau et le clavier pour poser tes avant-bras. Garde la souris tout près du clavier, sans appuyer les poignets en continu. |
| 4 | La lumière | Évite une fenêtre ou une lampe juste devant ou derrière l'écran. Règle les stores et l'éclairage selon le moment de la journée. |
| 5 | Avec un ordinateur portable | Si tu y travailles longtemps, surélève-le et branche un clavier et une souris séparés. |

Mention affichée : « D'après les recommandations de l'INRS sur le travail sur écran. », suivie du lien « Lire le dossier de l'INRS » vers https://www.inrs.fr/risques/travail-ecran/prevention-risques.html. Ces textes sont à faire relire : trois consignes (hauteur de l'écran, orientation par rapport à la fenêtre, pieds à plat et dos au dossier) proviennent de fiches d'organismes qui reprennent ces repères, pas directement du dossier de l'INRS.

### 10.3 Textes de référence de l'écran « À propos »

| Organisme | Titre et lien |
| --- | --- |
| Anses, octobre 2025 | [Marcher régulièrement 5 minutes pour préserver sa santé](https://www.anses.fr/fr/actualite/marcher-regulierement-5-minutes-preserver-sa-sante) |
| INRS | [Prévention des risques liés aux postures sédentaires au travail](https://www.inrs.fr/risques/postures-sedentaires/prevention-risques.html) |
| OMS, novembre 2020 | [Lignes directrices sur l'activité physique et la sédentarité](https://www.who.int/fr/publications-detail/9789240014886) |
| Santé publique France, décembre 2025 | [Sédentarité : prévalence et connaissance des recommandations, Baromètre 2024](https://www.santepubliquefrance.fr/nutrition-et-activite-physique/rapportsynthese/sedentarite-prevalence-et-connaissance-des-recommandations-barometre-de-sante-publique-france) |
| Santé publique France | [Réduire le temps passé assis (mangerbouger.fr)](https://www.mangerbouger.fr/l-essentiel/les-recommandations-sur-l-alimentation-l-activite-physique-et-la-sedentarite/reduire/reduire-le-temps-passe-assis) |
| Code du travail | [Article R. 4542-4, interruptions du travail sur écran](https://code.travail.gouv.fr/code-du-travail/r4542-4) |
| INRS | [Travail sur écran, réglementation et normes](https://www.inrs.fr/risques/travail-ecran/reglementation-normes.html) |

Seule la page de l'Anses a été ouverte et lue en entier pendant la conception. Les six autres liens sont à tester un par un avant publication.

### 10.4 Ce que l'application n'affirme pas

- Aucun texte officiel consulté ne fixe de rythme pour cligner des yeux : l'écran « À propos » présente les 20 minutes comme un choix de l'application.
- La respiration guidée n'annonce aucun effet sur la santé. Les rythmes proposés n'ont pas de référence médicale vérifiée.
- La mention « L'application ne remplace pas l'avis d'un professionnel de santé » figure dans « À propos ».

### 10.5 Textes de l'écran « À propos »

Ces textes sont à reprendre mot pour mot dans `content/fr.json`.

**En-tête.** Titre : « À propos ». Signature : « Lèv — une pause, naturellement. » Phrase : « Un compagnon discret pour bouger un peu plus souvent pendant le travail sur écran, et laisser ses yeux se reposer. »

**Notre philosophie**

| Titre | Texte |
| --- | --- |
| Rester assis longtemps compte, même quand on fait du sport | Une séance de sport le soir ne suffit pas à effacer une journée entière passée sur une chaise. Ce qui aide, c'est d'interrompre souvent la position assise. |
| De petits gestes, souvent | Quelques pas, un étage à pied, un regard par la fenêtre. Rien à réussir, rien à mesurer : chaque petite pause compte. |
| Une invitation, jamais un reproche | Tu peux reporter une pause ou la passer. L'application ne tient aucun compte de ce que tu n'as pas fait. |
| Le travail reste au centre | Les rappels se font discrets et se taisent quand tu présentes ou travailles en plein écran. Les séquences de travail t'aident à te concentrer, puis à vraiment t'arrêter. |
| Le bon moment | Lèv attend que tu aies fini de taper, tient compte des pauses que tu prends de toi-même et respecte tes horaires. |
| Des idées écrites par des professionnels | Les idées de mouvement sont rédigées par les enseignants en activité physique adaptée d'Ekilib.re, avec toujours une variante à faire assis. |
| Chez toi, pour toi | Aucun compte, aucune inscription, aucune donnée personnelle demandée. Tes réglages restent sur ton ordinateur. L'application est gratuite et ne remplace pas l'avis d'un professionnel de santé. |

**Les repères que suit l'application**

| Titre | Texte |
| --- | --- |
| Se lever toutes les 30 minutes | L'Anses et l'INRS conseillent d'interrompre la position assise toutes les 30 minutes dans l'idéal. C'est le rythme proposé par défaut. |
| Marcher 5 minutes | Pour un adulte, l'Anses conseille 5 minutes de marche, à allure tranquille ou modérée. C'est la durée de la pause active. |
| Quitter l'écran des yeux | Le Code du travail prévoit que le travail sur écran soit régulièrement interrompu, sans fixer de rythme. Le rappel toutes les 20 minutes est un choix de l'application, que tu peux modifier. |

Lien sous ce bloc : « Bien installer mon poste, en cinq réglages ».

**Ekilib.re.** « L'application est proposée gratuitement par l'association Ekilib.re, Maison Sport-Santé au Tampon, à La Réunion. Nous accompagnons chacun, quel que soit son âge, pour pratiquer ou reprendre une activité physique adaptée. »

Sous-titre « Envie d'aller plus loin ? » : « Nos enseignants en activité physique adaptée t'accueillent au Tampon pour faire le point et trouver une activité qui te convient. Tu trouveras comment nous joindre sur ekilib.re. »

Lien « Découvrir Ekilib.re », puis « Version 1.0.0 · Tous droits réservés, Ekilib.re » (mention provisoire, section 16), puis la mention « Lèv vérifie une fois par jour si une mise à jour existe. C'est son seul échange avec Internet. » (absente de la maquette, à afficher seulement quand les mises à jour sont activées).

Dernière ligne de la page : « Lèv — levez-vous, respirez. »

## 11. Confidentialité et sécurité

Lèv ne collecte, ne transmet et ne conserve aucune donnée personnelle en dehors de l'ordinateur de l'utilisateur. Cette promesse est affichée dès le premier lancement : le code doit la tenir à la lettre.

### Ce que Lèv fait et ne fait pas

- Aucun compte, aucune adresse e-mail, aucun identifiant d'appareil.
- Aucune mesure d'audience, aucun rapport d'erreur automatique, aucune bibliothèque tierce qui appelle Internet.
- Les polices et les images sont embarquées. L'application fonctionne entièrement hors connexion.
- La détection d'activité lit uniquement le temps écoulé depuis la dernière action. Aucune frappe, aucun titre de fenêtre, aucune capture d'écran n'est lu ni enregistré.
- Les seuls accès réseau admis : la vérification des mises à jour (section 13), et l'ouverture d'un lien dans le navigateur quand l'utilisateur clique dessus.
- Désinstaller l'application supprime aussi le fichier de réglages (option deleteAppDataOnUninstall de l'installateur, à activer).

### Règles de sécurité Electron

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` sur toutes les fenêtres.
- Une politique de sécurité de contenu stricte : aucun script ni style distant, aucun `eval`.
- Le `preload` n'expose que des fonctions nommées et typées, jamais `ipcRenderer` entier.
- Les liens externes passent par `shell.openExternal`, après vérification que l'adresse commence par `https://` et appartient à l'un de ces domaines : anses.fr, inrs.fr, who.int, santepubliquefrance.fr, mangerbouger.fr, code.travail.gouv.fr, ekilib.re.
- Toute navigation et toute ouverture de fenêtre depuis un écran sont bloquées.
- Une seule instance de l'application à la fois (`requestSingleInstanceLock`).

### Cadre

Lèv est présentée comme une application de bien-être. Elle ne pose pas de diagnostic et n'annonce pas d'effet thérapeutique. Ce positionnement, comme l'absence d'obligation au titre du RGPD pour l'application elle-même, est à faire confirmer par un juriste avant diffusion : ce document ne vaut pas avis juridique.

## 12. Accessibilité

Lèv doit être utilisable au clavier, avec un lecteur d'écran et par une personne malvoyante. Ce n'est pas une option de fin de projet : chaque écran est livré conforme.

- **Clavier** : tout est atteignable avec Tab, activable avec Entrée ou Espace. Le focus est toujours visible (contour de 3 px dans la couleur `--action`).
- **Notification** : elle ne prend pas le focus à l'apparition. Un raccourci global, Ctrl + Alt + L par défaut, y place le focus. Il n'est enregistré que pendant qu'une notification est à l'écran, et libéré dès qu'elle se ferme : sous Windows, Ctrl + Alt équivaut à la touche AltGr, et un raccourci permanent pourrait gêner la saisie. À tester sur un clavier AZERTY. Échap vaut « Plus tard ».
- **Lecteur d'écran** : vrais éléments `button`, `a`, `input`, `label`, `select`. Les boutons sans texte ont un libellé (« Retirer le rappel Marcher 5 minutes »). Les messages qui changent sont annoncés (`aria-live="polite"`). À vérifier avec NVDA.
- **Contrastes** : au moins 4,5 pour 1 pour tout texte, 3 pour 1 pour les contours de champs. À mesurer sur le dégradé et sur les cartes translucides, dans les deux thèmes. Si une mesure échoue, on rend la carte plus opaque plutôt que de changer les couleurs de texte.
- **Couleur** : aucune information ne passe par la couleur seule. Un élément sélectionné se distingue aussi par son fond plein et sa graisse.
- **Taille** : l'interface respecte la mise à l'échelle de Windows (100 à 200 %) sans texte coupé.
- **Mouvement** : respect du réglage Windows de réduction des animations (section 9).
- **Son** : coupé par défaut. Activé, il est court, doux et unique.

## 13. Empaquetage, distribution et mises à jour

Lèv est livrée sous la forme d'un installateur Windows unique, qui s'installe sans droits d'administrateur.

- **Installateur** : `electron-builder`, cible NSIS, installation par utilisateur, en français. Raccourci dans le menu Démarrer, pas d'icône imposée sur le bureau.
- **Nom affiché** : « Lèv ». Identifiant technique sans accent : `re.ekilib.lev`. Nom du fichier : `Lev-Setup-1.0.0.exe`.
- **Démarrage automatique** : activé par défaut via `app.setLoginItemSettings`, désactivable dans « Autres réglages ». L'entrée de démarrage automatique lance Lèv avec l'argument --demarrage-auto : dans ce cas aucune fenêtre ne s'ouvre, seule l'icône apparaît. Un lancement à la main (menu Démarrer) ouvre « Mes rappels », ou l'accueil si c'est le premier lancement. Si Lèv tourne déjà, la relancer ouvre « Mes rappels » dans l'instance existante (événement second-instance) : sans cela, le clic semblerait sans effet.
- **Signature du code** : sans certificat de signature, Windows affiche un avertissement « éditeur inconnu » à l'installation, ce qui décourage une partie du public. L'achat d'un certificat au nom de l'association est à décider (section 16).
- **Distribution** : téléchargement depuis ekilib.re. Le Microsoft Store est une seconde voie possible, qui évite l'avertissement de Windows.
- **Mises à jour** : `electron-updater` vérifie au démarrage, puis une fois par jour, si une version plus récente existe, la télécharge en arrière-plan et l'installe à la fermeture. Aucune fenêtre d'interruption. C'est le seul appel réseau spontané de l'application : il est mentionné dans « À propos ». L'hébergement des versions est à décider (section 16).
- **Versions** : numérotation `majeure.mineure.correctif`. Le numéro est affiché dans « À propos ».
- **macOS et Linux** : hors v1. Le code ne doit rien contenir qui empêche de les ajouter (section 3).

## 14. Tests et critères d'acceptation

Le moteur de rappels est couvert par des tests automatiques ; les écrans sont vérifiés par une liste de contrôle manuelle avant chaque version.

### Tests automatiques du moteur (Vitest, horloge simulée)

Chaque règle de la section 5 a au moins un test. Cas obligatoires :

1. Un rappel à 20 minutes se déclenche après 20 minutes de temps actif, pas avant.
2. Le temps ne compte pas session verrouillée, en veille, hors horaires, ou Lèv en veille.
3. Trois minutes d'inactivité remettent tous les rappels récurrents à zéro.
4. Avec l'accalmie activée, la notification attend 4 secondes de calme, et s'affiche de toute façon après 2 minutes.
5. Deux rappels dus en même temps : un seul s'affiche, selon l'ordre de priorité. « Posture » (2 heures) passe avant « bouger » (30 minutes), qui passe avant « yeux » (20 minutes).
6. « Dans 5 min » représente la même notification 5 minutes plus tard.
7. Trois « Plus tard » de suite déclenchent la question de rythme ; « Garder ce rythme » la suspend 7 jours.
8. Un rappel à heure fixe « une seule fois » se désactive après affichage ; un rappel manqué ordinateur éteint n'est pas rattrapé.
9. Au réveil après une longue veille, aucune rafale de notifications.
10. Une séquence 25-5 enchaîne quatre séquences puis propose la grande pause ; « bouger » reste suspendu pendant le travail.
11. La pastille « bientôt » apparaît 2 minutes avant, sauf pour les rappels de moins de 30 minutes.
12. Un fichier de réglages absent, vide ou corrompu est remplacé par les valeurs par défaut.

13) Un rappel à heure fixe ne se déclenche qu'une fois par jour, même si le moteur repasse plusieurs fois dans la même minute.
14) Pendant l'attente d'une accalmie, la vérification se fait chaque seconde ; elle revient à 15 secondes ensuite.
15) Une plage horaire qui passe minuit (20:00 à 02:00) est active à 23:00 et à 01:00, inactive à 03:00.
16) Une pause spontanée pendant une séquence ne change pas l'heure de fin de la séquence.
17) « Rétablir les rappels d'origine » restaure les quatre rappels de base et conserve les rappels personnels.

18. Sur une journée simulée de 8h00 à 18h00 où l'utilisateur ne répond à rien, chaque rappel actif s'affiche au moins une fois toutes les deux périodes : aucun n'est écarté indéfiniment.

### Contrôle manuel avant version

- [ ] Installation sans droits d'administrateur sur Windows 10 et Windows 11
- [ ] Premier lancement : l'accueil s'affiche une seule fois
- [ ] La notification ne prend jamais le focus pendant la frappe dans un autre logiciel
- [ ] La notification est correctement placée avec une barre des tâches en bas, sur le côté, et à 150 % de mise à l'échelle
- [ ] Avec deux écrans, la notification apparaît sur l'écran principal
- [ ] Ajout, réglage, retrait puis « Annuler » d'un rappel, des deux types
- [ ] Les réglages sont conservés après redémarrage de l'ordinateur
- [ ] Thème clair, sombre et automatique, avec bascule à chaud
- [ ] Parcours complet au clavier seul, puis avec NVDA
- [ ] Respiration guidée : la bulle suit les temps réglés, y compris avec une pause à 0
- [ ] Tous les liens de « À propos » s'ouvrent dans le navigateur
- [ ] Pare-feu en mode blocage : l'application fonctionne normalement hors connexion
- [ ] Mémoire au repos inférieure à 150 Mo, processeur proche de 0 % sur dix minutes
- [ ] Relecture de tous les textes au regard de la section 8

## 15. Plan de développement

Le développement se fait en huit lots, dans cet ordre. Chaque lot se termine par une application qui se lance et se teste : on ne commence pas le suivant avant.

| Lot | Contenu | Terminé quand |
| --- | --- | --- |
| 0. Socle | Projet `electron-vite` en TypeScript strict, arborescence de la section 3, règles de sécurité, icône dans la zone de notification, fichier de réglages avec valeurs par défaut, jetons de couleur, police et icônes fournies à l'avance (section 17) | L'icône apparaît, « Quitter » fonctionne, les réglages par défaut sont écrits sur le disque |
| 1. Moteur et première notification | Moteur avec horloge injectée (5.1, 5.4, 5.5), fenêtre de notification, rappels « yeux » et « bouger », messages de réponse | Les deux rappels se déclenchent et répondent aux trois boutons. Tests 1, 5, 6 et 18 au vert |
| 2. Menu et « Mes rappels » | Menu complet, liste des rappels, ajout des deux types, retrait avec « Annuler », « Rétablir les rappels d'origine », horaires, rappels à heure fixe (5.6) | On peut créer, régler et retirer un rappel sans redémarrer. Tests 2, 8, 12, 13, 15 et 17 au vert |
| 3. Le bon moment | Accalmie, pauses spontanées, mise en veille, états de l'icône, pastille « bientôt », détection du plein écran par appel natif, étude technique « Ne pas déranger » (5.9) | Tests 3, 4, 9, 11 et 14 au vert. Compte rendu de l'étude technique rédigé |
| 4. Séquences de travail | Règles 5.8, notifications de fin de séquence et de fin de pause, ligne de parcours, état dans le menu | Une série de quatre séquences se déroule jusqu'à la grande pause. Tests 10 et 16 au vert |
| 5. Contenus et écrans annexes | Premier lancement, « À propos », guide du poste, point posture, idées de mouvement avec variante assise, respiration guidée | Tous les écrans de la section 7 existent et sont conformes à ce document |
| 6. Finitions | Rappel qui s'adapte (5.7), thème sombre et automatique, son, accessibilité (section 12), animation du logo | Test 7 au vert. Parcours clavier et NVDA validés. Contrastes mesurés |
| 7. Livraison | Installateur, démarrage automatique, mises à jour, signature si décidée, contrôle manuel complet | La liste de contrôle de la section 14 est entièrement cochée sur Windows 10 et 11 |

Les contenus définitifs des enseignants en APA (section 10.1) peuvent arriver en parallèle : il suffit de remplacer le fichier JSON avant le lot 7.

## 16. Points ouverts

Seize points restent à trancher : les treize du tableau et les trois qui le suivent. Chacun a une règle provisoire, pour que le développement ne soit pas bloqué.

| Point | À décider | Règle provisoire | Avant le lot |
| --- | --- | --- | --- |
| Rappels actifs au départ | Lesquels sont cochés au premier lancement | Yeux, marcher et posture actifs ; eau proposée mais décochée | 1 |
| Longues séquences | Que faire quand une séquence dépasse 30 minutes assis (rythmes 50-10 et « une pause par heure ») | Une invitation discrète à se lever au milieu de la séquence | 4 |
| Visioconférences | Peut-on lire de façon fiable le mode « Ne pas déranger » de Windows | Plein écran et mode présentation seulement (5.9) | 3 |
| Logotype | La bulle au-dessus du L et l'accent du « è » font double emploi | Garder les deux, comme sur la maquette | 5 |
| Logo Ekilib.re | Fichier du logo de l'association pour l'écran « À propos » | Nom en toutes lettres, sans logo | 5 |
| Idées de mouvement | Relecture et rédaction par les enseignants en APA | Les six exemples, marqués provisoires | 7 |
| Guide du poste | Relecture des cinq consignes et de la mention de source | Textes de la section 10.2 | 7 |
| Son | Quel son, créé ou libre de droits | Option masquée tant qu'aucun son n'est choisi | 6 |
| Écrans sombres | Seuls le menu et le rappel « bouger » ont une maquette sombre | Appliquer les jetons sombres de la section 9 | 6 |
| Licence | Logiciel libre ou non, et quelle licence | Mention « Tous droits réservés, Ekilib.re » | 7 |
| Nom | Vérifier que « Lèv » est disponible comme marque et comme nom de domaine | Aucune : à vérifier avant toute communication publique | 7 |
| Signature du code | Achat d'un certificat au nom de l'association | Livrer sans signature en test interne uniquement | 7 |
| Hébergement | Où sont publiés l'installateur et les mises à jour | Mises à jour désactivées tant que ce n'est pas décidé | 7 |

Trois points ajoutés à la relecture de cohérence :

- **Seuil de pause spontanée.** Trois minutes sans clavier ni souris comptent comme une pause (5.2). Or lire un long document ou suivre une réunion sans toucher à rien produit le même signal, alors que la personne est restée assise. Règle provisoire : garder 3 minutes. À revoir après les premiers essais réels, avant le lot 3.
- **Petit logo animé dans la notification.** Il a été ajouté pour donner une place à l'animation de la bulle (section 9), puisque l'icône de la zone de notification ne s'anime pas. Il n'est pas maquetté. Règle provisoire : logo de 24 px en haut à droite de la carte. Avant le lot 6.
- **Case « Séquences de travail ».** Elle est cochée par défaut dans ce document, décochée sur la maquette. Règle provisoire : cochée. Avant le lot 4.

Reste aussi la relecture juridique évoquée en section 11, à faire avant la diffusion publique.

## 17. Annexe : travailler avec Cursor

Cursor doit avoir ce document et les maquettes sous les yeux en permanence, et avancer un lot à la fois.

### Mise en place

1. Exporter ce document en Markdown et l'enregistrer dans le projet sous `docs/CDC.md`. Il se suffit à lui-même : tous les textes de l'interface y figurent.
2. Exporter chaque planche du canevas en image dans `docs/maquettes/`, avec le nom de la planche.
3. Déposer à l'avance les fichiers que Cursor ne sait pas produire : les deux polices `AtkinsonHyperlegible-Regular.woff2` et `AtkinsonHyperlegible-Bold.woff2` dans `resources/fonts/`, et les icônes `.ico` multi-tailles (les trois icônes de la zone de notification et celle de l'application, déjà fournies) dans `resources/icons/`.
4. Créer les trois fichiers de règles ci-dessous dans le dossier `.cursor/rules/`. Ils doivent porter l'extension `.mdc` : un fichier `.md` placé dans ce dossier est ignoré par Cursor.
5. Pour chaque lot, ouvrir une nouvelle conversation dans Cursor avec une demande du type : « Réalise le lot 2 de `docs/CDC.md`. Commence par me présenter ton plan, sans coder. »

### Règles du projet

La première règle s'applique toujours. Les deux autres ne se chargent que lorsque Cursor travaille sur les fichiers concernés.

`.cursor/rules/01-general.mdc`

```markdown
---
description: Règles générales du projet Lèv
alwaysApply: true
---

# Règles générales du projet Lèv

## Source de vérité
- `docs/CDC.md` est le cahier des charges. Lis la section concernée avant de coder.
- `docs/maquettes/` contient les maquettes. En cas d'écart, le cahier des charges fait foi.
- Si une règle manque ou semble contradictoire, pose la question. N'invente pas de fonctionnalité.

## Périmètre
- Un seul lot à la fois (section 15). Ne commence pas le lot suivant.
- N'ajoute jamais : statistiques, historique, compte utilisateur, mesure d'audience, appel réseau autre que la mise à jour prévue en section 13.
- N'ajoute aucune dépendance sans la proposer et la justifier d'abord.

## Code
- TypeScript strict, aucun `any`.
- Tout ce qui dépend de Windows passe par `src/main/platform/`. Aucun `process.platform` ailleurs.
- Sécurité Electron : `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.
- Les fenêtres Application et Menu sont créées à la demande et détruites à la fermeture (section 3).
- Le raccourci clavier global n'est enregistré que pendant l'affichage d'une notification.

## Ton des textes (section 8)
- Tutoiement, phrases courtes, invitation ou question.
- Jamais d'ordre, d'alerte, de reproche, de compteur de pauses manquées.
- Bouton principal d'une pause : « Je le fais ». Jamais « OK » ni « Ignorer ».
- Pas de point d'exclamation, pas d'émoji, pas de majuscules d'insistance.

## Fin de lot
- Lance les tests et la vérification des types.
- Résume ce qui est fait, ce qui ne l'est pas, et les questions ouvertes.
```

`.cursor/rules/02-moteur.mdc`

```markdown
---
description: Règles du moteur de rappels
globs: src/main/scheduler/**
alwaysApply: false
---

# Moteur de rappels

- Aucun import d'Electron dans ce dossier.
- Aucun appel à l'horloge système (`Date.now()`, `new Date()` sans argument, `setTimeout`, `setInterval`) : l'instant courant (`maintenant: Date`) et l'inactivité (`inactiviteSec: number`) sont passés en paramètres à la fonction d'évaluation. `new Date(valeur)` reste permis pour lire une date enregistrée.
- Toute durée est une constante nommée dans `constantes.ts`.
- Chaque règle de la section 5 du cahier des charges a un test Vitest avec une horloge simulée.
- Les 18 cas de la section 14 sont obligatoires.
```

`.cursor/rules/03-ecrans.mdc`

```markdown
---
description: Règles des écrans
globs: src/renderer/**
alwaysApply: false
---

# Écrans

- Aucun texte en dur : tout vient de `src/content/fr.json`.
- Aucune couleur ni taille en dur : uniquement les variables CSS de la section 9.
- Éléments HTML natifs (`button`, `a`, `input`, `label`, `select`). Jamais de `div` cliquable.
- Cibles de 48 px minimum, focus toujours visible.
- Respecte `prefers-reduced-motion`.
- Les écrans passent par l'API du preload. Jamais d'accès direct au disque ni à `ipcRenderer`.
- La notification mesure sa hauteur avec `ResizeObserver` et la transmet au processus principal, qui l'arrondit en entier avant `setBounds()`.
```
