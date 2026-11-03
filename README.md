# Fromages AOP

Application pédagogique pour les élèves de bac pro hôtellerie-restauration du lycée Ambroise Croizat (Moûtiers), tirée du cours « Les fromages français » de M. Hermand.

- **La fabrication** : les chiffres clés, les 3 laits, les 5 étapes de l'élaboration, les 6 familles de pâtes, la définition d'AOP
- **Les AOP des régions** : carte des 13 régions dans l'ordre du cours, et les fiches des 47 fromages AOP
- **Les fromages étrangers** : 8 grands fromages d'Europe, classés par pays
- **L'espace quiz** : 6 quiz dont un contrôle blanc sur 20, questions renouvelées à chaque partie, et 12 trophées

Site statique, sans installation : il suffit d'ouvrir `index.html`. Hébergé sur GitHub Pages ; installable sur l'écran d'accueil du téléphone et consultable hors connexion.

## Organisation

- `index.html` : les pages et la mise en forme
- `app.js` : le fonctionnement (navigation, fiches, quiz, trophées, animation de l'accueil)
- `data/aop.js` : les fiches des fromages AOP et la carte des régions
- `data/etrangers.js` : les fiches des fromages étrangers
- `img/` : photos, aquarelles et icônes
- `sw.js` : le fonctionnement hors connexion

Pour publier une mise à jour, augmenter `VERSION` dans `sw.js` et le numéro `?v=` des trois scripts dans `index.html`.

## Crédits

Les photos des fromages viennent de Wikimedia Commons, sous licences libres ; leurs auteurs sont cités dans la page « Crédits photos » de l'appli. Les aquarelles ont été créées pour l'appli avec Google Flow.
