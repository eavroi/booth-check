# Booth Check — règles du projet

Réplique dans le navigateur de matériel DJ de club (CDJ-2000NXS2 et table DJM-900NXS2), qui lit les clés USB exportées avec rekordbox.
Projet personnel et gratuit de Victor, pour lui et quelques amis. Site : https://eavroi.github.io/booth-check/ (GitHub Pages, branche principale, racine du dépôt).

## Façon de travailler
- Répondre en français, de façon concise. Victor dicte souvent à la voix : lire le contexte attentivement.
- Avant chaque version : faire un « point » (liste de ce qui va changer, questions s'il y en a) et attendre son « GO ».
- À la livraison, toujours dire le numéro de version (V2.8 est la dernière livrée ; la suivante est V2.9).
- Ne jamais inventer de fonction ni d'élément d'interface : tout vient de la vraie machine (mode d'emploi, photos, vidéos, captures). En cas de doute, le dire.
- Vérifier chaque version : `python build.py`, `python tests/scenarios.py` (comportements du mode d'emploi), `python tests/smoke.py` (captures), comparer avec les photos de la vraie machine.
- Références hors dépôt, dans `BOOTH CHECK/references/` : modes d'emploi FR de la CDJ-2000NXS2 et de la DJM-900NXS2 (PDF + texte extrait), photos de Victor.

## Contraintes
- Aucun logo Pioneer DJ, rekordbox, DVD ou CD sur les faces. Le nom du modèle est remplacé par « BOOTH CHECK » (« MULTI PLAYER BOOTH CHECK », « PROFESSIONAL MIXER BOOTH CHECK »).
- Garder la mention « Projet personnel, non affilié » et les crédits : la face de la CDJ dérive du « Pioneer CDJ & XDJ Emulator » (GPL-2.0-or-later), donc le projet reste sous GPL et ses sources restent publiques.
- Pas de rétro-ingénierie ni de copie du firmware (code, images, polices) : on observe la vraie machine et on redessine.
- Design du site sobre : pas de page d'accueil marketing, la machine est le seul « wow », marque « BC », vocabulaire technique, FR / EN.

## Structure
- `app/` : modules de l'application, assemblés dans l'ordre de `build.py` (core, face_layout, cap_img, face_art, djm_art, lcd_kit, library, mixer, deck, browse, lcd, controls, face_view, mixer_view, midi, midi_plan, report, ui, main).
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
- SOUND COLOR FX (mixer.js) : sens des potards d'après le mode d'emploi p. 16 ; valeurs chiffrées = réglages de départ, à caler sur l'enregistrement de la vraie table (kit : `tests/kit_djm.py` + fiche dans `BOOTH CHECK/V2.8/kit-test-DJM/`). SPACE et DUB ECHO pris après le fader et rendus avant le crossfader (queue quand on baisse le fader).
- Casque : clic sur la prise PHONES, sortie choisie avec setSinkId (Chrome / Edge).
- Contrôleurs MIDI (`midi.js`, Web MIDI, Chrome / Edge) : actions `MACT`, modèles `MTPL` (Hercules DJ Control Steel d'après la table MIDI de son mode d'emploi, dans `references/manuels/`), reprise douce des potards, voyants, apprentissage. Plan dessiné du Steel dans `midi_plan.js`. Voyants du Steel vérifiés un par un (résultats dans `references/`) : codes « Mode » = SHIFT, « Folders » / « Files » = flèches ◀ ▶. Le navigateur intégré de l'app Claude refuse Web MIDI : tester dans Chrome ou Edge.

## À faire plus tard
- LINK entre platines (la clé dans une seule platine, les autres la parcourent par LINK), puis site hors ligne : reportés après la V2.7 (version à fixer avec Victor).
- Contrôleurs : modèles Pioneer DDJ-FLX4 / DDJ-400 si leurs listes MIDI officielles existent ; BEAT FX sur le Steel (Apply Ctrl en « Select ») en V2.9.
- V2.9 : BEAT FX (avec les queues après le fader, mode d'emploi p. 16-17). Caler les SOUND COLOR FX sur l'enregistrement de la vraie table quand Victor l'aura fait.
- Fréquences de l'EQ de la table : le mode d'emploi donne HI 30 kHz, MID 1 kHz, LOW 20 Hz, inutilisables tels quels ; garder 300 Hz / 4 kHz tant qu'on n'a pas mieux.
- BEAT FX de la table (14 effets, X-PAD, écran OLED, TAP, QUANTIZE) — affichés mais pas encore simulés.
- Tester la sortie casque sur un vrai 2e appareil son.
- Relancer l'émulateur du firmware CDJ (cdj-nxs2-qemu) sur le PC de Victor pour observer les écrans.
