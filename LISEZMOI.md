# Booth Check — sources (V2.6)

- `app/` : les modules de l'application (HTML, CSS, JS), assemblés dans l'ordre donné par `build.py`.
- `lib/` : lecture d'export.pdb et des fichiers ANLZ de rekordbox.
- `data/demo.json` : l'exemple intégré. `data/squared.mp3` : « Squared » de Comité d'accueil, musique de Victor, autorisée ici par son auteur ; elle n'est pas sous la licence GPL du code.
- `design/` : dessin de la table pour les maquettes.
- `build.py` : `python build.py` produit `index.html` à la racine (servi par GitHub Pages) et `dist/booth-check.html`.
- `tests/scenarios.py` : scénarios de comportement d'après les modes d'emploi ; `tests/smoke.py` : test rapide avec captures dans `tests/out/` (demandent Python et Playwright).
- `CLAUDE.md` : les règles du projet, lues par Claude Code à chaque session.

Règles du projet : pas de logos Pioneer / rekordbox / DVD / CD, mention « non affilié » et crédit GPL gardés, rien d'inventé (tout copié de la vraie machine), français, un point avant chaque version puis GO.
