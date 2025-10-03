# Requirements Document

## Introduction

Le dialogue "Importer et mapper les colonnes" présente actuellement des problèmes de mise en page qui rendent l'interface difficile à utiliser. Les éléments sont compressés, le dialogue est trop étroit, et certains éléments sortent de l'affichage visible. Cette fonctionnalité vise à corriger ces problèmes de mise en page pour offrir une expérience utilisateur optimale lors de l'import et du mapping de colonnes.

## Requirements

### Requirement 1: Largeur du dialogue appropriée

**User Story:** En tant qu'utilisateur, je veux que le dialogue d'import soit suffisamment large pour afficher tous les éléments confortablement, afin de pouvoir mapper mes colonnes sans difficulté.

#### Acceptance Criteria

1. WHEN le dialogue d'import s'ouvre THEN il SHALL avoir une largeur maximale appropriée qui utilise l'espace disponible sans être trop étroit
2. WHEN le dialogue est affiché sur un écran large THEN il SHALL utiliser une largeur maximale de 90vw ou 1400px (selon ce qui est le plus petit)
3. WHEN le dialogue est affiché sur un écran moyen THEN il SHALL s'adapter à la largeur disponible avec des marges appropriées

### Requirement 2: En-tête de la grille de mapping optimisé

**User Story:** En tant qu'utilisateur, je veux que l'en-tête de la grille de mapping soit bien organisé et lisible, afin de comprendre rapidement l'état du mapping.

#### Acceptance Criteria

1. WHEN l'en-tête de la grille est affiché THEN il SHALL avoir suffisamment d'espace pour afficher tous les badges et boutons sans compression
2. WHEN plusieurs badges d'état sont affichés (mappées, conflits, non reconnues) THEN ils SHALL être disposés de manière à ne pas se chevaucher
3. WHEN les boutons d'action (Auto-détection, Résoudre conflits) sont affichés THEN ils SHALL être visibles et accessibles sans défilement horizontal

### Requirement 3: Colonnes de la grille bien proportionnées

**User Story:** En tant qu'utilisateur, je veux que les colonnes de la grille de mapping soient bien proportionnées, afin de voir clairement les noms de colonnes et les sélecteurs de champs.

#### Acceptance Criteria

1. WHEN la grille de mapping est affichée THEN la colonne "Colonne détectée" SHALL occuper environ 40% de la largeur
2. WHEN la grille de mapping est affichée THEN la colonne "Associer à" SHALL occuper environ 60% de la largeur
3. WHEN un nom de colonne est trop long THEN il SHALL être tronqué avec des points de suspension et afficher le nom complet au survol

### Requirement 4: Disposition responsive de l'en-tête

**User Story:** En tant qu'utilisateur, je veux que l'en-tête de la grille s'adapte à différentes largeurs d'écran, afin d'avoir une expérience cohérente sur tous les appareils.

#### Acceptance Criteria

1. WHEN l'écran est large THEN les badges et boutons SHALL être affichés sur une seule ligne
2. WHEN l'écran est moyen THEN les badges et boutons SHALL se répartir sur plusieurs lignes si nécessaire
3. WHEN l'écran est petit THEN les éléments SHALL s'empiler verticalement pour éviter le défilement horizontal

### Requirement 5: Espacement et padding appropriés

**User Story:** En tant qu'utilisateur, je veux que les éléments du dialogue aient un espacement approprié, afin que l'interface soit aérée et facile à lire.

#### Acceptance Criteria

1. WHEN le dialogue est affiché THEN il SHALL avoir un padding interne de 24px minimum
2. WHEN les lignes de la grille sont affichées THEN elles SHALL avoir un padding vertical de 12px minimum
3. WHEN les badges et boutons sont affichés THEN ils SHALL avoir un espacement horizontal de 8px minimum entre eux

### Requirement 6: Zone de défilement optimisée

**User Story:** En tant qu'utilisateur, je veux que la zone de défilement de la grille soit bien dimensionnée, afin de voir plusieurs lignes de mapping sans que le dialogue soit trop grand.

#### Acceptance Criteria

1. WHEN la grille de mapping contient plus de lignes que la hauteur visible THEN une barre de défilement verticale SHALL apparaître
2. WHEN la grille de mapping est affichée THEN la hauteur de la zone de défilement SHALL être d'au moins 400px
3. WHEN l'utilisateur fait défiler la grille THEN l'en-tête SHALL rester fixe et visible
