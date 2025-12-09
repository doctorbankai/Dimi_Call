# Guide UI Dimi_Call — Synthèse Practical UI

Ce guide condense les règles actionnables issues de `output.txt` pour obtenir une interface intuitive, accessible et cohérente. À utiliser comme référence rapide lors des revues et développements.

## Checklists express
- Accessibilité : texte ≥ 4.5:1 (3:1 pour grands textes/éléments), états visibles (hover, focus, press, disabled).
- Cibles tactiles : ≥ 48 pt, espacées d’au moins 8 pt.
- Grille & spacing : grille 12 colonnes, incréments de 8 pt (XS 8, S 16, M 24, L 32, XL 48, XXL 80).
- Typo : une seule sans-serif, poids Regular/Bold, échelle type 1.2 (14/16/20/24/32/40), interligne ≥ 1.5 pour les longs textes.
- Couleur : 1 couleur de marque appliquée aux éléments interactifs; palette à 5 variations (brand, text-strong, text-weak, stroke-strong, stroke-weak, fill).
- Boutons : hiérarchie primaire/secondaire/tertiaire, texte verbe+noun, pas de doubles primaires, éviter les boutons désactivés.
- Formulaires : colonne unique, labels au-dessus, champs requis marqués, longueurs adaptées au contenu, préférer radios/steppers/autocomplete aux dropdowns longs.

## Principes fondamentaux
- Minimiser le coût d’interaction (regrouper actions liées, réduire choix, proximité, cibles grandes).
- Minimiser la charge cognitive (groupes clairs, hiérarchie visuelle, motifs connus, pas de surcharge décorative).
- Concevoir un design system : tokens (couleurs, typo, spacing, rayons 8/16/32, ombres raised/overlay), composants réutilisables, règles d’usage.
- Accessibilité par défaut (WCAG 2.1 AA ; ne pas se reposer uniquement sur la couleur).
- Raison logique pour chaque détail; appliquer la règle 80/20 pour prioriser ce qui sert le plus d’utilisateurs.
- Moins c’est mieux : retirer infos/styles inutiles, éviter glass/neumorphism, mais ne pas confondre minimalisme et simplicité (ne pas cacher l’essentiel).
- Progressive disclosure : révéler l’optionnel au besoin (ex. opt-in pour tél. SMS).

## Couleur
- Palette compacte (HSB recommandé) :  
  - brand (actions), text-strong (primaire), text-weak (secondaire), stroke-strong (bords critiques), stroke-weak (décoratif), fill (fonds secondaires), background (fond principal).  
  - Contraste : texte ≥ 4.5:1, éléments UI ≥ 3:1 ; vérifier aussi APCA pour dark mode.
- Appliquer la couleur de marque aux éléments interactifs uniquement (liens, boutons). Retirer des éléments non interactifs.
- Ne pas utiliser le rouge/amber/vert pour autre chose que statut (erreur/alerte/succès).
- Définir couleurs système (erreur/alerte/succès) + icône pour accessibilité couleur-blind.
- Éviter le noir pur (#000) et les gris trop clairs pour le texte; préférer gris foncé accessible.
- États : jouer sur opacité, fill issu de la palette, élévation, underline pour liens/texte interactif.
- Utiliser transparence pour conserver la hiérarchie sur fonds multiples (utile en dark mode).
- Dark mode : niveaux Base/Raised/Overlay plus clairs pour signifier l’élévation; vérifier contraste APCA.
- Nommer les couleurs (primitives + tokens sémantiques) pour usage cohérent dans le DS.

## Layout & Espacement
- Grille 12 colonnes, marges/gutters plus larges sur desktop, réduites sur mobile.
- Spacing en incréments de 8 pt ; augmenter l’espacement quand les éléments sont moins liés.
- Éviter la multiplication des containers : privilégier proximité, similarité, continuité.
- Hiérarchie visuelle par taille, couleur, contraste, espacement, position, profondeur.
- Tester avec le “Squint test” (squint/blur/zoom out) pour valider la hiérarchie.
- Cibles et actions près du contenu concerné (Fitts’s Law), surtout sur mobile (placer CTA bas et pleine largeur).
- Rendre l’interface “incassable” : gérer textes longs, nombres, edge cases sans overflow.
- Concevoir mobile first (écran le plus petit), contenu important visible/découvrable (ne pas tout cacher dans des menus).
- Réduire les choix : supprimer l’inutile, regrouper/catégoriser, découper en étapes, recommander les options courantes.
- Alignements : limiter le nombre d’alignements, baseline pour texte, généreux white-space.

## Typographie
- Une seule police sans-serif, neutre et lisible (x-height élevée). Poids : Regular et Bold uniquement.
- Échelle type (ratio ~1.2) suggérée : 14/16/20/24/32/40 px ; arrondir les décimales.
- Interligne : ≥ 1.5 pour le corps (réduire pour les titres plus grands).
- Longueur de ligne : 40–80 caractères.
- Alignement : gauche pour les textes longs; éviter justifié; limiter centre aux courts blocs.
- Réduire légèrement le letter-spacing pour très grands titres si nécessaire.
- Texte sur image : ajouter overlay (gradient/opaque), ombre portée, et vérifier le contraste.

## Rédaction (microcopy)
- Phrase case (phrase simple), proscrire le titre case et l’UPPERCASE (sauf courts labels).
- Être concis, langage simple, sans jargon/slang; phrases ≤ 20 mots.
- Front-load (info clé au début), pyramide inversée pour blocs.
- Liens descriptifs (éviter “cliquez ici” / “en savoir plus” génériques).
- Vocabulaire cohérent (même terme pour la même action/objet).
- Éviter “mon/ma/your” dans les labels de formulaire; préférer labels courts.
- Messages d’erreur : dire quoi, pourquoi, comment corriger; ton neutre; bouton descriptif.
- Nombres : utiliser des chiffres (1 000), éviter acronymes/abbr. non expliqués, éviter les points finaux si non nécessaires.

## Boutons
- Trois poids :  
  - Primaire : fond couleur marque, texte blanc, rayon 8–16 pt, ombre légère.  
  - Secondaire : contour + texte couleur marque (fond transparent).  
  - Tertiaire : texte souligné couleur marque (style lien).  
  - Tous avec états hover/press/focus visibles.
- Un seul CTA primaire par écran. Les actions de même importance partagent le même poids.
- Taille cible ≥ 48 pt, espacement ≥ 8 pt entre boutons.
- Texte = verbe + nom (“Enregistrer l’article”, “Envoyer le code”), pas de termes vagues.
- Actions destructives : réduire la proéminence (tertiaire), ajouter friction (confirmation, cases à cocher, undo quand possible).
- Éviter les boutons désactivés ; sinon expliquer pourquoi et comment l’activer.
- Ordre : aligner à gauche du plus important au moins important; sur mobile, boutons pleine largeur empilés (CTA en bas accessible au pouce).

## Formulaires
- Mise en page en colonne unique; labels au-dessus, proches du champ.
- Marquer requis et optionnel (asterisk ou mot “(optionnel)/(requis)”).
- Préférer radios (≤ 10 options) ou steppers/autocomplete plutôt que dropdowns longs.
- Largeur des champs adaptée à l’entrée attendue (ex. code postal sur 4 char).
- Hints visibles au-dessus des champs; pas de placeholders comme labels.
- Validation : idéalement inline/on-blur ou à la saisie pour champs sensibles; afficher erreurs au-dessus du champ avec icône + couleur + texte clair.
- Cibles et espacements respectent la grille 8 pt; champs empilés; regrouper par sections avec titres.
- Validation : trois approches selon effort (submit, on-blur, à la frappe) — choisir en fonction du risque; lister les erreurs en haut avec ancres, ne pas désactiver Submit.
- Champs courts côte à côte si nécessaire mais rester dans la logique colonne; stacker radios/checkboxes verticalement.
- Fractionner les longs formulaires (multi-étapes + indicateur de progression), ordonner questions du plus simple au plus difficile.

## États et iconographie
- Icônes avec label pour éviter l’ambiguïté; styles cohérents (outline ou filled, pas mixés).
- Montrer les états (default, hover, active, focus, disabled) sur tous les interactifs.
- Étendre la zone cliquable des petits éléments et la rendre visible.
- Conserver les formes emblématiques (ex. cercles des radios) pour respecter les modèles mentaux.

## Images et médias
- Ajuster la température de couleur des photos pour correspondre à la palette (warm/cool).
- Utiliser la règle des tiers pour les focales; vérifier lisibilité du texte superposé.

## Tests rapides avant livraison
- Contraste (WCAG AA) sur texte, icônes critiques, bordures de champs.
- Squint test pour hiérarchie; tout élément interactif est identifiable et a un état focus.
- CTA unique par écran; actions destructives protégées.
- Formulaire : labels + hints visibles, erreurs compréhensibles, champs adaptés en largeur, navigation clavier OK.
- Responsive : grille 12 → 4 colonnes, marges/gutters adaptées, CTA atteignable au pouce.
- Navigation : vérif clavier/focus, zones cliquables étendues, contenus importants visibles/découvrables.


