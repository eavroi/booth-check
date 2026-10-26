# Booth Check — versions

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
