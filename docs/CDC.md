# Lèv — Cahier des charges de développement (v1)

Nov 13, 2026 · @Laurent

## 1. Présentation

Lèv est une application de bureau gratuite qui invite, sans jamais l'imposer, à bouger et à reposer ses yeux pendant le travail sur écran. Elle est éditée par l'association Ekilib.re, Maison Sport-Santé au Tampon (La Réunion).

- **Signature** : « Lèv - une pause, naturellement. »
- **Public** : grand public, toute personne qui travaille sur ordinateur.
- **Plateforme** : Windows 10 et 11 pour la v1. Le code doit rester portable vers macOS, puis Linux.
- **Promesse** : aucun compte, aucune inscription, aucune donnée personnelle demandée. Tout reste sur l'ordinateur.
- **Posture** : un compagnon bienveillant, jamais un coach exigeant.

### Périmètre de la v1

1. Rappels récurrents (cligner des yeux, marcher, point posture, rappels libres) et rappels à heure fixe.
2. Notifications non bloquantes en bas à droite, avec trois réponses : « Je le fais », « Dans 5 min », « Plus tard ».
3. Séquences de travail de type Pomodoro.
4. Choix du bon moment : attendre une accalmie, tenir compte des pauses spontanées, horaires de travail, mise en veille.
5. Icône dans la zone de notification (calme, bientôt, veille, compte des minutes pendant une séquence) et un menu. Pendant qu'une notification est affichée, l'icône reste celle de « bientôt ».
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

| Sujet                    | Décision                                                                                                                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nom                      | Lèv                                                                                                                                                                                      |
| Adresse à l'utilisateur  | Tutoiement partout dans l'interface. La signature « Lèv - une pause, naturellement. » reste telle quelle                                                                                |
| Voix                     | Lèv parle à la première personne dans l'accueil et les notifications (« Je te rappellerai… »), et à la troisième personne dans les réglages et « À propos » (« Lèv retient ton rythme ») |
| Réglage                  | Zéro réglage obligatoire. L'application fonctionne dès le premier lancement                                                                                                              |
| Enregistrement           | Pas de bouton « Enregistrer ». Tout changement s'applique immédiatement                                                                                                                  |
| Notifications            | Non bloquantes, en bas à droite, sans prise de focus. Jamais de fenêtre centrée ni d'écran assombri                                                                                      |
| Boutons de réponse       | « Je le fais » (principal), « Dans 5 min », « Plus tard ». Jamais « OK » ni « Ignorer »                                                                                                  |
| Pastille « bientôt »     | Affichée 2 minutes avant une pause                                                                                                                                                       |
| Réponse à « Dans 5 min » | « D'accord, je reviens dans 5 minutes. »                                                                                                                                                 |
| Compte à rebours         | Aucun minuteur qui défile. On affiche une heure (« Reprise à 10h50 ») ou une ligne de parcours                                                                                           |
| Manques                  | L'interface ne commente jamais une pause passée ou manquée. Aucun compteur de ce qui n'a pas été fait                                                                                    |
| Mascotte                 | Aucune. Le seul personnage est le logo                                                                                                                                                   |
| À propos                 | Une seule section, qui regroupe l'application et Ekilib.re                                                                                                                               |
| Contact                  | Pas de numéro de téléphone. Renvoi vers ekilib.re                                                                                                                                        |
| Repère « bouger »        | 5 minutes de marche toutes les 30 minutes (Anses, octobre 2025)                                                                                                                          |
| Repère « yeux »          | 20 minutes par défaut. C'est un choix de l'application, présenté comme tel                                                                                                               |
| Respiration              | Respiration carrée 4-4-4-4 par défaut, temps réglables                                                                                                                                   |
| Idées de mouvement       | Rédigées et validées par les enseignants en APA d'Ekilib.re, toujours avec une variante assise                                                                                           |
| Santé                    | Application de bien-être. Aucun bénéfice médical annoncé. Mention « ne remplace pas un avis médical »                                                                                    |

## 3. Pile technique et architecture

Lèv est une application Electron écrite en TypeScript, avec une interface en React. Ce choix privilégie la simplicité de développement dans Cursor et la portabilité vers macOS et Linux avec un seul code.

| Brique       | Choix                                                     | Rôle                                                                          |
| ------------ | --------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Socle        | Electron, dernière version stable                         | Fenêtres, zone de notification, démarrage automatique, détection d'inactivité |
| Langage      | TypeScript en mode strict                                 | Tout le code                                                                  |
| Interface    | React + Vite (gabarit `electron-vite`)                    | Tous les écrans                                                               |
| Styles       | CSS natif avec variables (jetons de la section 9)         | Pas de bibliothèque de composants                                             |
| Stockage     | `electron-store` (un fichier JSON local)                  | Réglages et rappels                                                           |
| Empaquetage  | `electron-builder`, installateur NSIS par utilisateur     | Installation sans droits administrateur                                       |
| Mises à jour | API GitHub Releases, sans `electron-updater`              | Vérification seule, rien n'est téléchargé (section 13)                        |
| Tests        | Vitest pour le moteur. Les écrans sont vérifiés à la main | Voir section 14                                                               |

Contrepartie assumée : une application Electron pèse environ 100 Mo et consomme plus de mémoire qu'une application native. Objectifs : moins de 150 Mo de mémoire au repos, processeur proche de 0 % entre deux rappels. Si ces objectifs ne sont pas tenus, l'alternative à étudier est Tauri, plus légère mais qui demande du Rust.

L'appel natif Windows utilise Koffi (section 5.9).

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
    boucle.ts          horloge, inactivité, écoute des notifications
    reglages.ts        valeurs par défaut et validation du format
    store.ts           lecture, écriture et migration (reunionJusqua)
    scheduler/         moteur de rappels : logique pure, sans Electron, testable
      constantes.ts    toutes les durées du moteur
      moteur.ts        décision d'affichage
    tray.ts            icône, états, infobulle, menu du clic droit
    windows.ts         création commune des fenêtres
    applicationFenetre.ts
    menuFenetre.ts
    notificationFenetre.ts
    pontEcrans.ts      actions des écrans, veille, réunion, mises à jour
    composerNotification.ts
    platform/          tout ce qui dépend du système (win32.ts, puis darwin.ts, linux.ts)
    ipc.ts             politique de sécurité des fenêtres
  preload/             pont sécurisé (contextBridge), contrat typé
  renderer/
    notification/      la notification en bas à droite
    menu/              le menu de la zone de notification
    app/               Mes rappels, À propos, Guide du poste, Respiration, Bienvenue
    shared/            composants, jetons, pictogrammes, logo
  content/             textes et contenus (fr.json, idees.fr.json, guide.fr.json, astuces.fr.json)
  partage/             types et calculs communs au processus principal et aux écrans
```

Les trois fenêtres chargent la même page, `src/renderer/index.html`, et se distinguent par l'adresse : `#/notification`, `#/menu`, `#/app`. Une seule entrée évite les erreurs de configuration de Vite entre le mode développement et l'installateur. Les dossiers `notification/`, `menu/` et `app/` rangent les composants, pas des pages séparées. Le fond de la page n'est transparent que pour `#/notification` et `#/menu`.

### Les fenêtres

| Fenêtre      | Caractéristiques                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Notification | Sans cadre, toujours au premier plan, absente de la barre des tâches, largeur 420 à 480 px. Affichée avec `showInactive()` : elle ne prend pas le focus à l'apparition. Placée à 24 px des bords de la zone de travail de l'écran principal                                                                                                                                                                                                                                                                                     |
| Menu         | Sans cadre, carte de 300 px (fenêtre de 360 px, marge d'ombre comprise), ouvert au clic sur l'icône, ancré près d'elle, fermé dès qu'il perd le focus. Aucune barre de défilement                                                                                                                                                                                                                                                                                                                                               |
| Application  | Fenêtre classique redimensionnable. `useContentSize` : 520 × 580 désigne la zone de contenu, la barre de titre Windows s'ajoute en dehors. Minimum 440 × 460, également en taille de contenu. Icône `resources/icons/lev.ico` dans la barre de titre. Une seule instance, navigation interne entre les écrans. Le contenu occupe toute la largeur, avec une seule marge de page de 12 px sur 14 px. `html`, `body` et `#racine` sont en `height: 100%`, sans `min-height: 100vh`. Les `p` et `h1` n'ont pas de marge par défaut |

Fermer la fenêtre « Application » ne quitte pas Lèv : seule l'entrée « Quitter » du menu arrête l'application.

### Mémoire : des fenêtres créées à la demande

Chaque fenêtre Electron lance son propre processus. Garder les trois fenêtres en mémoire ferait dépasser l'objectif de 150 Mo. Règles :

- Seul le processus principal tourne en permanence, avec l'icône de la zone de notification.
- **Application** : créée à la demande, détruite (`destroy()`) dès sa fermeture.
- **Menu** : créé au clic sur l'icône, détruit 60 secondes après sa fermeture.
- **Notification** : créée au moment du rappel, détruite (`destroy()`) dès qu'elle a disparu. Elle n'est pas conservée masquée entre deux rappels : son processus de rendu est libéré.
- Une fenêtre unique partagée n'est pas retenue : le menu et une notification peuvent être visibles en même temps.

Deux réglages du processus principal, posés avant `app.whenReady()`, limitent l'empreinte sur tous les postes Windows, y compris à plusieurs écrans ou avec une carte graphique dédiée :

- `app.disableHardwareAcceleration()` : Lèv n'affiche que des interfaces en deux dimensions. Le processus GPU de Chromium n'est pas lancé.
- `app.commandLine.appendSwitch('js-flags', '--max-old-space-size=64')` : le tas mémoire de V8 est plafonné à 64 Mo, pour éviter une dérive sur plusieurs jours sans redémarrage.

La mémoire au repos reste à mesurer (section 14) : moins de 150 Mo, processeur proche de 0 % entre deux rappels.

### Précisions propres à Windows

- **Options de la notification** : `frame: false`, `transparent: true`, `skipTaskbar: true`, `focusable: true`, affichage par `showInactive()`. Elle ne prend pas le focus à l'apparition, mais peut le recevoir par un clic ou par le raccourci clavier.
- **Ombre** : la fenêtre dépasse la carte de 30 px transparents de chaque côté, sinon l'ombre est coupée. La position de la fenêtre compense cette marge pour que la carte reste à 24 px des bords de la zone de travail.
- **Hauteur** : la hauteur de la carte varie selon le contenu. L'écran la mesure avec `ResizeObserver` et l'envoie au processus principal, qui redimensionne la fenêtre en gardant le bord bas fixe. La mesure est un nombre à virgule, alors que setBounds() n'accepte que des entiers : la hauteur est arrondie à l'entier supérieur (Math.ceil) pour ne jamais rogner la carte, et les positions à l'entier le plus proche (Math.round). `html` et `body` de `#/menu` et de `#/notification` ont `overflow: hidden` : la barre de défilement ne doit jamais apparaître dans la marge transparente. Les espacements verticaux du menu sont resserrés pour que la carte tienne dans la zone de travail. Jamais de vide.
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
type Frequence = 10 | 20 | 30 | 45 | 60 | 120 | 240 // minutes, liste unique pour toute l'application
type Repetition = 'jour' | 'semaine' | 'une' // chaque jour, lundi-vendredi, une seule fois
type Jours = 'semaine' | 'samedi' | 'jour' // lun-ven, lun-sam, tous les jours

interface Rappel {
  id: string // uuid
  nom: string // 1 à 40 caractères, non modifiable après création en v1
  type: 'yeux' | 'bouger' | 'posture' | 'libre'
  origine: 'base' | 'perso' // 'base' : fourni avec Lèv ; 'perso' : créé par l'utilisateur
  mode: 'recurrent' | 'heure'
  frequenceMin?: Frequence // si mode = 'recurrent'
  heure?: string // 'HH:mm', si mode = 'heure'
  repetition?: Repetition // si mode = 'heure'
  dernierDeclenchement?: string // 'AAAA-MM-JJ', si mode = 'heure', voir 5.6
  actif: boolean
  reportsDeSuite: number // « Plus tard » consécutifs, voir 5.7
  neRienProposerAvant?: string // date ISO, voir 5.7
}

interface Reglages {
  version: 1
  premierLancementFait: boolean
  rappels: Rappel[]
  horaires: { debut: string; fin: string; jours: Jours } // '08:00', '18:00', 'semaine'
  sequences: {
    actif: boolean // true : le menu propose les séquences
    rythme: '25-5' | '50-10' | 'heure' | 'autre'
    travailMin: number // 25
    pauseMin: number // 5
    grandePauseMin: number // 15
    grandePauseApres: number // 4 séquences
  }
  options: {
    attendreAccalmie: boolean // true
    pausesSpontanees: boolean // true
    nePasDeranger: boolean // true
    proposerEspacer: boolean // true
    mouvementsAssis: boolean // false
    son: boolean // false
    lancerAuDemarrage: boolean // true
    verifierMajAuto: boolean // true
    suspendreInactivite: boolean // true
    afficherAstuces: boolean // true, astuces en pied de notification
  }
  theme: 'auto' | 'clair' | 'sombre' // 'auto'
  respiration: {
    inspiration: number
    pleine: number
    expiration: number
    vide: number
    minutes: 1 | 3 | 5
  }
  guidePoste: boolean[] // 5 cases cochées ou non
  astucesVues: string[] // identifiants déjà affichés, vide au départ
  notificationsAffichees: number // rappels déjà proposés depuis l'installation, 0 au départ
  veilleJusqua?: string // date ISO, veille manuelle ou réunion
  veilleMotif?: 'reunion' // présent seulement pour « En réunion (1 h) »
  derniereVerificationMaj?: string // date ISO, dernière vérification réussie
  derniereVersionVue?: string // version SemVer plus récente déjà constatée
}
```

### Valeurs au premier lancement

| Rappel               | Type    | Réglage               | Actif |
| -------------------- | ------- | --------------------- | ----- |
| Cligner des yeux     | yeux    | Toutes les 20 minutes | Oui   |
| Marcher 5 minutes    | bouger  | Toutes les 30 minutes | Oui   |
| Point posture        | posture | Toutes les 2 heures   | Oui   |
| Boire un verre d'eau | libre   | Toutes les heures     | Non   |

Respiration : 4, 4, 4, 4 secondes, 1 minute. Dans la maquette, le rappel « Pause déjeuner » et la case cochée de « Boire un verre d'eau » sont des exemples d'illustration.

### Règles

- Les quatre rappels du premier lancement ont `origine: 'base'`. Les rappels créés par l'utilisateur ont `origine: 'perso'` et `type: 'libre'`.
- Aucun rappel n'est renommable en v1 : le nom se choisit à la création.
- Les trois rappels de type `yeux`, `bouger` et `posture` ne peuvent pas être retirés, seulement décochés : ils portent un comportement que le formulaire d'ajout ne sait pas recréer. Tous les autres peuvent être retirés.
- « Rétablir les rappels d'origine » (section 7.4) remet les quatre rappels de base à leurs valeurs de départ, sans toucher aux rappels personnels.
- La liste `Frequence` est la même partout. Le formulaire d'ajout n'en propose que cinq en raccourci, mais la liste déroulante d'une ligne les propose toutes les sept.
- Le fichier porte un numéro de `version`. Toute évolution du format passe par une fonction de migration dans `store.ts`.
- `verifierMajAuto` absent d'un fichier déjà écrit vaut `true`. `suspendreInactivite` absent vaut `true`. `afficherAstuces` absent vaut `true`. `astucesVues` absent vaut une liste vide. `notificationsAffichees` absent vaut 0. `veilleMotif` absent signifie que la suspension, s'il y en a une, est une veille manuelle. Une ancienne `reunionJusqua` est reprise dans `veilleJusqua` avec le motif `reunion`, sans changer le numéro de `version`. Le numéro de `version` reste 1 : ces champs s'ajoutent sans rendre illisibles les réglages existants. Une vérification qui trouve une version plus récente l'enregistre dans `derniereVersionVue`. Une vérification réussie qui n'en trouve pas retire cette version. Une erreur réseau ne modifie ni la date ni la version retenue.
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

Cette détection utilise uniquement la durée écoulée depuis la dernière action (`powerMonitor.getSystemIdleTime()`). Lèv ne lit jamais ce qui est tapé. Un microphone en cours d'utilisation n'est pas une pause spontanée : il ne remet pas les compteurs à zéro. Il retient seulement l'affichage, comme le plein écran (5.9).

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

| Réponse        | Effet                                                                                                                                                                                                                   | Message affiché 3 secondes                |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Je le fais     | Le rappel repart de zéro. Pour « bouger », tous les rappels sont suspendus 5 minutes                                                                                                                                    | « Chaque petite pause compte. »           |
| Dans 5 min     | La même notification revient dans 5 minutes. Sans limite de nombre                                                                                                                                                      | « D'accord, je reviens dans 5 minutes. »  |
| Plus tard      | Le rappel repart de zéro                                                                                                                                                                                                | « Pas de souci, on reprendra plus tard. » |
| Aucune réponse | La notification s'efface seule (20 secondes pour les yeux, 60 secondes pour les autres). Le rappel repart de zéro, sans message. Le délai est suspendu tant que la souris survole la notification ou qu'elle a le focus | Aucun                                     |

Trois notifications ne suivent pas cette dernière règle : la question de rythme (5.7), où l'absence de réponse ne change rien ; la fin de pause d'une séquence (5.8), qui reste affichée ; l'annonce de début de séquence (5.8), qui s'efface au bout de 8 secondes sans remettre de compteur à zéro.

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

Une séquence se lance à la main depuis le menu, ou depuis l'entrée du clic droit sur l'icône. Rythme par défaut : 25 minutes de travail, 5 minutes de pause, une grande pause de 15 minutes après 4 séquences. Les autres rythmes : « 50-10 » (50 et 10 minutes), « une pause par heure » (55 et 5 minutes), « autre » (travail de 10 à 120 minutes, pause de 1 à 30 minutes). La grande pause s'applique à tous.

Dès qu'une séquence démarre, une notification d'accompagnement s'affiche tout de suite. Titre : « Séquence de travail ». Trois lignes, espacées de 4 px : « Ta session de focus commence. », « Une seule tâche, un petit pas à la fois. », puis, un peu détachée et en `--texte-second`, « Lèv te rappellera de faire une pause dans {minutes} minutes. » {minutes} est la durée de travail réglée dans Mes rappels. Le pictogramme est celui de la marche (`bouger`), en `--action`. Elle n'a pas de bouton. Elle s'efface au bout de 8 secondes, et ce délai se fige tant que la souris la survole ou qu'elle a le focus. Un clic sur la carte, ou Échap, la ferme aussi. Ni le clic, ni Échap, ni l'effacement ne remettent un compteur à zéro, et aucun message ne suit.

1. Le menu ne propose les séquences que si la case « Séquences de travail » est cochée dans « Mes rappels ». Elle l'est par défaut.
2. Pendant le travail, le rappel « bouger » est suspendu : c'est la pause de fin de séquence qui invite à marcher. Les autres rappels continuent. Règle provisoire (section 16) : si la séquence dure plus de 30 minutes, une notification « bouger » est proposée une fois, au milieu.
3. À la fin de la séquence, la notification « fin de séquence » s'affiche avec les trois réponses habituelles. « Je le fais » lance la pause, « Dans 5 min » prolonge le travail de 5 minutes, « Plus tard » enchaîne la séquence suivante sans pause.
4. Son titre suit le rang de la séquence : « Première séquence bouclée », « Deuxième… », jusqu'à « Dixième… », puis « Séquence 11 bouclée ». La durée et l'heure de reprise de sa phrase sont calculées.
5. Après la dernière séquence de la série (la quatrième par défaut), la phrase devient « Place à une grande pause : 15 minutes, puis on reprend à 11h30. » Après la grande pause, le compte des séquences repart à 1.
6. À la fin de la pause, une notification discrète « On reprend quand tu veux. » propose « C'est reparti » et « Encore 5 min ». Elle reste affichée jusqu'à la réponse. Sans réponse au bout de 15 minutes, les séquences s'arrêtent d'elles-mêmes. Cet écran n'est pas maquetté : reprendre le gabarit des autres notifications.
7. « Arrêter la séquence de travail », dans le menu, le clic droit ou la notification de fin de séquence, ou la fermeture de Lèv, revient au fonctionnement normal.

### 5.9 Ne pas déranger et mise en veille

- **Mise en veille manuelle**, depuis le menu ou le clic droit : 30 minutes, ou jusqu'à demain (début des horaires du prochain jour travaillé).
- **Plein écran, présentation et appel**, si l'option est active : Electron n'a aucune fonction pour savoir ce que font les autres applications. `platform/win32.ts` appelle la fonction Windows `SHQueryUserNotificationState` (`shell32.dll`) au moyen de Koffi. Les états « application en plein écran » (`QUNS_BUSY`, `QUNS_RUNNING_D3D_FULL_SCREEN`) et « mode présentation » (`QUNS_PRESENTATION_MODE`) retiennent la notification. Une visioconférence en fenêtre est retenue aussi, lorsque le microphone est en cours d'utilisation : la même bibliothèque lit, en lecture seule, `LastUsedTimeStart` et `LastUsedTimeStop` sous `HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\microphone` et son sous-dossier `NonPackaged`. Le micro est occupé si la fin vaut 0 et le début est déjà inscrit. Aucun flux audio n'est ouvert, et le nom de l'application n'est pas conservé. La notification s'affiche à la sortie de cet état. Un appel sans microphone n'est pas détecté.
- Cet appel, plein écran comme registre, n'est fait qu'au moment où un rappel arrive à échéance, puis toutes les 15 secondes tant qu'il est retenu. Jamais de commande PowerShell en tâche de fond.
- **Mode « Ne pas déranger » de Windows** : il n'est pas signalé par cette fonction, et n'est lisible que par une interface non documentée de Windows, qui peut cesser de fonctionner à toute mise à jour. Il n'est pas pris en compte. L'étude technique du lot 3 dit si une solution fiable existe.
- En conséquence, l'option s'intitule « Ne pas me déranger en plein écran, en présentation ou pendant un appel ».
- **Mode « En réunion (1 h) »**, depuis le menu ou le clic droit : les rappels sont suspendus pendant une heure exacte. C'est la même suspension que la veille manuelle (`veilleJusqua`), avec `veilleMotif: 'reunion'` pour garder le libellé « En réunion jusqu'à 15h40 ». Une veille de 30 minutes ou jusqu'à demain remplace la réunion. Reprendre retire cette suspension, qu'elle vienne de la réunion ou de la veille. À la fin, ou dès que l'on reprend, les compteurs repartent de zéro : aucune carte accumulée ne s'affiche. L'icône est celle de la veille. L'infobulle dit « Lèv · en réunion jusqu'à 15h40 ».

### 5.10 Absence de 5 minutes

Si l'option est active (elle l'est par défaut) et que la session est ouverte, une inactivité d'au moins 5 minutes suspend le décompte des rappels récurrents. Aucune carte ne s'ouvre pendant cette absence : ni rappel récurrent, ni fin de séquence. Un rappel à heure fixe déjà dans sa fenêtre de 10 minutes est retenu.

Au premier retour sous ce seuil, les compteurs récurrents repartent de zéro, l'attente d'accalmie est oubliée, un report « Dans 5 min » échu pendant l'absence est abandonné, et un rappel à heure fixe tombé pendant l'absence est marqué pour la journée, sans s'afficher. L'heure de fin d'une séquence ne change pas. Si elle est échue au retour, une seule carte de séquence peut s'afficher.

Cette règle ne remplace pas le verrouillage de session (5.1), qui reste toujours actif, ni la pause spontanée de 3 minutes (5.2). La case se nomme « Suspendre les rappels quand je suis absent depuis 5 minutes ». La détection continue d'utiliser `powerMonitor.getSystemIdleTime()`, au passage habituel du moteur, sans sondage supplémentaire.

## 6. Icône de la zone de notification

Lèv vit dans la zone de notification de Windows, près de l'horloge, et reste silencieuse. L'icône a trois états de fonctionnement, plus un état de veille.

| État           | Quand                                 | Ce que l'on voit                                                                                                              |
| -------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Calme          | Par défaut                            | L'icône seule, immobile, sans chiffre ni couleur vive                                                                         |
| Bientôt        | 2 minutes avant une pause (voir 5.4)  | Une petite pastille jaune en haut à droite de l'icône. Elle remplace la bulle du logo, pour ne pas montrer deux points jaunes |
| Pause proposée | Tant qu'une notification est affichée | La pastille reste (même icône que « bientôt »), et la notification est visible en bas à droite                                |

- **En veille** : l'icône passe en gris (#7b7f8c), L et bulle en blanc.
- **Séquence de travail** : pendant le temps de travail, et seulement si Lèv n'est pas en veille, l'icône habituelle laisse la place à un carré de 16 px et de 32 px. Il porte les minutes restantes (`25`, `03`, `120`) ou `<1` sous une minute. Barre des tâches claire : texte `#2e2a3f` sur `#fdf1e7`. Barre sombre : texte `#f3e9e2` sur `#1c1a2b`. Le thème se lit dans `SystemUsesLightTheme`, seulement tant que ce chiffre est affiché. Si la clé manque, on suit le thème déjà résolu de l'application. Dès la pause de la séquence, l'arrêt, la reprise ou la veille, l'icône habituelle revient. Le dessin ne change qu'avec la minute ou le thème de la barre.
- **Infobulle** au survol, hors séquence de travail : « Lèv · prochaine pause à 10h40 », ou « Lèv · en veille jusqu'à 11h00 », sinon « Lèv ». Pendant une réunion, et devant les autres textes : « Lèv · en réunion jusqu'à 15h40 ». Pendant le travail : « Lèv - Séquence de travail : 18 min restantes (2/4) ». Pendant la pause courte : « Lèv - Pause de séquence : 4 min restantes ». Pendant la grande pause : « Lèv - Grande pause : 15 min restantes ». Sous une minute, le texte dit « moins d'une minute ». La reprise (« On reprend quand tu veux. ») reprend l'infobulle habituelle.
- **Clic gauche** : ouvre le menu (section 7.2). **Clic droit** : menu système natif, texte seul, sans icône. Dans l'ordre : si les séquences de travail sont activées, « Démarrer une séquence de travail », ou « Arrêter la séquence de travail » lorsqu'une série est en cours ; « Faire une pause maintenant » (la notification « bouger », tout de suite) ; « En réunion (1 h) », remplacé par « Reprendre · en réunion jusqu'à 15h40 » lorsqu'une réunion est en cours ; « Mettre en veille », avec le sous-menu « 30 min » et « Jusqu'à demain », remplacé par « Reprendre les rappels » lorsqu'une veille manuelle est en cours ; pendant une réunion, ce sous-menu reste disponible et remplace la réunion ; un séparateur ; « Mes rappels » (fenêtre Application) ; « À propos » (écran « À propos ») ; un séparateur ; « Quitter ».
- Les icônes sont des fichiers `.ico` contenant les tailles 16, 20, 24, 32 et 48 px. Les quatre fichiers sont déjà fournis : tray-calme.ico, tray-bientot.ico, tray-veille.ico, et lev.ico pour l'application (jusqu'à 256 px). À 16 et 24 px, on utilise le dessin simplifié du logo (section 9).
- Aucun clignotement, aucune animation de l'icône dans la barre des tâches.

## 7. Écrans

L'application compte sept écrans ou familles d'écrans. Chacun correspond à une planche du canevas de maquettes, nommée entre parenthèses.

### 7.1 Premier lancement (planche « Premier lancement »)

Affiché dans la fenêtre « Application », au premier lancement, puis à la demande depuis « À propos » (section 7.5). Le fichier de réglages n'est écrit qu'au premier passage.

- Le contenu tient dans une carte centrée dans la fenêtre (460 px au plus, fond `--carte`, bordure `--lisere`, rayon 12 px, marge interne 14 px sur 18 px, ombre douce). Logo de 44 px. L'animation ne démarre qu'une fois la fenêtre visible, puis attend 250 ms. Le L se redresse et le point doré s'élève avec un léger rebond, une seule fois, sur 1,8 s. Un clic sur le logo rejoue ce geste. Si les animations sont réduites, il reste immobile. Puis le texte exact : « Bienvenue dans Lèv. » en 22 px, « Je te rappellerai doucement de bouger et de reposer tes yeux. » et « Tu choisis le rythme, et tu peux changer d'avis à tout moment. » en 14 px.
- Entre cette dernière phrase et le bouton « Commencer », une grille de deux colonnes présente quatre micro-cartes, dans cet ordre, de même hauteur sur chaque ligne (`grid-auto-rows: 1fr`, `align-items: stretch`). Chaque micro-carte a un fond `--surface-douce`, une bordure fine `--separateur`, un rayon de 12 px et une marge interne de 8 px sur 10 px. L'écart de la grille est de 8 px. L'icône SVG, en trait fin et en `--action`, est centrée dans une pastille ronde de 28 px au fond `color-mix(in srgb, var(--action) 12%, transparent)`, avec un fin liseré intérieur `color-mix(in srgb, var(--action) 32%, transparent)` pour qu'elle reste lisible sur `--surface-douce` ; le dessin mesure 16 px. Le titre est en 13 px, la phrase en 12,5 px (interligne 1,35, couleur `--texte-second`), sur deux lignes au plus :
  1. « Pauses actives » : « Rappels doux pour bouger, boire et reposer tes yeux. »
  2. « Séquences de travail » : « Alterne concentration et pauses régulières à ton rythme. »
  3. « Respiration guidée » : « Exercices simples pour relâcher la pression en pause. »
  4. « Installation et confort » : « Repères pour bien régler ton poste de travail »
- La scène centre la carte dans une colonne avec `justify-content: safe center`. La hauteur du contenu, mentions comprises, reste inférieure à 510 px : dans la fenêtre de 520 × 580 px, en thème clair comme en thème sombre, et avec une mise à l'échelle Windows à 125 %, aucun texte n'est coupé et aucune barre de défilement n'apparaît.
- Bouton principal « Commencer », largeur contenue (au moins 200 px, 38 px de haut). Au premier lancement, il ferme la fenêtre, enregistre `premierLancementFait`, et Lèv démarre avec les rappels par défaut. Quand l'écran a été rouvert, il ramène à « Mes rappels » sans réécrire `reglages.json`.
- Lien discret « Choisir mon rythme », juste sous le bouton : ouvre « Mes rappels ». Au premier lancement, ce lien enregistre aussi `premierLancementFait`. Quand l'écran a été rouvert, il n'écrit rien.
- En bas de la carte, séparées par un trait fin, trois mentions cochées en 13 px : « Aucun compte », « Aucune inscription », « Aucune donnée personnelle ».
- Aucun tutoriel, aucune étape suivante.

### 7.2 Menu (planches « Menu » et « Menu, thème sombre »)

De haut en bas :

1. En-tête : logo, « Lèv », « Une pause, naturellement. »
2. Carte « Tes prochaines pauses » : les deux prochaines échéances, sous la forme « Cligner des yeux à 10h20 ». Le cas échéant, la ligne « Tu t'es levé à 10h10 : j'ai décalé la marche. »
3. Bouton principal « Démarrer une séquence de travail », affiché seulement si la case « Séquences de travail » est cochée dans « Mes rappels ». Sinon, « Faire une pause maintenant » devient le bouton principal. Pendant une séquence, il devient « Arrêter la séquence de travail ». La carte affiche « Séquence en cours · 18 min restantes », « Pause de séquence · 4 min restantes » ou « Grande pause · 15 min restantes ». À la reprise : « On reprend quand tu veux. » Juste sous « Démarrer une séquence de travail », lorsqu'aucune séquence n'est en cours, une légende centrée en 12 px rappelle le rythme actif : « {travail} min concentré, puis {pause} min de pause ». Les boutons du menu mesurent 34 px de haut, en 13,5 px.
4. Bouton secondaire « Faire une pause maintenant » : affiche tout de suite la notification « bouger ».
5. Bouton secondaire « En réunion (1 h) ». Pendant la réunion, le même bouton devient « Reprendre · en réunion jusqu'à 15h40 ».
6. « Mettre les rappels en veille », puis sur une seule ligne deux pastilles : « 30 min », « Jusqu'à demain ». En veille manuelle, ce bloc est remplacé par « En veille jusqu'à 11h00 » et un bouton « Reprendre ». Pendant une réunion, les deux pastilles restent : elles remplacent la réunion.
7. Liens : « Une pause par le souffle », « Bien installer mon poste », « Mes rappels », « À propos », « Quitter ». Ils mesurent 28 px de haut, en 13,5 px. Les quatre premiers ouvrent la fenêtre Application sur l'écran du même nom. Quand une version plus récente a été constatée et que la vérification automatique est cochée, un point de 8 px (`--espace-8`) en `--action` se place à côté d'« À propos ». Le libellé lu par un lecteur d'écran devient « À propos, une mise à jour est disponible ». Le menu du clic droit ne porte pas ce point.

### 7.3 Notifications

Toutes partagent le même gabarit : une carte en bas à droite, un pictogramme dans une pastille, un titre, une phrase, puis les boutons. L'annonce de début de séquence n'a pas de boutons. Planches : « Rappel cligner des yeux », « Rappel bouger » (clair et sombre), « Point posture », « Fin d'une séquence de travail », « Rappel qui s'adapte ».

| Notification                 | Titre                        | Phrase                                                                                                                           | Boutons                                                                            |
| ---------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Yeux                         | Tes yeux méritent une pause. | Cligne lentement et complètement des yeux plusieurs fois, puis ferme-les doucement quelques secondes. Regarde un point au loin (par la fenêtre ou à environ 6 m) pendant 20 secondes. | Les trois réponses                                                                 |
| Bouger                       | Envie d'un petit mouvement ? | Quelques pas suffisent, à ton rythme.                                                                                            | Les trois réponses                                                                 |
| Bouger, variante assise      | Un moment pour te détendre ? | Quelques gestes discrets, à ta place.                                                                                            | Les trois réponses                                                                 |
| Posture                      | Un petit point posture ?     | Relâche les épaules, pose les pieds à plat et laisse ton dos retrouver le dossier.                                               | Les trois réponses + lien « Bien installer mon poste »                             |
| Rappel libre ou à heure fixe | Le nom du rappel             | C'est le moment.                                                                                                                 | Les trois réponses                                                                 |
| Début de séquence            | Séquence de travail          | Ta session de focus commence. / Une seule tâche, un petit pas à la fois. / Lèv te rappellera de faire une pause dans 25 minutes. | Aucun : un clic ou Échap ferme la carte, sinon elle s'efface au bout de 8 secondes |
| Fin de séquence              | Deuxième séquence bouclée    | Un moment pour te détendre ? 5 minutes, puis on reprend à 10h50.                                                                 | Les trois réponses + « Arrêter la séquence de travail »                            |
| Fin de pause                 | On reprend quand tu veux.    | (aucune)                                                                                                                         | « C'est reparti », « Encore 5 min »                                                |
| Rythme                       | Ce rythme te convient ?      | Je peux te proposer « Marcher 5 minutes » toutes les 45 minutes, plutôt que toutes les 30.                                       | « Oui, toutes les 45 min », « Garder ce rythme »                                   |

Particularités :

- **Bouger** contient un encadré avec une idée tirée au hasard, affichée directement, un bouton « Une autre idée » et un bouton « Je reste assis » (qui devient « Finalement, je me lève »). Si l'option « mouvements assis » est cochée, la variante assise s'affiche d'emblée. Une même idée ne revient pas deux fois de suite. Un bouton secondaire « Faire la pause (30 s) » se place au-dessus des trois réponses. Il gèle l'effacement automatique, retire les boutons du conseil et les trois réponses, et affiche un anneau SVG au-dessus du conseil. L'anneau et le texte « 30 s », puis « 29 s », durent 30 secondes. Le trait avance en continu. Si les animations sont réduites, le trait et le texte sautent chaque seconde, sans transition. À zéro, l'effet est celui de « Je le fais », sans le message de 3 secondes, puis la carte disparaît en fondu et la fenêtre est détruite. Échap pendant le guide vaut « Plus tard ».
- **Début de séquence** reprend le gabarit, sans boutons, avec le pictogramme de la marche. Les trois lignes sont espacées de 4 px ; la troisième, en `--texte-second`, est un peu plus détachée. Le nombre de minutes est celui du travail réglé (25 dans l'exemple du tableau). Le survol ou le focus fige les 8 secondes, comme pour les autres notifications.
- **Fin de séquence** affiche la ligne de parcours : un tracé courbe avec un point par séquence, les séquences faites en turquoise, la grande pause en jaune.
- Après une réponse, la carte affiche le message de la section 5.5 pendant 3 secondes, puis disparaît en fondu.
- La notification n'a pas de bouton de fermeture : « Plus tard » en tient lieu. La touche Échap vaut « Plus tard » quand la notification a le focus.
- **Astuce d'utilisation.** Certaines cartes de rappel se terminent par une phrase courte, sous un filet (`--separateur`), en 12,5 px, couleur `--texte-second`, interligne 1,35. Elle ne s'affiche pas sur l'annonce de séquence, la fin de séquence, la fin de pause, ni la question de rythme. Les deux premiers rappels après l'installation n'en ont pas. Ensuite, un rappel sur quatre en porte une qui n'a pas encore été vue : le 6e, le 10e, le 14e, et ainsi de suite. « Dans 5 min » compte comme un rappel de plus. Changer d'idée ou passer à la variante assise, sur la même carte, ne compte pas. Quand les six astuces ont été vues, plus aucune n'apparaît. La case « Me montrer parfois une courte astuce d'utilisation », dans Autres réglages, est cochée par défaut : si on la décoche, le compteur avance toujours et aucune astuce n'est affichée. Quand l'astuce ouvre un écran, un lien est posé dessous : « Ouvrir les réglages », « Essayer la respiration » ou « Voir le guide ». Le clic ouvre la fenêtre Application sur cet écran et laisse la notification en place. Les phrases sont dans `content/astuces.fr.json` (section 10.6).

### 7.4 Mes rappels (planche « Mes rappels »)

L'écran de réglage unique. Le contenu occupe toute la largeur de la fenêtre. Sous le titre, une phrase en 12,5 px, couleur `--texte-second` : « Personnalise tes pauses actives pour bouger et reposer tes yeux. » Sous la carte des rappels, trois accordéons fermés, espacés de 6 px : « Mes horaires », « Ajouter un rappel », « Autres réglages ». À la taille par défaut, l'écran tient sans défilement.

**La liste.** Une ligne par rappel :

- une case pour l'activer, suivie du nom ;
- pour un rappel récurrent, une liste déroulante de fréquence (10, 20, 30, 45 minutes, 1 heure, 2 heures, 4 heures) ;
- pour un rappel à heure fixe, un champ d'heure et une liste (« Chaque jour », « Du lundi au vendredi », « Une seule fois ») ;
- une corbeille, seulement pour un rappel créé par la personne (`origine` « perso »). Les quatre rappels de base, y compris « Boire un verre d'eau », n'en ont pas. Le bouton est compact, dans une colonne fixe au bord droit, pour que les listes déroulantes restent alignées entre elles. Il retire le rappel immédiatement. Un bandeau « « Nom » est retiré. » avec « Annuler » reste affiché jusqu'à l'action suivante. Aucune fenêtre de confirmation.

La dernière ligne, « Séquences de travail », cochée par défaut et sans corbeille, a sa propre liste : « 25 minutes, puis 5 de pause », « 50 minutes, puis 10 de pause », « Une pause de 5 minutes par heure », « Autre rythme ». « Autre rythme » révèle deux champs en minutes (travail, pause). Dans la ligne, juste sous l'intitulé et sans trait entre les deux, une accroche en 12,5 px, couleur `--texte-second` : « Alterne des temps de concentration et des pauses courtes pour garder le cap sans t'épuiser. » Pendant un décompte, cette accroche laisse la place à la même phrase que le menu (« Séquence en cours · 18 min restantes », « Pause de séquence · 4 min restantes » ou « Grande pause · 15 min restantes »). Puis la précision en 13 px : « Pour travailler concentré par étapes : Lèv attend la fin de la séquence pour t'inviter à marcher, et propose une grande pause de 15 minutes toutes les 4 séquences. »

**Mes horaires**, accordéon fermé par défaut, même gabarit que « Autres réglages ». Fermé, le titre est suivi du réglage en 12,5 px, par exemple « Mes horaires · 08:00 – 18:00 ». Ouvert : « De \[08:00\] à \[18:00\] \[du lundi au vendredi\] » (autres choix : « du lundi au samedi », « tous les jours »), puis « En dehors de ces horaires, seuls tes rappels à heure fixe s'affichent. »

**Ajouter un rappel**, accordéon fermé par défaut, même gabarit. Ouvert, deux questions :

1. « Quoi ? », aligné à gauche : un champ texte sur toute la largeur de la carte, 40 caractères au plus (exemple affiché : « Par exemple : m'étirer »), puis quatre pastilles qui remplissent le champ : « M'étirer », « Respirer profondément », « Me redresser », « Travailler debout ».
2. « Quand ? », aligné à gauche, sans le cadre natif du groupe : un sélecteur segmenté compact, « Régulièrement » (sélectionné par défaut) et « À une heure précise », puis les pastilles sur une ligne.
   - Régulièrement : cinq pastilles, « 20 min », « 30 min », « 1 heure » (par défaut), « 2 heures », « 4 heures ».
   - À une heure précise : un champ d'heure (15:00 par défaut) et trois pastilles, « Chaque jour » (par défaut), « Du lundi au vendredi », « Une seule fois ».

Une phrase se met à jour en direct : « Lèv te rappellera « M'étirer » toutes les heures. » ou « … à 15h00, chaque jour. » Sans nom saisi, elle indique « Donne un nom à ton rappel pour l'ajouter. » et le bouton « Ajouter le rappel » est inactif. La touche Entrée dans le champ ajoute le rappel. Après l'ajout, le rappel apparaît en fin de liste et le champ se vide.

**Autres réglages**, bloc replié par défaut. Fermé, il fait environ 40 px de haut : pas de marge interne sur le bloc, `9 px` sur `14 px` sur le titre, en 14 px, rayon de 8 px. Ouvert, le contenu a une marge de `4 px 14 px 12 px`. Le titre a un chevron à droite qui pivote de 0° à 180° à l'ouverture, et un survol en pointeur :

- **Thème**, groupe `fieldset` dont la légende est « Thème » (14 px, graisse forte, comme les autres questions). Les trois options « Automatique, comme mon ordinateur », « Clair » et « Sombre » sont des pastilles radio. Elles se partagent la largeur utile, restent sur une ligne tant que leur texte tient, et la pastille qui ne tient plus passe entière à la ligne. Si une pastille atteint la largeur du bloc, son texte passe à la ligne sans être coupé. Écart de 6 px. Au repos : bordure `--action`, fond `--carte`, texte `--action`, hauteur minimale 34 px. Choisie : fond `--action`, texte `--sur-action`, graisse forte. Le focus clavier dessine le contour `--contour-focus` autour de la pastille. Les couleurs viennent des jetons, au clair comme au sombre.
- Trois sous-sections, chacune un `fieldset` avec une légende discrète en 12,5 px (`--legende`), couleur `--texte-second`. Les cases d'une même sous-section sont espacées de 6 px. Un filet `--separateur` précède chaque sous-section, avec 12 px au-dessus du filet et 12 px en dessous :
  1. « Respect de mon activité » : « Attendre que j'aie fini de taper pour afficher un rappel », « Tenir compte des pauses que je prends de moi-même », « Suspendre les rappels quand je suis absent depuis 5 minutes », « Ne pas me déranger en plein écran, en présentation ou pendant un appel ».
  2. « Rappels et conseils » : « Préférer des mouvements discrets, à faire assis », « Jouer un son doux avec chaque rappel », « Me proposer d'espacer un rappel quand son rythme ne me convient pas », « Me montrer parfois une courte astuce d'utilisation ».
  3. « Application et système » : « Lancer Lèv au démarrage de l'ordinateur », « Vérifier automatiquement les mises à jour (1 fois par semaine) ».

Sous ces cases, un bouton discret « Rétablir les rappels d'origine » remet les quatre rappels de base à leurs valeurs de départ. Il agit tout de suite et affiche un bandeau « Rappels d'origine rétablis. » avec « Annuler ». Ce bouton n'est pas maquetté.

En bas de page, un lien « À propos ».

### 7.5 À propos (planche « À propos »)

Une page de lecture. En haut, un lien discret « ← Mes rappels », puis l'en-tête toujours visible. Les quatre blocs suivants sont des tiroirs fermés par défaut, espacés de 6 px, avec le même chevron et le même gabarit fin que « Autres réglages ». Les textes exacts sont en section 10.5.

1. En-tête : le titre de page (`h1`, 22 px, chasse −0,01 em, graisse forte, centré) est « Lèv - une pause, naturellement. », en `--signature`, puis la phrase de présentation. En thème clair, `--signature` est le rose du cœur approfondi (`#9a524e`) pour rester lisible sur le fond pêche. En thème sombre, c'est `--coeur` (`#c98480`).
2. « Philosophie » : sept principes courts.
3. « Les repères » : se lever toutes les 30 minutes, marcher 5 minutes, quitter l'écran des yeux. Lien vers « Bien installer mon poste ».
4. « Textes de référence » : sept liens (section 10.3), ouverts dans le navigateur par défaut.
5. « Fait avec cœur à La Réunion par Ekilib.re » : le résumé aligne « Fait avec », un cœur plein de 15 px en `--coeur` (`#c98480`), puis « à La Réunion par Ekilib.re ». Le cœur est ignoré par les lecteurs d'écran ; l'intitulé lu est la phrase complète, avec le mot « cœur ». Il tient sur une ligne dans la fenêtre de 520 px et passe à la ligne sans couvrir le chevron si la largeur baisse. Le tiroir ouvert est une seule carte, fond `--carte` et bordure `--lisere`, du résumé jusqu'au bas du contenu. Trois pastilles : « 100 % gratuit », « Open source (licence MIT) », « Association Ekilib.re ». Puis « Lèv est développée bénévolement par Ekilib.re, Maison Sport-Santé au Tampon, à La Réunion. Chaque pas compte. ». Un encart `--surface-douce` explique le rôle des Maisons Sport-Santé et porte le lien vers la carte. Une rangée aligne « Découvrir Ekilib.re » et « Code source sur GitHub », puis le bouton centré « Vérifier les mises à jour » (section 10.5).

Sous les tiroirs, seul un bouton discret « Revoir l'écran de bienvenue » rouvre l'écran d'accueil sans modifier `reglages.json` (section 7.1).

La page se termine par un filet (`--separateur`), puis une ligne en 12,5 px, couleur `--texte-second` : « Lèv v{version} · Propulsé par Electron {electron} et Chromium {chrome} ». `{version}` vient de `app.getVersion()`. `{electron}` et `{chrome}` viennent de `process.versions`. Aucun appel réseau, aucun outil de build.

### 7.6 Bien installer mon poste (planche du même nom)

En haut, un lien discret « ← Mes rappels », puis le titre et la phrase en 12,5 px, couleur `--texte-second` : « Quelques repères simples pour ajuster ton écran, ton siège et ta posture. » Cinq cartes à cocher, numérotées « Étape 1 sur 5 » à « Étape 5 sur 5 », dont l'état est mémorisé. Les textes sont en section 10.2. Suivent un encadré « Et surtout, change souvent de position », avec la phrase « Même bien installé, la meilleure posture reste celle dont on bouge régulièrement. », les boutons « C'est tout bon » et « Je finirai plus tard » (les deux ferment la fenêtre, ou reviennent à l'écran précédent si le guide a été ouvert depuis celui-ci), puis la mention de source et, dans le même bloc compact, la vidéo de l'INRS (section 10.2). La fenêtre reste de 520 × 580 px.

### 7.7 Respiration guidée (planche du même nom)

- En haut, un lien discret « ← Mes rappels », puis la carte de la séance : le titre « Un moment pour souffler », la phrase en 12,5 px, couleur `--texte-second` : « Prends deux minutes pour ralentir ta respiration et relâcher la pression. », la bulle jaune dans un cadre de 116 px (cercle en pointillés à l'amplitude maximale, halo doux), la consigne du temps en cours en 16 px, quatre étiquettes sur une seule ligne (« Inspire », « Garde », « Souffle », « Pause ») dont une est mise en avant, et le bouton « Respire », largeur contenue, qui devient « J'ai terminé ». Marge interne de la carte : 10 px sur 14 px. Entre le titre, l'accroche, la bulle, la consigne, les étiquettes et le bouton : 6 px. Entre la carte, les deux accordéons et l'encart : 6 px. Accordéons fermés, le lien de retour, la carte, les deux accordéons et l'encart tiennent dans la fenêtre de 520 × 580 px : aucun défilement. La bulle reste de 116 px.
- La bulle grandit pendant l'inspiration, reste pleine pendant la pause, rétrécit pendant l'expiration, reste petite pendant la seconde pause. Le changement de taille dure exactement le temps réglé.
- Consignes : « Inspire par le nez », « Garde l'air, sans forcer », « Souffle doucement », « Reste tranquille ». Au repos : « Prêt quand tu veux ». À la fin : « Chaque petite pause compte. »
- Sous la séance, deux accordéons fermés, du même gabarit fin que « Mes rappels ». « Mon rythme » affiche le rythme actif à droite, par exemple « Mon rythme · Carrée (4-4-4-4) », ou « Mon rythme · 4s - 6s » quand les pauses sont à 0 et qu'aucun préréglage ne correspond. Ouvert : trois rythmes tout prêts sur une seule ligne, « Carrée » (4-4-4-4), « Apaisante » (4-0-6-0), « Régulière » (5-0-5-0), puis quatre réglages, chacun sur une seule ligne, avec boutons − et + de 30 px : « Inspiration » et « Expiration » de 2 à 10 secondes, « Pause, poumons pleins » et « Pause, poumons vides » de 0 à 10 secondes. Une pause à 0 disparaît du cycle et affiche « Aucune ». Tout en bas : « Lèv retient ton rythme pour la prochaine fois. »
- « Durée », second accordéon, affiche la durée active, par exemple « Durée · 1 min ». Ouvert : trois pastilles sur une seule ligne, « 1 min », « 3 min », « 5 min ». La séance se termine à la fin du cycle en cours.
- Les réglages sont mémorisés. Une modification pendant la séance s'applique au temps suivant.
- En bas, un encart : fond `--surface-douce`, bordure `--lisere`, filet gauche `--action`, icône d'onde en 18 px, marge interne de 8 px sur 12 px, texte en 12 px, interligne 1,35. Première ligne : « Pour t'aider, inspire par le nez en laissant ton ventre se gonfler, puis expire doucement en le laissant rentrer. » Seconde ligne : « Si tu ressens une gêne, pas de pression : reviens simplement à ta respiration naturelle. »

## 8. Textes et ton

Lèv parle comme un compagnon bienveillant, jamais comme un coach exigeant. Cette règle vaut pour chaque libellé, y compris les messages d'erreur.

### Règles d'écriture

1. Tutoiement partout. Phrases courtes, mots simples.
2. Une invitation ou une question, jamais un ordre ni une alerte.
3. Aucun libellé ne constate un manque, un retard ou un échec. Aucun chiffre sur ce qui n'a pas été fait.
4. Le bouton principal d'une proposition de pause est toujours « Je le fais ». Sur le rappel « bouger », un second bouton « Faire la pause (30 s) » peut lancer le guide de la section 7.3. Les mots « OK », « Ignorer », « Fermer », « Annuler la pause » sont interdits sur une notification.
5. Les heures s'écrivent « 10h40 ». Les durées s'écrivent en chiffres (« 5 minutes »), et en abrégé sur les boutons (« Dans 5 min »).
6. Un message d'erreur dit ce qui s'est passé et quoi faire, sans code ni terme technique.
7. Aucun titre en majuscules, aucun point d'exclamation, aucun émoji.

### Exemples de référence

| À éviter                     | À privilégier                             |
| ---------------------------- | ----------------------------------------- |
| « Vous devez bouger ! »      | « Envie d'un petit mouvement ? »          |
| « Alerte sédentarité »       | « Un moment pour te détendre ? »          |
| « Vos yeux sont fatigués »   | « Tes yeux méritent une pause. »          |
| « Échec : pause manquée »    | « Pas de souci, on reprendra plus tard. » |
| « Atteignez votre objectif » | « Chaque petite pause compte. »           |

### Organisation des textes

- Tous les libellés sont dans `content/fr.json`, avec des clés parlantes (`notification.yeux.titre`).
- Les textes exacts sont ceux des sections 5.5, 5.8, 7 et 10. Les maquettes ne font référence que pour la mise en page.
- La structure doit permettre d'ajouter une langue plus tard sans toucher au code. Seul le français est livré en v1.
- Tout nouveau texte écrit pendant le développement respecte ces règles et est signalé pour relecture.

## 9. Design

L'ambiance visée est celle d'un lever de soleil : fluide, respirante, douce. Les valeurs ci-dessous sont celles des maquettes validées. Elles sont à déclarer une seule fois, en variables CSS, et à ne jamais réécrire en dur dans un composant.

### Couleurs

| Jeton             | Thème clair                                               | Thème sombre                                              | Usage                                                                                 |
| ----------------- | --------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `--fond`          | Dégradé vertical `#fdf1e7` → `#f9e6e4` (55 %) → `#ece6f3` | Dégradé vertical `#1c1a2b` → `#2a2238` (60 %) → `#3a2a3c` | Fond des fenêtres et des notifications                                                |
| `--carte`         | `rgba(255,255,255,0.62)`                                  | `rgba(255,255,255,0.06)`                                  | Cartes, champs, boutons secondaires                                                   |
| `--lisere`        | `rgba(255,255,255,0.7)`                                   | `rgba(255,255,255,0.08)`                                  | Bordure des cartes                                                                    |
| `--separateur`    | `rgba(46,42,63,0.08)`                                     | `rgba(255,255,255,0.08)`                                  | Traits entre les lignes                                                               |
| `--texte`         | `#2e2a3f`                                                 | `#f3e9e2`                                                 | Texte principal                                                                       |
| `--texte-second`  | `#5f5a73`                                                 | `#b3aec4`                                                 | Précisions, légendes, bordure des champs                                              |
| `--action`        | `#0e6f6a`                                                 | `#5fcfc6`                                                 | Boutons, liens, cases cochées                                                         |
| `--action-survol` | `#0a5551`                                                 | `#84ded6`                                                 | Survol et appui                                                                       |
| `--sur-action`    | `#ffffff`                                                 | `#1c1a2b`                                                 | Texte posé sur `--action`                                                             |
| `--fond-picto`    | `#fde3d2`                                                 | `#3a2f3f`                                                 | Fond des pictogrammes                                                                 |
| `--surface-douce` | `rgba(45,106,99,0.06)`                                    | `rgba(95,207,198,0.12)`                                   | Encart de conseil de la respiration                                                   |
| `--soleil`        | `#f1be5a`                                                 | `#f1be5a`                                                 | Bulle du logo, pastille « bientôt », grande pause. Jamais de texte dans cette couleur |
| `--coeur`         | `#c98480`                                                 | `#c98480`                                                 | Cœur du résumé « Fait avec … à La Réunion » (section 7.5). Rose doux tiré du fond. Jamais de texte dans cette couleur |
| `--signature`     | `#9a524e`                                                 | `#c98480` (`--coeur`)                                     | Signature « Lèv - une pause, naturellement. » Même rose que le cœur, approfondi en thème clair |
| `--trace`         | `#f0d9cc`                                                 | `#3a3650`                                                 | Partie non parcourue d'une ligne de parcours                                          |

Le turquoise `--action` et le jaune `--soleil` viennent du logotype Ekilib.re. Le thème « automatique » suit le réglage clair ou sombre de Windows et change sans redémarrage.

### Typographie

- Une seule police : Atkinson Hyperlegible, graisses 400 et 700. Elle est embarquée dans l'application (licence libre OFL), jamais chargée depuis Internet. Les titres de section demandent la graisse 600 : sans fichier intermédiaire, ils s'affichent avec la graisse 700.
- Échelle : 22 px (titre de page, chasse −0,01 em), 17 px (titre de notification), 16 px (consigne de respiration), 15,5 px (titre de section), 14 px (texte courant, libellés, listes, boutons, titre d'accordéon, corps de la notification, interligne 1,5), 13,5 px (boutons et liens du menu), 13 px (mentions d'accueil, précision des séquences, étiquettes et pastilles de respiration), 12,5 px (légendes, textes secondaires), 12 px (légende de rythme dans le menu, phrase « Lèv retient ton rythme », les deux lignes de l'encart de conseil, interligne 1,35).
- Le texte courant est en 14 px. Le 12,5 px est réservé aux légendes et aux textes secondaires. Le 13 px est réservé aux mentions discrètes listées ci-dessus.

### Formes et espaces

- Cartes, accueil et séance de respiration : rayon de 12 px. Les accordéons ont un rayon de 8 px. Boutons, champs et pastilles : rayon complet (forme de pilule).
- Boutons, champs et listes mesurent au moins 38 px de haut, avec un padding horizontal de 14 px. Les pastilles de suggestion et de fréquence mesurent 34 px, comme les boutons du menu. Les lignes de liens du menu mesurent 28 px. Le bouton « Commencer » de l'accueil mesure 38 px. Les boutons − et + de la respiration mesurent 30 px.
- Espacements : 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 32 px. Dans la fenêtre Application, une seule marge de page de 12 px sur 14 px, sans marge cumulée sur `html`, `body` ou `#racine`. L'espace vertical entre les blocs, et entre le lien de retour, le titre et l'introduction, est de 6 px. Marge interne d'une carte : 14 px sur 18 px. La carte de la séance de respiration fait exception : 10 px sur 14 px, et 6 px entre le titre, la bulle, la consigne, les étiquettes et le bouton. Le cadre de la bulle mesure 116 px. L'encart de conseil a une marge interne de 8 px sur 12 px. Marge interne d'une notification : 20 px.
- Ombre sous les notifications, le menu et la carte d'accueil : `0 6px 24px rgba(46,42,63,0.10)`. La bulle de respiration a un halo `0 0 28px rgba(233,196,106,0.35)`.
- Trois niveaux de bouton : principal (fond `--action`), secondaire (bordure `--action`, fond `--carte`), discret (texte `--texte-second`, sans bordure).

### Logo

Un L arrondi qui se redresse, surmonté d'une bulle qui évoque l'accent, la tête et le souffle. Deux dessins : le dessin normal, et un dessin simplifié pour 16 et 24 px.

```svg
<!-- Dessin normal -->
<svg viewBox="2.4 -1.3 24 24" fill="none">
  <path d="M9.6 8 Q8.4 12.5 9 15.2 Q9.6 18 12.6 18 H20.4" fill="none"
        stroke="#0e6f6a" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="11.4" cy="3.7" r="1.9" fill="#f1be5a"/>
</svg>

<!-- Dessin simplifié, 16 et 24 px -->
<svg viewBox="3 -1.45 24 24" fill="none">
  <path d="M9.5 8.5 V14.5 Q9.5 18 13 18 H20.5" fill="none"
        stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="11" cy="3.6" r="2.5" fill="#f1be5a"/>
</svg>
```

- Icône de l'application : carré aux angles arrondis (rayon de 24 % du côté), fond `#0e6f6a`, L blanc, bulle `#f1be5a`.
- Logotype : le L dessiné, suivi de « èv » en Atkinson Hyperlegible 700, couleur `#0e6f6a`.
- Variante une couleur : L et bulle dans la couleur du texte.

### Mouvement

- Une notification apparaît et disparaît en fondu de 200 ms, sans glissement.
- Chaque notification porte un petit logo Lèv dans son coin supérieur droit. À l'apparition, sa bulle monte doucement une seule fois, sur 3,2 secondes. Sur l'écran de bienvenue, une fois la fenêtre visible et après 250 ms, le L du logo de 44 px se redresse et le point doré s'élève avec un léger rebond, une seule fois sur 1,8 s. Un clic rejoue le geste (section 7.1). L'icône de la zone de notification, elle, ne bouge jamais. Ce petit logo n'est pas maquetté (section 16).
- Dans la respiration guidée, la bulle change de taille entre 55 % et 100 %, sur la durée exacte du temps en cours.
- Si Windows est réglé pour limiter les animations, tout est figé : la bulle de respiration change de taille sans transition. L'anneau de 30 secondes (section 7.3) avance alors par paliers d'une seconde, sans transition.
- Aucun défilement automatique. Le seul compte à rebours est cet anneau.

## 10. Contenus

Les contenus sont séparés du code, dans des fichiers JSON que l'équipe d'Ekilib.re peut relire et modifier sans développeur.

### 10.1 Idées de mouvement (`content/idees.fr.json`)

Deux listes : `debout` et `assis`. Chaque idée est une phrase de 160 caractères au plus, faisable au bureau sans matériel ni tenue particulière.

Les six idées ci-dessous sont des exemples provisoires. Elles doivent être relues ou réécrites par les enseignants en APA avant diffusion. Objectif pour la v1 : au moins 15 idées par liste.

| Liste  | Idée provisoire                                                                                                            |
| ------ | -------------------------------------------------------------------------------------------------------------------------- |
| debout | Va remplir ta gourde en passant par le chemin le plus long, ou monte un étage à pied.                                      |
| debout | Marche jusqu'à une fenêtre, regarde au loin, puis roule doucement les épaules vers l'arrière, cinq fois.                   |
| debout | Fais le tour de l'étage à ton rythme, en laissant les bras se balancer.                                                    |
| assis  | Sans te lever : décolle les talons, puis les pointes de pieds, dix fois. Laisse ensuite rouler les épaules vers l'arrière. |
| assis  | Sans te lever : redresse-toi, puis tourne lentement la tête à droite et à gauche, cinq fois, sans forcer.                  |
| assis  | Sans te lever : tends une jambe devant toi, tiens trois respirations, puis change de côté.                                 |

### 10.2 Guide du poste (`content/guide.fr.json`)

| Étape | Titre                       | Texte                                                                                                                                                          |
| ----- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | L'écran                     | Place-le bien en face de toi, entre 50 et 70 cm, le bord supérieur au niveau des yeux ou légèrement en dessous : cela limite aussi l'assèchement des yeux. Tourne-le de côté par rapport à la fenêtre pour éviter les reflets, et écarte un souffle direct (climatisation, ventilateur) du visage. |
| 2     | Le siège                    | Assieds-toi au fond du siège, le dos en contact avec le dossier. Tes pieds reposent à plat sur le sol, ou sur un repose-pieds.                                 |
| 3     | Le clavier et la souris     | Laisse 10 à 15 cm entre le bord du bureau et le clavier pour poser tes avant-bras. Garde la souris tout près du clavier, sans appuyer les poignets en continu. |
| 4     | La lumière                  | Évite une fenêtre ou une lampe juste devant ou derrière l'écran. Règle les stores et l'éclairage selon le moment de la journée.                                |
| 5     | Avec un ordinateur portable | Si tu y travailles longtemps, surélève-le et branche un clavier et une souris séparés.                                                                         |

Encadré, sous les cinq cartes. Titre : « Et surtout, change souvent de position ». Phrase : « Même bien installé, la meilleure posture reste celle dont on bouge régulièrement. »

Mention affichée : « D'après les recommandations de l'INRS sur le travail sur écran. », suivie du lien « Lire le dossier de l'INRS » vers https://www.inrs.fr/risques/travail-ecran/prevention-risques.html. Ces textes sont à faire relire : trois consignes (hauteur de l'écran, orientation par rapport à la fenêtre, pieds à plat et dos au dossier) proviennent de fiches d'organismes qui reprennent ces repères, pas directement du dossier de l'INRS.

Sous cette mention, dans le même bloc : titre « Aller plus loin : les postures sédentaires », phrase « L'INRS résume en 3 minutes pourquoi et comment interrompre la position assise toutes les 30 minutes. », lien « Voir la vidéo de l'INRS (YouTube) » vers https://www.youtube.com/watch?v=Hqb1863vYiY. Le libellé lu est « Voir la vidéo de l'INRS (YouTube). S'ouvre dans le navigateur. » Ces trois textes sont dans `content/fr.json`.

### 10.3 Textes de référence de l'écran « À propos »

| Organisme                            | Titre et lien                                                                                                                                                                                                                                                   |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anses, octobre 2025                  | [Marcher régulièrement 5 minutes pour préserver sa santé](https://www.anses.fr/fr/actualite/marcher-regulierement-5-minutes-preserver-sa-sante)                                                                                                                 |
| INRS                                 | [Prévention des risques liés aux postures sédentaires au travail](https://www.inrs.fr/risques/postures-sedentaires/prevention-risques.html)                                                                                                                     |
| OMS, novembre 2020                   | [Lignes directrices sur l'activité physique et la sédentarité](https://www.who.int/fr/publications-detail/9789240014886)                                                                                                                                        |
| Santé publique France, décembre 2025 | [Sédentarité : prévalence et connaissance des recommandations, Baromètre 2024](https://www.santepubliquefrance.fr/nutrition-et-activite-physique/rapportsynthese/sedentarite-prevalence-et-connaissance-des-recommandations-barometre-de-sante-publique-france) |
| Santé publique France                | [Réduire le temps passé assis (mangerbouger.fr)](https://www.mangerbouger.fr/l-essentiel/les-recommandations-sur-l-alimentation-l-activite-physique-et-la-sedentarite/reduire/reduire-le-temps-passe-assis)                                                     |
| Code du travail                      | [Article R. 4542-4, interruptions du travail sur écran](https://code.travail.gouv.fr/code-du-travail/r4542-4)                                                                                                                                                   |
| INRS                                 | [Travail sur écran, réglementation et normes](https://www.inrs.fr/risques/travail-ecran/reglementation-normes.html)                                                                                                                                             |

Seule la page de l'Anses a été ouverte et lue en entier pendant la conception. Les six autres liens sont à tester un par un avant publication.

### 10.4 Ce que l'application n'affirme pas

- Aucun texte officiel consulté ne fixe de rythme pour cligner des yeux : l'écran « À propos » présente les 20 minutes comme un choix de Lèv.
- La respiration guidée n'annonce aucun effet sur la santé. Les rythmes proposés n'ont pas de référence médicale vérifiée.
- La mention « L'application ne remplace pas l'avis d'un professionnel de santé » figure dans « À propos ».

### 10.5 Textes de l'écran « À propos »

Ces textes sont à reprendre mot pour mot dans `content/fr.json`.

**En-tête.** Titre de page (`h1`, 22 px, chasse −0,01 em, graisse forte, centré) : « Lèv - une pause, naturellement. », couleur `--signature`. Phrase : « Un compagnon discret pour bouger un peu plus souvent pendant le travail sur écran, et laisser ses yeux se reposer. »

**Philosophie**

| Titre                                                      | Texte                                                                                                                                                                                            |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Rester assis longtemps compte, même quand on fait du sport | Une séance de sport le soir ne suffit pas à effacer une journée entière passée sur une chaise. Ce qui aide, c'est d'interrompre souvent la position assise.                                      |
| De petits gestes, souvent                                  | Quelques pas, un étage à pied, un regard par la fenêtre. Rien à réussir, rien à mesurer : chaque petite pause compte.                                                                            |
| Une invitation, jamais un reproche                         | Tu peux reporter une pause ou la passer. Lèv ne tient aucun compte de ce que tu n'as pas fait.                                                                                                  |
| Le travail reste au centre                                 | Les rappels se font discrets et se taisent quand tu présentes ou travailles en plein écran. Les séquences de travail t'aident à te concentrer, puis à vraiment t'arrêter.                        |
| Le bon moment                                              | Lèv attend que tu aies fini de taper, tient compte des pauses que tu prends de toi-même et respecte tes horaires.                                                                                |
| Des idées écrites par des professionnels                   | Chaque invitation à bouger propose un mouvement simple à faire au bureau, avec toujours une variante à faire assis.                                                                              |
| Chez toi, pour toi                                         | Aucun compte, aucune inscription, aucune donnée personnelle demandée. Tes réglages restent sur ton ordinateur. Lèv est gratuite et ne remplace pas l'avis d'un professionnel de santé.          |

**Les repères**

| Titre                          | Texte                                                                                                                                                                                                                |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Se lever toutes les 30 minutes | L'Anses et l'INRS conseillent d'interrompre la position assise toutes les 30 minutes dans l'idéal. C'est le rythme proposé par défaut.                                                                               |
| Marcher 5 minutes              | Pour un adulte, l'Anses conseille 5 minutes de marche, à allure tranquille ou modérée. C'est la durée de la pause active.                                                                                            |
| Quitter l'écran des yeux       | Le Code du travail prévoit que le travail sur écran soit régulièrement interrompu par des pauses ou des changements d'activité. Le rappel toutes les 20 minutes est un choix de Lèv, que tu peux modifier. |

Lien sous ce bloc : « Bien installer mon poste, en cinq réglages ».

**Ekilib.re.** Le résumé du tiroir est « Fait avec », un cœur plein de 15 px coloré `--coeur` (`#c98480`), puis « à La Réunion par Ekilib.re ». Le cœur porte `aria-hidden`. L'intitulé lu est « Fait avec cœur à La Réunion par Ekilib.re ». Dans la fenêtre de 520 px, cette ligne ne couvre pas le chevron. Le tiroir ouvert est une seule carte, fond `--carte`, bordure `--lisere`. Le résumé et tout le contenu ouvert partagent ce fond : rien ne reste sur le fond de page. L'écart vertical entre les blocs est de 10 px.

En haut, trois pastilles sur une ligne : « 100 % gratuit », « Open source (licence MIT) », « Association Ekilib.re ». Elles portent la mention de licence (section 16). Puis : « Lèv est développée bénévolement par Ekilib.re, Maison Sport-Santé au Tampon, à La Réunion. Chaque pas compte. » Le lien `https://ekilib.re` est posé sur « Ekilib.re ». « Chaque pas compte. » est en graisse forte.

Un encart au fond `--surface-douce` explique : « Les Maisons Sport-Santé sont des lieux d'accueil, d'information et d'orientation vers une activité physique adaptée à tes besoins, tes envies et ta santé. Elles proposent un accompagnement personnalisé, quel que soit ton âge ou ton niveau de départ. » Le lien `https://www.sports.gouv.fr/maisons-sport-sante` est posé sur « Maisons Sport-Santé ». Dans le même encart : « Trouve la Maison Sport-Santé la plus proche de chez toi. » Elle ouvre `https://livemap.getwemap.com/embed?emmid=13462&iframeEmbed=true&iframeid=9d84e72b-50f8-49e9-9ed6-c2b6b756e94e&parentOrigin=https%3A%2F%2Flivemap.getwemap.com&replaceContainer=false&token=NRAY1Q8M32GFJ8ZOVMBSO3HUZ`.

Sous l'encart, une rangée centrée : « Découvrir Ekilib.re » vers `https://ekilib.re`, libellé lu « Découvrir Ekilib.re. S'ouvre dans le navigateur. », et « Code source sur GitHub » vers `https://github.com/Kozavan974/lev`, libellé lu « Code source sur GitHub. S'ouvre dans le navigateur. ». Puis un bouton discret centré « Vérifier les mises à jour ». Le numéro de version n'est pas dans ce tiroir : il rejoint la ligne technique en bas de page. Pendant l'appel : « Vérification en cours… ». Si la version installée est la dernière : « Tu utilises déjà la dernière version de Lèv. » Si la vérification ne peut pas aboutir : « Vérification impossible pour le moment. » Si une version plus récente existe : « Une nouvelle version ({version}) est disponible. » et un lien « Télécharger sur GitHub » vers `https://github.com/Kozavan974/lev/releases/latest`. Quand une version plus récente a déjà été constatée, ce message et ce lien sont affichés sans nouvel appel. Ces messages restent dans la carte.

En bas de page, seul le bouton « Revoir l'écran de bienvenue ». Il rouvre l'accueil sans modifier `reglages.json`. Sous un filet, une ligne en 12,5 px et en `--texte-second` : « Lèv v{version} · Propulsé par Electron {electron} et Chromium {chrome} ». `{version}` est `app.getVersion()`, donc le passage à `1.1.1` se reflète tout seul. `{electron}` et `{chrome}` viennent de `process.versions`. Aucun outil de build n'est cité. La signature « Lèv — levez-vous, respirez. » n'est plus affichée.

### 10.6 Astuces d'utilisation (`content/astuces.fr.json`)

Six phrases courtes, affichées une seule fois, en pied de certaines notifications (section 7.3). Le libellé de la case qui les active est dans `content/fr.json`. L'ordre du fichier est l'ordre d'affichage.

| Id          | Phrase                                                                          | Lien                   | Écran                    |
| ----------- | ------------------------------------------------------------------------------- | ---------------------- | ------------------------ |
| frequence   | Tu peux régler la fréquence de chaque rappel, et les heures où je me manifeste. | Ouvrir les réglages    | Mes rappels              |
| reunion     | Le menu propose « En réunion (1 h) » pour une heure au calme.                   | aucun                  | aucun                    |
| respiration | Une respiration guidée de quelques minutes, si tu veux souffler.                | Essayer la respiration | Respiration guidée       |
| assis       | Tu peux préférer des mouvements discrets, à faire assis.                        | Ouvrir les réglages    | Mes rappels              |
| pause30     | Sur le rappel pour marcher, une pause guidée de 30 secondes est proposée.       | aucun                  | aucun                    |
| poste       | Le guide du poste reprend des repères de l'INRS.                                | Voir le guide          | Bien installer mon poste |

## 11. Confidentialité et sécurité

Lèv ne collecte, ne transmet et ne conserve aucune donnée personnelle en dehors de l'ordinateur de l'utilisateur. Cette promesse est affichée dès le premier lancement : le code doit la tenir à la lettre.

### Ce que Lèv fait et ne fait pas

- Aucun compte, aucune adresse e-mail, aucun identifiant d'appareil.
- Aucune mesure d'audience, aucun rapport d'erreur automatique, aucune bibliothèque tierce qui appelle Internet.
- Les polices et les images sont embarquées. L'application fonctionne entièrement hors connexion.
- La détection d'activité lit uniquement le temps écoulé depuis la dernière action. Aucune frappe, aucun titre de fenêtre, aucune capture d'écran n'est lu ni enregistré.
- Si l'option est cochée, et seulement lorsqu'un rappel arrive à échéance, Lèv lit en lecture seule deux dates du registre de l'utilisateur (`ConsentStore\microphone` et `NonPackaged`) pour savoir si le microphone est ouvert. Elle n'ouvre pas le flux audio, ne conserve pas le nom de l'application et n'enregistre pas ces dates.
- Les seuls accès réseau admis : la vérification des mises à jour (section 13), et l'ouverture d'un lien dans le navigateur quand l'utilisateur clique dessus.
- Désinstaller l'application conserve le fichier de réglages (`deleteAppDataOnUninstall: false`).

### Règles de sécurité Electron

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` sur toutes les fenêtres.
- Une politique de sécurité de contenu stricte : aucun script ni style distant, aucun `eval`.
- Le `preload` n'expose que des fonctions nommées et typées, jamais `ipcRenderer` entier.
- Les liens externes passent par `shell.openExternal`, après vérification que l'adresse commence par `https://` et appartient à l'un de ces domaines : anses.fr, inrs.fr, who.int, santepubliquefrance.fr, mangerbouger.fr, code.travail.gouv.fr, ekilib.re, sports.gouv.fr, getwemap.com, youtube.com, youtu.be. Un sous-domaine de ces noms est accepté, par exemple `www.sports.gouv.fr`, `livemap.getwemap.com`, `www.youtube.com` ou `www.ekilib.re`. Le lien « Découvrir Ekilib.re » ouvre `https://ekilib.re` par cette liste. « Code source sur GitHub » ouvre `https://github.com/Kozavan974/lev`. `github.com` est accepté aussi, ainsi que `www.github.com`, mais pas ses autres sous-domaines : `api.github.com` sert uniquement à l'appel de la section 13 et n'est pas ouvert dans le navigateur.
- L'unique appel spontané est un GET HTTPS vers `https://api.github.com/repos/Kozavan974/lev/releases/latest` (section 13). Cette adresse n'est pas ouverte dans le navigateur. Le lien de téléchargement, lui, passe par la liste blanche (`github.com`).
- Toute navigation et toute ouverture de fenêtre depuis un écran sont bloquées.
- Une seule instance de l'application à la fois (`requestSingleInstanceLock`).

### Cadre

Lèv est présentée comme une application de bien-être. Elle ne pose pas de diagnostic et n'annonce pas d'effet thérapeutique. Ce positionnement, comme l'absence d'obligation au titre du RGPD pour l'application elle-même, est à faire confirmer par un juriste avant diffusion : ce document ne vaut pas avis juridique.

## 12. Accessibilité

Lèv doit être utilisable au clavier, avec un lecteur d'écran et par une personne malvoyante. Ce n'est pas une option de fin de projet : chaque écran est livré conforme.

- **Clavier** : tout est atteignable avec Tab, activable avec Entrée ou Espace. Le focus est visible sur les éléments interactifs (`button`, `a`, `input`, `select`, `textarea`, `summary`) : contour de 3 px dans la couleur `--action`. Les titres, y compris lorsqu'ils reçoivent le focus à l'ouverture d'un écran, n'ont pas de contour.
- **Notification** : elle ne prend pas le focus à l'apparition. Un raccourci global, Ctrl + Alt + L par défaut, y place le focus. Il n'est enregistré que pendant qu'une notification est à l'écran, et libéré dès qu'elle se ferme : sous Windows, Ctrl + Alt équivaut à la touche AltGr, et un raccourci permanent pourrait gêner la saisie. À tester sur un clavier AZERTY. Échap vaut « Plus tard ».
- **Lecteur d'écran** : vrais éléments `button`, `a`, `input`, `label`, `select`. Les boutons sans texte ont un libellé (« Retirer le rappel Marcher 5 minutes »). Les messages qui changent sont annoncés (`aria-live="polite"`). À vérifier avec NVDA.
- **Contrastes** : au moins 4,5 pour 1 pour tout texte, 3 pour 1 pour les contours de champs. À mesurer sur le dégradé et sur les cartes translucides, dans les deux thèmes. Si une mesure échoue, on rend la carte plus opaque plutôt que de changer les couleurs de texte.
- **Couleur** : aucune information ne passe par la couleur seule. Un élément sélectionné se distingue aussi par son fond plein et sa graisse.
- **Taille** : l'interface respecte la mise à l'échelle de Windows (100 à 200 %) sans texte coupé.
- **Mouvement** : respect du réglage Windows de réduction des animations (section 9).
- **Son** : coupé par défaut. Activé, il est court, doux et unique.

## 13. Empaquetage, distribution et mises à jour

Lèv est livrée sous la forme d'un installateur Windows unique, qui s'installe sans droits d'administrateur.

- **Installateur** : `electron-builder`, cible NSIS one-click, installation par utilisateur, en français, sans choix de dossier. Raccourci « Lèv » dans le menu Démarrer et sur le bureau.
- **Nom affiché** : « Lèv ». Identifiant technique sans accent : `re.ekilib.lev`. Nom du fichier : `Lev-Setup-1.2.2.exe`.
- **Déploiement en entreprise (Intune / Silent install)** : voir la sous-section du même nom, plus bas.
- **Démarrage automatique** : activé par défaut via `app.setLoginItemSettings`, désactivable dans « Autres réglages ». L'entrée de démarrage automatique lance Lèv avec l'argument --demarrage-auto : dans ce cas aucune fenêtre ne s'ouvre, seule l'icône apparaît. Un lancement à la main (menu Démarrer) ouvre « Mes rappels », ou l'accueil si c'est le premier lancement. Si Lèv tourne déjà, la relancer ouvre « Mes rappels » dans l'instance existante (événement second-instance) : sans cela, le clic semblerait sans effet.
- **Signature du code** : sans certificat de signature, Windows affiche un avertissement « éditeur inconnu » à l'installation, ce qui décourage une partie du public. L'achat d'un certificat au nom de l'association est à décider (section 16).
- **Distribution** : téléchargement depuis ekilib.re. Le Microsoft Store est une seconde voie possible, qui évite l'avertissement de Windows.
- **Mises à jour** : au plus une fois par semaine, et quand on le demande dans « À propos », Lèv interroge en HTTPS `https://api.github.com/repos/Kozavan974/lev/releases/latest` (délai de 6 secondes, en-tête `User-Agent: Lev-Desktop`, aucun identifiant). Si une version SemVer plus récente existe, « À propos » le dit et propose d'ouvrir `https://github.com/Kozavan974/lev/releases/latest` dans le navigateur. Rien n'est téléchargé ni installé tout seul. Hors connexion, Lèv continue de fonctionner. La case « Vérifier automatiquement les mises à jour (1 fois par semaine) » est cochée par défaut. Une version constatée est retenue dans `derniereVersionVue` : le point à côté d'« À propos », dans le menu, reste visible aux lancements suivants tant que cette version est plus récente que celle installée et que la case reste cochée. C'est le seul appel réseau spontané de l'application.
- **Versions** : numérotation `majeure.mineure.correctif`. Le numéro est affiché dans « À propos ».
- **Empreinte au repos** : une seule instance (section 11). Accélération matérielle désactivée, tas V8 plafonné à 64 Mo, fenêtre de rappel détruite dès sa disparition (section 3). Entre deux rappels, aucun processus de rendu ne reste ouvert.
- **macOS et Linux** : hors v1. Le code ne doit rien contenir qui empêche de les ajouter (section 3).

### Déploiement en entreprise (Intune / Silent install)

L'installateur est produit par `electron-builder`, cible NSIS one-click (`oneClick: true`, `perMachine: false`, `allowToChangeInstallationDirectory: false`). L'installation se fait pour l'utilisateur courant, sans élévation administrateur.

Installation silencieuse. Le commutateur `/S` est en majuscule. Le processus reste bloquant jusqu'à la fin réelle de la copie :

`Lev-Setup-<version>.exe /S`

Chemin d'installation : `%LOCALAPPDATA%\Programs\lev\Lèv.exe`.

Désinstallation silencieuse :

`"%LOCALAPPDATA%\Programs\lev\Uninstall Lèv.exe" /S`

Le même fichier, ouvert sans `/S`, fait l'installation manuelle one-click, au même endroit. La vérification des mises à jour décrite plus haut ne télécharge rien et n'installe rien.

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
19. Avec la détection d'absence active, le décompte avance encore à 4 minutes 59 secondes d'inactivité, se fige à partir de 5 minutes, et repart de zéro au retour sans afficher de carte, même si la période était échue pendant l'absence.
20. Si la détection est coupée, ce même temps inactif compte, et un rappel dû peut s'afficher.
21. Un rappel à heure fixe tombé pendant une absence de 5 minutes ne s'affiche pas au retour.
22. Une absence de 5 minutes ne change pas l'heure de fin d'une séquence. Si elle est échue au retour, une seule carte de séquence s'affiche.
23. Une réunion d'une heure est l'unique suspension : les rappels restent tus jusqu'à l'heure exacte, puis les compteurs repartent de zéro sans carte immédiate. Reprendre retire cette suspension. Une veille de 30 minutes la remplace et retire le motif réunion.
24. Un fichier sans `suspendreInactivite` reste en version 1 et la case vaut vrai. Une ancienne `reunionJusqua` devient `veilleJusqua` avec le motif `reunion`.
25. Les deux premiers rappels affichés n'ont pas d'astuce. Le 6e, le 10e, le 14e, le 18e, le 22e et le 26e montrent les six astuces, dans l'ordre du catalogue, puis plus aucune. La case décochée laisse le compteur avancer sans rien afficher. Un fichier sans `afficherAstuces`, `astucesVues` ni `notificationsAffichees` reste en version 1 : la case est cochée, la liste est vide, le compteur vaut 0.

### Contrôle manuel avant version

- [ ] Installation sans droits d'administrateur sur Windows 10 et Windows 11
- [ ] Premier lancement : l'accueil s'affiche tout seul une seule fois, et se revoit depuis « À propos »
- [ ] La notification ne prend jamais le focus pendant la frappe dans un autre logiciel
- [ ] La notification est correctement placée avec une barre des tâches en bas, sur le côté, et à 150 % de mise à l'échelle
- [ ] Avec deux écrans, la notification apparaît sur l'écran principal
- [ ] Ajout, réglage, retrait puis « Annuler » d'un rappel, des deux types
- [ ] Les réglages sont conservés après redémarrage de l'ordinateur
- [ ] Thème clair, sombre et automatique, avec bascule à chaud
- [ ] Parcours complet au clavier seul, puis avec NVDA
- [ ] Respiration guidée : la bulle suit les temps réglés, y compris avec une pause à 0
- [ ] Tous les liens de « À propos » s'ouvrent dans le navigateur
- [ ] « Vérifier les mises à jour » : à jour, hors connexion, et lien GitHub si une version plus récente existe
- [ ] Pare-feu en mode blocage : l'application fonctionne normalement hors connexion
- [ ] Mémoire au repos inférieure à 150 Mo, processeur proche de 0 % sur dix minutes
- [ ] Anneau de 30 secondes lisible en thème clair et en thème sombre, immobile si les animations sont réduites, fenêtre absente après la fin du guide
- [ ] Une astuce en pied de carte, lisible en thème clair et en thème sombre, dont le lien ouvre le bon écran
- [ ] Relecture de tous les textes au regard de la section 8

## 15. Plan de développement

Les huit lots ci-dessous sont livrés dans la version 1.2.2. Le tableau conserve l'ordre de construction. La liste de contrôle manuelle de la section 14 reste à vérifier avant chaque publication.

| Lot                                | Contenu                                                                                                                                                                                                                                              | Terminé quand                                                                                    |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 0. Socle                           | Projet `electron-vite` en TypeScript strict, arborescence de la section 3, règles de sécurité, icône dans la zone de notification, fichier de réglages avec valeurs par défaut, jetons de couleur, police et icônes fournies à l'avance (section 17) | L'icône apparaît, « Quitter » fonctionne, les réglages par défaut sont écrits sur le disque      |
| 1. Moteur et première notification | Moteur avec horloge injectée (5.1, 5.4, 5.5), fenêtre de notification, rappels « yeux » et « bouger », messages de réponse                                                                                                                           | Les deux rappels se déclenchent et répondent aux trois boutons. Tests 1, 5, 6 et 18 au vert      |
| 2. Menu et « Mes rappels »         | Menu complet, liste des rappels, ajout des deux types, retrait avec « Annuler », « Rétablir les rappels d'origine », horaires, rappels à heure fixe (5.6)                                                                                            | On peut créer, régler et retirer un rappel sans redémarrer. Tests 2, 8, 12, 13, 15 et 17 au vert |
| 3. Le bon moment                   | Accalmie, pauses spontanées, mise en veille, états de l'icône, pastille « bientôt », détection du plein écran par appel natif, étude technique « Ne pas déranger » (5.9)                                                                             | Tests 3, 4, 9, 11 et 14 au vert. Compte rendu de l'étude technique rédigé                        |
| 4. Séquences de travail            | Règles 5.8, notifications de fin de séquence et de fin de pause, ligne de parcours, état dans le menu                                                                                                                                                | Une série de quatre séquences se déroule jusqu'à la grande pause. Tests 10 et 16 au vert         |
| 5. Contenus et écrans annexes      | Premier lancement, « À propos », guide du poste, point posture, idées de mouvement avec variante assise, respiration guidée                                                                                                                          | Tous les écrans de la section 7 existent et sont conformes à ce document                         |
| 6. Finitions                       | Rappel qui s'adapte (5.7), thème sombre et automatique, son, accessibilité (section 12), animation du logo                                                                                                                                           | Test 7 au vert. Parcours clavier et NVDA validés. Contrastes mesurés                             |
| 7. Livraison                       | Installateur, démarrage automatique, mises à jour, signature si décidée, contrôle manuel complet                                                                                                                                                     | La liste de contrôle de la section 14 est entièrement cochée sur Windows 10 et 11                |

Les contenus définitifs des enseignants en APA (section 10.1) peuvent encore remplacer `content/idees.fr.json`, qui reste marqué provisoire.

## 16. Points ouverts

La version livrée est 1.2.2. Le son est tranché au lot 6. L'hébergement des mises à jour et la licence MIT le sont depuis la version 1.1.0. Les lignes marquées « Tranché » ne sont plus ouvertes. Les autres gardent une règle provisoire.

| Point                    | À décider                                                                                        | Règle provisoire                                             | Avant le lot |
| ------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ | ------------ |
| Rappels actifs au départ | Lesquels sont cochés au premier lancement                                                        | Yeux, marcher et posture actifs ; eau proposée mais décochée | 1            |
| Longues séquences        | Que faire quand une séquence dépasse 30 minutes assis (rythmes 50-10 et « une pause par heure ») | Une invitation discrète à se lever au milieu de la séquence  | 4            |
| Visioconférences         | Peut-on lire de façon fiable le mode « Ne pas déranger » de Windows                              | Plein écran, présentation, et micro en cours (5.9). Un appel sans micro, et le mode « Ne pas déranger » de Windows, restent hors détection. | 3            |
| Logotype                 | La bulle au-dessus du L et l'accent du « è » font double emploi                                  | Garder les deux, comme sur la maquette                       | 5            |
| Logo Ekilib.re           | Fichier du logo de l'association pour l'écran « À propos »                                       | Nom en toutes lettres, sans logo                             | 5            |
| Idées de mouvement       | Relecture et rédaction par les enseignants en APA                                                | 15 idées par liste dans `idees.fr.json`, encore marquées provisoires | 7            |
| Guide du poste           | Relecture des cinq consignes et de la mention de source                                          | Textes de la section 10.2                                    | 7            |
| Son                      | Quel son, créé ou libre de droits                                                                | Tranché : deux notes douces en sinus, Web Audio, environ 300 ms, sans fichier. Option visible, décochée. Un aperçu joue au cochage. | 6            |
| Écrans sombres           | Seuls le menu et le rappel « bouger » ont une maquette sombre                                    | Appliquer les jetons sombres de la section 9                 | 6            |
| Licence                  | Logiciel libre ou non, et quelle licence                                                         | Tranché : licence MIT, Association Ekilib.re (2026). Pastilles « Open source (licence MIT) » et « Association Ekilib.re » (section 10.5). | 7            |
| Nom                      | Vérifier que « Lèv » est disponible comme marque et comme nom de domaine                         | Aucune : à vérifier avant toute communication publique       | 7            |
| Signature du code        | Achat d'un certificat au nom de l'association                                                    | Livrer sans signature en test interne uniquement             | 7            |
| Hébergement              | Où sont publiés l'installateur et les mises à jour                                               | Tranché pour les mises à jour : Releases publiques `Kozavan974/lev`. Vérification seule, sans téléchargement ni installation automatiques. L'installateur reste proposé sur ekilib.re. | 7            |

Trois points ajoutés à la relecture de cohérence :

- **Seuil de pause spontanée.** Trois minutes sans clavier ni souris comptent comme une pause (5.2). Or lire un long document ou suivre une réunion sans toucher à rien produit le même signal, alors que la personne est restée assise. Règle provisoire : garder 3 minutes. À revoir après les premiers essais réels, avant le lot 3.
- **Petit logo animé dans la notification.** Il a été ajouté pour donner une place à l'animation de la bulle (section 9), puisque l'icône de la zone de notification ne s'anime pas. Il n'est pas maquetté. Règle provisoire : logo de 24 px en haut à droite de la carte. Avant le lot 6.
- **Case « Séquences de travail ».** Elle est cochée par défaut dans ce document, décochée sur la maquette. Règle provisoire : cochée. Avant le lot 4.

L'empreinte mémoire est tranchée (section 3). L'accélération matérielle est désactivée, le tas V8 est plafonné à 64 Mo, et la fenêtre de notification est détruite dès sa disparition. L'ancienne règle provisoire — la conserver masquée, et ne la détruire qu'en cas de dépassement de 150 Mo — est close. L'objectif de mesure reste celui de la section 14.

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
- Les 25 cas de la section 14 sont obligatoires.
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
- Cibles de 38 px minimum (34 px pour les pastilles et les boutons du menu, 28 px pour les liens du menu, 30 px pour les boutons − et + de la respiration), focus visible sur les éléments interactifs.
- Respecte `prefers-reduced-motion`.
- Les écrans passent par l'API du preload. Jamais d'accès direct au disque ni à `ipcRenderer`.
- La notification mesure sa hauteur avec `ResizeObserver` et la transmet au processus principal, qui l'arrondit en entier avant `setBounds()`.
```
