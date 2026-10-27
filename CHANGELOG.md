# Booth Check — versions

## V2.7.2 — 27 octobre 2026
- Steel, voyants vérifiés un par un sur le vrai contrôleur : la table du mode d'emploi est juste ; ses codes « Mode » sont les voyants SHIFT, et ses codes « Folders » / « Files » sont les flèches ◀ ▶ du milieu (allumées quand la platine active affiche une liste). LOAD, SEARCH et les flèches ▲ ▼ n'ont pas de voyant pilotable ; ceux d'Apply Ctrl sont gérés par le Steel lui-même.
- « Tester les voyants » n'allume plus que les vrais voyants puis éteint tout (il faisait clignoter le SHIFT gauche sans fin) ; tous les voyants repartent éteints à la connexion.
- Panneau Contrôleur : diagnostic des voyants, code par code (réponse au clic sur le plan pour les codes hors manuel), avec export du résultat.

## V2.7.1 — 27 octobre 2026
- Steel : COLOR de la tranche = Stop + Gain (le TRIM ne bouge pas), PARAMETER = Stop + Balance ; les deux Stop choisissent les 6 SOUND COLOR FX avec les Kill ; Controls 1 = sélecteur rotatif de la platine choisie par Apply Ctrl, Controls 2 et Select gardés pour les BEAT FX (V2.9).
- Steel, voyants : un bouton maintenu est allumé tant qu'on appuie (Stop, BANK, CALL/DELETE, Pitch bend), un bouton qui bascule est allumé tant que sa fonction est active ; avec SHIFT, seuls les hot cues existants sont allumés.
- CDJ, d'après le mode d'emploi : LOOP OUT sans IN pose la boucle depuis le point CUE ; IN / OUT ADJUST : la touche clignote vite, l'autre s'éteint, l'écran affiche le temps du point ; jog à l'arrêt : le son suit la platine (recherche de trame en mode CDJ, scratch en VINYL).
- TRACK FILTER EDIT : le sélecteur atteint aussi MASTER PLAYER, les onglets BPM/KEY et MY TAG et RESET (cadre orange).
- Plans du contrôleur et du clavier redimensionnables par la poignée du coin (taille mini et maxi, taille retenue) ; plan du contrôleur plus petit à l'ouverture.
- Panneau Contrôleur : la liste des correspondances ne chevauche plus les derniers messages.

## V2.7 — 26 octobre 2026
- Contrôleurs MIDI (Chrome, Edge) : icône « contrôleur » dans la barre du haut, avec un point vert quand un contrôleur est branché. Son panneau : choix du contrôleur et du modèle, platine pilotée par chaque côté, derniers messages reçus, mode apprentissage, export / import des correspondances, sensibilité du jog, test des voyants.
- Modèle Hercules DJ Control Steel, d'après sa table MIDI officielle (mode d'emploi), essayé sur le vrai contrôleur (voyants encore à vérifier) :
  - pads 1-6 : LOOP IN, LOOP OUT, 4/8 BEAT, RELOOP, BEAT JUMP ◀ ▶ (pendant une boucle : LOOP 1/2X et 2X) ;
  - avec SHIFT : HOT CUE A-D (E-H après BANK), BANK, CALL/DELETE ;
  - Stop = touche fonction : seul MASTER TEMPO ; maintenu avec Play REVERSE, Cue SLIP, ◀◀ ▶▶ TRACK SEARCH, Sync MASTER, Pitch bend − / + TEMPO RANGE / TEMPO RESET, ▲ ▼ ◀ ▶ BROWSE / TAG LIST / INFO / MENU, Load TAG TRACK, Scratch TRACK FILTER, Kill les 6 SOUND COLOR FX ;
  - jog : tourner = main posée en VINYL, pitch bend en mode CDJ, recherche à l'arrêt ; ▲ ▼ maintenu + jog = défilement rapide ;
  - table : TRIM, EQ, Kill (bande au minimum tant qu'on appuie), faders, crossfader (A / THRU / B inchangés), MASTER, BALANCE, casque ; Controls 1 / 2 = COLOR de la tranche choisie par Apply Ctrl et PARAMETER ;
  - voyants comme sur la CDJ (PLAY, CUE, boucles, hot cues, SYNC, MASTER TEMPO, VINYL, fin de morceau sur LOAD, guide de reprise du fader TEMPO sur Pitch bend) ;
  - potards repris en douceur : un potard ne prend la main qu'une fois arrivé à la position affichée.
- Plan du contrôleur : le Steel dessiné d'après son mode d'emploi, avec l'affectation de chaque commande, dans une fenêtre déplaçable ; la commande touchée s'allume.
- Table : l'EQ au centre ne colore plus le son (réglage des filtres corrigé, +7 dB en trop à 300 Hz et 4 kHz) ; test audio automatique.
- Tests : scénarios du Steel simulé et test audio de l'EQ.

## V2.6.1 — 26 octobre 2026
- Barre du haut ramenée à une seule ligne : le rail devient un panneau qui s'ouvre depuis l'onglet « Matériel » (avec le résumé du setup, ex. « 2 CDJ · DJM »).
- Aucun texte de la barre sur deux lignes : à mesure que la fenêtre rétrécit, le nom de la clé, puis « Booth Check » et le résumé disparaissent. Sur téléphone, « Clé USB » au lieu de « Contrôle clé USB ».
- Bouton « clavier » à la place du « ? » pour les raccourcis.

## V2.6 — 26 octobre 2026
- Barre du haut refaite : onglet « Matériel » et rail du booth de gauche à droite (tranche 1, 2, table, 3, 4). Chaque emplacement ouvre un menu : modèle, couleur, retirer. Remplace les boutons 1·2·3·4 et « Mixer ».
- Les platines se placent sur la tranche choisie ; PLAYER = numéro de tranche.
- Première visite : une seule CDJ, sans table.
- Annoncés « bientôt » dans le menu : CDJ-3000, CDJ-3000X, DJM-A9, DJM-V10 et la version blanche (-W).
- Téléphone : barre sur une ligne, outils dans un menu ; en paysage, le rail rejoint les onglets et la platine prend toute la hauteur.
- Platines ajustées à la hauteur réelle de la barre.
- Table : MASTER LEVEL au centre par défaut (même volume qu'avant) ; double-clic pour remettre au centre EQ HI/MID/LOW, COLOR, TRIM, BALANCE, MIXING et le crossfader.
- Table : vis replacées d'après la photo (ligne du bas alignée, vis entre les tranches 2 et 3 ajoutée) ; voyants USB éteints (aucun ordinateur branché, d'après le mode d'emploi) ; écran BEAT FX : BPM mesuré en AUTO (70 à 180), la dernière valeur clignote quand plus rien n'est mesurable.
- Contrôle de clé, d'après le mode d'emploi : FLAC et ALAC lus par la CDJ-2000NXS2 ; nouveau contrôle des fichiers au-delà de 96 kHz / 24 bits (48 kHz en MP3 et AAC) ; formats de clé FAT16, FAT32, HFS+.
- Tests : `tests/scenarios.py` (CUE, hot cue, boucle, SYNC, table…) ; `build.py` lit et écrit en UTF-8.

## V2.5 — 23 octobre 2026
- Table de mixage DJM-900NXS2 jouable, entre les platines : sélecteur d'entrée, TRIM, EQ/ISO, faders et crossfader avec leurs 3 courbes, A / THRU / B, MASTER LEVEL, BALANCE, vumètres et CLIP.
- SOUND COLOR FX : les 6 effets (SPACE, DUB ECHO, SWEEP, NOISE, CRUSH, FILTER) avec COLOR et PARAMETER.
- Casque : CUE, MIXING, LEVEL, MONO SPLIT / STEREO ; sortie choisie en cliquant la prise PHONES (Chrome / Edge).
- Ordre des tranches : 1 platine sur la 2, puis 3, 1, 4 ; PLAYER = numéro de tranche. Bouton « Mixer » (affichée sur ordinateur, masquée sur téléphone).
- Non simulés, avec message : BEAT FX, SEND/RETURN, MIC, USB, MIDI, BOOTH MONITOR.
- Plan du clavier en fenêtre flottante déplaçable, les raccourcis restent actifs.
- Icônes : onglet et application installée sur fond foncé à coins arrondis (manifest.webmanifest, icon-192.png, icon-512.png).

## V2.4
- Jusqu'à 4 platines sur une ligne (sélecteur 1·2·3·4, MASTER/SYNC entre toutes, touche ² pour la platine suivante).
- Badge du contrôle de clé : ✓ vert sans problème, sinon le nombre en orange.
- TRACK FILTER éteint : plus d'entonnoir ni de [nombre] dans l'écran EDIT.
- « Crédits et licences » en petite bulle au-dessus du lien.
- Raccourcis par position physique des touches (sans Shift), AZERTY BE par défaut, choix QWERTY / AZERTY FR / AZERTY BE, plan du clavier.

## V2.3
- Pas de contrôle de clé sur l'exemple intégré ; onglet « Deck » ; libellés « Contrôle clé USB » et « Charger clé USB ».
- Taille libre avec − / +, booth seul en plein écran.
- Contour de la platine active en blanc, nom du profil DJ rekordbox à côté de la lettre de la clé.
- BEAT LOOP pendant une boucle : garde le point IN et change la longueur.
- Bas de page et panneau des raccourcis à droite.

## V2.1 – V2.2
- Nouveau nom « Booth Check », site sobre (marque BC, FR / EN), hébergé sur GitHub Pages.
- Finitions de la face de la CDJ d'après photos.
