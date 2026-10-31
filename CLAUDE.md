# Booth Check — règles du projet

Réplique dans le navigateur de matériel DJ de club (CDJ-2000NXS2 et table DJM-900NXS2), qui lit les clés USB exportées avec rekordbox.
Projet personnel et gratuit de Victor, pour lui et quelques amis. Site : https://eavroi.github.io/booth-check/ (GitHub Pages, branche principale, racine du dépôt).

## Façon de travailler
- Répondre en français, de façon concise. Victor dicte souvent à la voix : lire le contexte attentivement.
- Avant chaque version : faire un « point » (liste de ce qui va changer, questions s'il y en a) et attendre son « GO ».
- À la livraison, toujours dire le numéro de version (V3.1 est la dernière livrée ; la suivante est la V3.2).
- Ne jamais inventer de fonction ni d'élément d'interface : tout vient de la vraie machine (mode d'emploi, photos, vidéos, captures). En cas de doute, le dire.
- Vérifier chaque version : `python build.py`, `python tests/scenarios.py` (comportements du mode d'emploi), `python tests/smoke.py` (captures), comparer avec les photos de la vraie machine.
- Références hors dépôt, dans `BOOTH CHECK/references/` : modes d'emploi FR de la CDJ-2000NXS2 et de la DJM-900NXS2 (PDF + texte extrait), photos de Victor, captures de l'émulateur (`emulateur/`, `emulateur/info/`), relevés (`audit/v3-emulateur.md`).
- L'émulateur du firmware (cdj-nxs2-qemu) est la référence pour tout ce qui s'affiche sur l'écran de la CDJ : Victor le lance, Claude le pilote avec `references/emulateur/outils/cdj.py` (lire le pixel plutôt que deviner une couleur). Observation seulement, rien du firmware n'est copié.

## Contraintes
- Aucun logo Pioneer DJ, rekordbox, DVD ou CD sur les faces. Le nom du modèle est remplacé par « BOOTH CHECK » (« MULTI PLAYER BOOTH CHECK », « PROFESSIONAL MIXER BOOTH CHECK »).
- Garder la mention « Projet personnel, non affilié » et les crédits : la face de la CDJ dérive du « Pioneer CDJ & XDJ Emulator » (GPL-2.0-or-later), donc le projet reste sous GPL et ses sources restent publiques.
- Pas de rétro-ingénierie ni de copie du firmware (code, images, polices) : on observe la vraie machine et on redessine.
- Design du site sobre : pas de page d'accueil marketing, la machine est le seul « wow », marque « BC », vocabulaire technique, FR / EN.

## Structure
- `app/` : modules de l'application, assemblés dans l'ordre de `build.py` (core, face_layout, cap_img, face_art, djm_art, lcd_kit, library, mixer, beatfx, deck, browse, lcd, controls, face_view, mixer_view, midi, midi_plan, report, ui, main).
- `lib/` : lecture d'export.pdb et des fichiers ANLZ. `data/demo.json` : l'exemple intégré. `data/squared.mp3` : le son de Squared (Comité d'accueil, musique de Victor), chargé à la demande ; ajouté à la démo par `demoExtra` dans library.js (pas dans export.pdb), son analyse rekordbox est dans demo.json. À copier à côté d'index.html dans chaque livraison.
- `index.html` (racine) est GÉNÉRÉ par `build.py` : ne pas l'éditer à la main.
- `tests/scenarios.py` : scénarios de comportement ; `tests/smoke.py` : test rapide avec captures (Playwright) ; `tests/out/` ne doit pas être commité. `.github/workflows/test.yml` les relance sur GitHub à chaque envoi et vérifie qu'`index.html` est à jour.
- `og.png`, `icon.png`, `icon-192.png`, `icon-512.png`, `manifest.webmanifest` : partage et application installée.

## Points clés du fonctionnement
- Barre du haut sur une seule ligne, aucun texte sur deux lignes : quand la place manque, on masque (nom de la clé, puis « Booth Check » et le résumé). Onglet « Matériel » (résumé « 2 CDJ · DJM ») : il ouvre un panneau avec le booth de gauche à droite (tranche 1, 2, table, 3, 4) ; l'emplacement choisi montre modèle, couleur, retirer. Bouton clavier pour les raccourcis. La platine de la tranche n est PLAYER n (`BOOTH`, `setBooth` dans main.js, enregistré dans `bc.booth`). Première visite : une seule CDJ sur la tranche 2, sans table. Téléphone : 2 platines au plus.
- Machines « bientôt » (CDJ-3000, CDJ-3000X, DJM-A9, DJM-V10) et couleur blanche (-W, série limitée 2017) : annoncées dans le menu, pas encore dessinées (`GEAR`, `COLORS` dans main.js).
- Table masquée : les platines sortent en direct.
- Raccourcis clavier par position physique (KeyboardEvent.code), aucun Shift ; AZERTY BE par défaut.
- Moteur de lecture : un AudioWorklet par platine (`DECK_SRC` dans deck.js) qui reçoit les échantillons une fois ; la page lui envoie vitesse, boucle, MASTER TEMPO, et la position seulement aux sauts (numérotés) ; il renvoie sa position et l'écran le suit. MASTER TEMPO = étirement WSOLA (grains de 43 ms). Sans AudioWorklet, l'ancien lecteur (AudioBufferSourceNode) reste en secours.
- Références en image : les schémas des modes d'emploi se voient avec pdf.js dans Edge (Playwright), pas d'outil PDF sur le PC ; à faire avant de dessiner un écran.
- TIME (table) : retard en ms pour DELAY, ECHO, PING PONG, SPIRAL ; « degré de réverbération » pour REVERB (p. 16-17). Ici TIME allonge aussi la REVERB, d'après le souvenir de Victor sur la vraie table, à vérifier.
- SOUND COLOR FX (mixer.js) : sens des potards d'après le mode d'emploi p. 16 ; valeurs chiffrées = réglages de départ, à caler sur l'enregistrement de la vraie table (kit : `tests/kit_djm.py` + fiche dans `BOOTH CHECK/V2.9/kit-test-DJM/`). SPACE et DUB ECHO pris après le fader et rendus avant le crossfader (queue quand on baisse le fader).
- BEAT FX (`beatfx.js`, mode d'emploi p. 12-18) : un seul AudioWorklet `bc-beat` (14 effets, découpe FX FREQUENCY) placé dans un « slot » de la table (`mkSlot` dans mixer.js) : après le fader d'une tranche (jamais au casque, constaté par Victor), côté A / B du crossfader, ou avant MASTER LEVEL. DELAY, ECHO, PING PONG, SPIRAL, REVERB : queue au fader baissé et après ON/OFF (Victor). État dans `MS` (fxType, fxCh, fxOn, depth, pad, touch, quantize, tap, freq) et `BF` (fraction, TIME, TAP, grille). Valeurs non données par le manuel marquées « à caler ». Vumètre et CLIP du master avant le limiteur.
- Écran CDJ (V3.1) : dessiné en 800 × 480, couleurs et positions relevées au pixel sur l'émulateur. `T`, `TC`, `TS` (lcd_kit.js) grandissent et compressent la police LF (`LFS`, `LFX`) pour approcher les lettres du firmware. `BGCOL` : couleurs de clé (`M.bg`, valeur de la table 19) ; `bgc(d)` donne barre de titre et ascenseur ; TAG LIST et UTILITY restent gris.
- Clé (V3.1) : nom, couleur et date dans la table 19 d'`export.pdb`, ligne vivante d'après les drapeaux de présence de la page (`readMenus`). `djprofile.nxs` n'est pas le nom de la clé.
- Browser (V3.1) : `u.info` = vue panneau d'une liste de morceaux, gardée partout ; `levelItems` garde les listes (`M.lv`) tant que leur signature ne change pas, passer par `M.ver++` si une donnée change ; niveaux `keyNear` et `bpmNear` entre la catégorie et les morceaux ; `masterKeys` pour l'icône verte (même tonalité, relative, voisines). Boucle : `loop.man` = posée à la main, `loopPanel()` ouvre le panneau seul.
- Casque : clic sur la prise PHONES, sortie choisie avec setSinkId (Chrome / Edge).
- Contrôleurs MIDI (`midi.js`, Web MIDI, Chrome / Edge) : actions `MACT`, modèles `MTPL` (Hercules DJ Control Steel d'après la table MIDI de son mode d'emploi, dans `references/manuels/`), reprise douce des potards, voyants, apprentissage. Plan dessiné du Steel dans `midi_plan.js`. BEAT FX sur le Steel (V2.9.1) : Apply Ctrl Select = Controls 1 effet (Stop : canal), Controls 2 LEVEL/DEPTH (Stop : TIME) ; Deck A/B = Controls 2 BEAT ◀ ▶ ; Stop (l'un ou l'autre) + pads = ON/OFF, TAP, BEAT ◀ ▶, X-PAD, AUTO/TAP. Plan à onglets (`planSvg`, `PLAN_LAYER`) ; SHIFT du Steel n'envoie rien, seuls les pads changent de code. Voyants du Steel vérifiés un par un (résultats dans `references/`) : codes « Mode » = SHIFT, « Folders » / « Files » = flèches ◀ ▶. Le navigateur intégré de l'app Claude refuse Web MIDI : tester dans Chrome ou Edge.

## Feuille de route (validée par Victor le 31 octobre 2026, susceptible de changer)
Détail et constats : `references/audit/AUDIT-V3-global.md`. V3.1 faite (solidité et écran au plus près du firmware).
1. V3.2 : contrôleurs DDJ-400 et DDJ-FLX4, décidé par Victor. Depuis leurs listes MIDI officielles (à relire avant de coder : faders sur 14 bits, toucher du jog, voyants), marqués « non testé sur le vrai contrôleur ».
2. V3.3 : contrôle « avant le set » : rapport OK / à corriger en une page, platine cible (2000NXS2, 3000, 3000X), Device Library ou OneLibrary détecté sans le déchiffrer, morceaux sans analyse, sans grille, sans hot cue au début, fichiers manquants, formats, rapport à garder ou envoyer. Reprend l'ex-V2.11 (comparaison de deux clés, export de l'HISTORY).
3. V3.4 : hors ligne, site installable.
4. V3.5 : fidélité : écarts de `references/audit/v3-fidelite-visuelle.md` avec des photos de Victor, calage des SOUND COLOR FX et des BEAT FX sur un enregistrement de la vraie table (kit `tests/kit_djm.py` + fiche dans `BOOTH CHECK/V2.9/kit-test-DJM/`, un seul passage sur la vraie DJM pour les deux).
5. V3.6 : apprendre : « Ma première fois sur CDJ », 8 à 10 missions courtes, pannes simulées.
6. V3.7 : progresser : calage avec score sur ses propres morceaux, enregistrement du mix en WAV.
7. Ensuite : écarts de la table (T5 UTILITY, T6 BALANCE au casque, T7 courbes, T9 état éteint) et les « petites choses » de Victor, LINK entre platines, fente SD.
8. Puis nouvelles machines (CDJ-3000, CDJ-3000X, DJM-A9, DJM-V10), machine de départ à choisir avec Victor, versions blanches (-W) au cas par cas. Aucune référence (mode d'emploi FR, photos) n'existe encore pour elles : ne rien dessiner sans. Il faudra d'abord le choix du modèle par emplacement (`BOOTH` ne garde que les tranches).
- Rien n'est abandonné. Hercules Inpulse 300 et 500 : pas de liste MIDI officielle trouvée, retirés tant qu'il n'y en a pas.
- Pistes non classées : MIC 1 / MIC 2 avec le vrai micro (TALK OVER), BOOTH MONITOR en 2e sortie son, modèles DDJ-FLX4 / DDJ-400 (si listes MIDI officielles), assistant d'apprentissage pas à pas pour les autres contrôleurs, deux contrôleurs en même temps, tests automatiques sur GitHub, téléphone et Safari. Hors machine, à décider par Victor : enregistrer son mix, mode guidé pour apprendre la CDJ. SEND / RETURN : déconseillé.

## À faire plus tard
- Sur l'émulateur (V3.1) : couleurs de la vue d'ensemble (deux couches sur le firmware, section PWV4 des ANLZ à lire) ; [PLAYSTATE] du MENU d'une playlist, sans doute l'entrée pour marquer un morceau lu ; LIST DELETE sur la liste des playlists ; vue de la liste au démarrage ; INFO sans morceau chargé ; lignes LABEL et MY TAG de l'écran INFO sur un morceau qui en a ; règle exacte du commentaire de repère dans le titre (déduite, pas prouvée).
- Essayer la V3.0 : longueur des queues de tous les effets à l'oreille, TIME sur la REVERB, ON/OFF et plan sur le vrai Steel.
- Vérifier sur la vraie CDJ (V3.0) : TAG LIST avec une seule clé (ici directement la liste, le manuel passe par le choix du support), taille du cachemètre rouge, anneau de mémoire audio de la jog, place de WAVEFORM COLOR dans MENU, entrée du MENU pour marquer un morceau lu dans PLAYLIST.
- HOT CUE BANK : il faut une clé exportée avec une banque de hot cues pour trouver où elle est rangée. Boucles actives : lues d'après le format public des ANLZ (statut 4), à essayer avec une vraie boucle active.
- Vérifier sur la vraie CDJ (V2.8.3) : graduations de la barre de position (1 minute ou 16 mesures, et quand), si les chiffres du temps clignotent aussi en fin de morceau, touche USB quand la clé est branchée sans exploration ni morceau chargé (éteinte ici), écran ouvert en touchant le PHASE METER, rythme de l'anneau avec JOG INDICATOR.
- Couleur de fond du nom du morceau et de l'indicateur USB (BACKGROUND COLOR, p. 37) : il faut une clé exportée avec une couleur choisie dans rekordbox pour trouver où elle est rangée.
- Essayer les BEAT FX sur le vrai Steel (V2.9.1, Chrome ou Edge).
- Vérifier sur la vraie CDJ (V2.8.2) : emplacement et dessin des messages MEMORY / DELETE, reprise après un slip en pause (immédiate ici, sans RELEASE/START).
- Essai de la V2.8.1 sur le vrai Steel (Stop + CUE casque, Stop + CUE = SLIP REVERSE, plan).
- Fréquences de l'EQ de la table : le mode d'emploi donne HI 30 kHz, MID 1 kHz, LOW 20 Hz, inutilisables tels quels ; garder 300 Hz / 4 kHz tant qu'on n'a pas mieux.
- Tester la sortie casque sur un vrai 2e appareil son.
