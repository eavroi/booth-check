# Booth Check — règles du projet

Réplique dans le navigateur de matériel DJ de club (CDJ-2000NXS2 et table DJM-900NXS2), qui lit les clés USB exportées avec rekordbox.
Projet personnel et gratuit de Victor, pour lui et quelques amis. Site : https://eavroi.github.io/booth-check/ (GitHub Pages, branche principale, racine du dépôt).

## Façon de travailler
- Répondre en français, de façon concise. Victor dicte souvent à la voix : lire le contexte attentivement.
- Avant chaque version : faire un « point » (liste de ce qui va changer, questions s'il y en a) et attendre son « GO ».
- À la livraison, toujours dire le numéro de version (V2.8.3 est la dernière livrée ; la suivante est V2.8.4).
- Ne jamais inventer de fonction ni d'élément d'interface : tout vient de la vraie machine (mode d'emploi, photos, vidéos, captures). En cas de doute, le dire.
- Vérifier chaque version : `python build.py`, `python tests/scenarios.py` (comportements du mode d'emploi), `python tests/smoke.py` (captures), comparer avec les photos de la vraie machine.
- Références hors dépôt, dans `BOOTH CHECK/references/` : modes d'emploi FR de la CDJ-2000NXS2 et de la DJM-900NXS2 (PDF + texte extrait), photos de Victor.

## Contraintes
- Aucun logo Pioneer DJ, rekordbox, DVD ou CD sur les faces. Le nom du modèle est remplacé par « BOOTH CHECK » (« MULTI PLAYER BOOTH CHECK », « PROFESSIONAL MIXER BOOTH CHECK »).
- Garder la mention « Projet personnel, non affilié » et les crédits : la face de la CDJ dérive du « Pioneer CDJ & XDJ Emulator » (GPL-2.0-or-later), donc le projet reste sous GPL et ses sources restent publiques.
- Pas de rétro-ingénierie ni de copie du firmware (code, images, polices) : on observe la vraie machine et on redessine.
- Design du site sobre : pas de page d'accueil marketing, la machine est le seul « wow », marque « BC », vocabulaire technique, FR / EN.

## Structure
- `app/` : modules de l'application, assemblés dans l'ordre de `build.py` (core, face_layout, cap_img, face_art, djm_art, lcd_kit, library, mixer, beatfx, deck, browse, lcd, controls, face_view, mixer_view, midi, midi_plan, report, ui, main).
- `lib/` : lecture d'export.pdb et des fichiers ANLZ. `data/demo.json` : l'exemple intégré.
- `index.html` (racine) est GÉNÉRÉ par `build.py` : ne pas l'éditer à la main.
- `tests/scenarios.py` : scénarios de comportement ; `tests/smoke.py` : test rapide avec captures (Playwright) ; `tests/out/` ne doit pas être commité.
- `og.png`, `icon.png`, `icon-192.png`, `icon-512.png`, `manifest.webmanifest` : partage et application installée.

## Points clés du fonctionnement
- Barre du haut sur une seule ligne, aucun texte sur deux lignes : quand la place manque, on masque (nom de la clé, puis « Booth Check » et le résumé). Onglet « Matériel » (résumé « 2 CDJ · DJM ») : il ouvre un panneau avec le booth de gauche à droite (tranche 1, 2, table, 3, 4) ; l'emplacement choisi montre modèle, couleur, retirer. Bouton clavier pour les raccourcis. La platine de la tranche n est PLAYER n (`BOOTH`, `setBooth` dans main.js, enregistré dans `bc.booth`). Première visite : une seule CDJ sur la tranche 2, sans table. Téléphone : 2 platines au plus.
- Machines « bientôt » (CDJ-3000, CDJ-3000X, DJM-A9, DJM-V10) et couleur blanche (-W, série limitée 2017) : annoncées dans le menu, pas encore dessinées (`GEAR`, `COLORS` dans main.js).
- Table masquée : les platines sortent en direct.
- Raccourcis clavier par position physique (KeyboardEvent.code), aucun Shift ; AZERTY BE par défaut.
- Moteur de lecture : un AudioWorklet par platine (`DECK_SRC` dans deck.js) qui reçoit les échantillons une fois ; la page lui envoie vitesse, boucle, MASTER TEMPO, et la position seulement aux sauts (numérotés) ; il renvoie sa position et l'écran le suit. MASTER TEMPO = étirement WSOLA (grains de 43 ms). Sans AudioWorklet, l'ancien lecteur (AudioBufferSourceNode) reste en secours.
- SOUND COLOR FX (mixer.js) : sens des potards d'après le mode d'emploi p. 16 ; valeurs chiffrées = réglages de départ, à caler sur l'enregistrement de la vraie table (kit : `tests/kit_djm.py` + fiche dans `BOOTH CHECK/V2.9/kit-test-DJM/`). SPACE et DUB ECHO pris après le fader et rendus avant le crossfader (queue quand on baisse le fader).
- BEAT FX (`beatfx.js`, mode d'emploi p. 12-18) : un seul AudioWorklet `bc-beat` (14 effets, découpe FX FREQUENCY) placé dans un « slot » de la table (`mkSlot` dans mixer.js) : après le fader d'une tranche (jamais au casque, constaté par Victor), côté A / B du crossfader, ou avant MASTER LEVEL. DELAY, ECHO, PING PONG, SPIRAL, REVERB : queue au fader baissé et après ON/OFF (Victor). État dans `MS` (fxType, fxCh, fxOn, depth, pad, touch, quantize, tap, freq) et `BF` (fraction, TIME, TAP, grille). Valeurs non données par le manuel marquées « à caler ». Vumètre et CLIP du master avant le limiteur.
- Casque : clic sur la prise PHONES, sortie choisie avec setSinkId (Chrome / Edge).
- Contrôleurs MIDI (`midi.js`, Web MIDI, Chrome / Edge) : actions `MACT`, modèles `MTPL` (Hercules DJ Control Steel d'après la table MIDI de son mode d'emploi, dans `references/manuels/`), reprise douce des potards, voyants, apprentissage. Plan dessiné du Steel dans `midi_plan.js`. BEAT FX sur le Steel (V2.9.1) : Apply Ctrl Select = Controls 1 effet (Stop : canal), Controls 2 LEVEL/DEPTH (Stop : TIME) ; Deck A/B = Controls 2 BEAT ◀ ▶ ; Stop + pads = ON/OFF, TAP, BEAT ◀ ▶, X-PAD, AUTO/TAP. Voyants du Steel vérifiés un par un (résultats dans `references/`) : codes « Mode » = SHIFT, « Folders » / « Files » = flèches ◀ ▶. Le navigateur intégré de l'app Claude refuse Web MIDI : tester dans Chrome ou Edge.

## Feuille de route (validée par Victor le 27 octobre 2026, susceptible de changer)
1. Audit complet des modes d'emploi CDJ-2000NXS2 et DJM-900NXS2, page par page : chaque fonction, chaque comportement d'écran et de la platine classé « simulé / partiel / absent / différent du réel », avec la liste d'écarts que Victor a constatés. Résultat = base des versions suivantes.
2. V2.9 et V2.9.1 (faites) : BEAT FX de la table et sur le Steel ; retours d'écoute de Victor à venir. V2.8.3 (faite) : écran, voyants et réglages CDJ. Ensuite V2.8.4 (fonctions CDJ manquantes : F1-F4, E11-E12, J11-J12, E7-E8), voir `references/audit/SYNTHESE.md`.
3. Calage des SOUND COLOR FX et des BEAT FX sur un enregistrement de la vraie table (kit `tests/kit_djm.py` + fiche dans `BOOTH CHECK/V2.9/kit-test-DJM/`, COLOR et BEAT FX) : Victor fera un seul passage sur la vraie DJM pour les deux.
4. V2.10 : LINK entre platines, fente SD de la CDJ (2e clé, ex. clé de secours), site utilisable sans internet.
5. V2.11 : contrôle de clé enrichi : rapport à garder ou envoyer (texte / PDF), comparaison de deux clés, nouveaux contrôles (doublons, morceaux sans tonalité, playlists vides, fichiers trop gros ; chaque limite vérifiée dans le mode d'emploi), export de l'HISTORY.
6. V3 : nouvelles machines (CDJ-3000, DJM-A9…) ; versions blanches (-W) possibles plus tôt.
- Pistes non classées : MIC 1 / MIC 2 avec le vrai micro (TALK OVER), BOOTH MONITOR en 2e sortie son, modèles DDJ-FLX4 / DDJ-400 (si listes MIDI officielles), assistant d'apprentissage pas à pas pour les autres contrôleurs, deux contrôleurs en même temps, tests automatiques sur GitHub, téléphone et Safari. Hors machine, à décider par Victor : enregistrer son mix, mode guidé pour apprendre la CDJ. SEND / RETURN : déconseillé.

## À faire plus tard
- Vérifier sur la vraie CDJ (V2.8.3) : graduations de la barre de position (1 minute ou 16 mesures, et quand), si les chiffres du temps clignotent aussi en fin de morceau, touche USB quand la clé est branchée sans exploration ni morceau chargé (éteinte ici), écran ouvert en touchant le PHASE METER, rythme de l'anneau avec JOG INDICATOR.
- Couleur de fond du nom du morceau et de l'indicateur USB (BACKGROUND COLOR, p. 37) : il faut une clé exportée avec une couleur choisie dans rekordbox pour trouver où elle est rangée.
- Essayer les BEAT FX sur le vrai Steel (V2.9.1, Chrome ou Edge).
- Vérifier sur la vraie CDJ (V2.8.2) : emplacement et dessin des messages MEMORY / DELETE, reprise après un slip en pause (immédiate ici, sans RELEASE/START).
- Essai de la V2.8.1 sur le vrai Steel (Stop + CUE casque, Stop + CUE = SLIP REVERSE, plan).
- Fréquences de l'EQ de la table : le mode d'emploi donne HI 30 kHz, MID 1 kHz, LOW 20 Hz, inutilisables tels quels ; garder 300 Hz / 4 kHz tant qu'on n'a pas mieux.
- Tester la sortie casque sur un vrai 2e appareil son.
- Relancer l'émulateur du firmware CDJ (cdj-nxs2-qemu) sur le PC de Victor pour observer les écrans.
