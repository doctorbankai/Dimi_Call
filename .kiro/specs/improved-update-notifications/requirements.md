# Requirements Document

## Introduction

Cette fonctionnalité améliore le système de notifications de mise à jour dans l'application Electron DimiCall. Actuellement, quand une mise à jour est téléchargée, l'utilisateur doit cliquer sur le badge bleu "MAJ" dans la titlebar pour lancer manuellement la mise à jour. L'objectif est d'améliorer l'expérience utilisateur en changeant le texte du badge et en ajoutant une confirmation avant l'installation.

## Requirements

### Requirement 1

**User Story:** En tant qu'utilisateur, je veux voir clairement quand une mise à jour est prête à être installée, afin de savoir que je peux procéder à la mise à jour.

#### Acceptance Criteria

1. WHEN une mise à jour a terminé de se télécharger THEN le badge bleu SHALL afficher le texte "Mettre à jour" au lieu de "MAJ"
2. WHEN l'utilisateur survole le badge "Mettre à jour" THEN le tooltip SHALL indiquer "Cliquer pour installer la mise à jour"
3. WHEN le badge affiche "Mettre à jour" THEN il SHALL conserver son style bleu avec animation pulse pour attirer l'attention

### Requirement 2

**User Story:** En tant qu'utilisateur, je veux être averti avant qu'une mise à jour soit installée, afin de pouvoir sauvegarder mon travail si nécessaire.

#### Acceptance Criteria

1. WHEN l'utilisateur clique sur le badge "Mettre à jour" THEN un popup de confirmation SHALL s'afficher
2. WHEN le popup de confirmation s'affiche THEN il SHALL contenir le message "Êtes-vous sûr de vouloir installer la mise à jour ? Il est recommandé de sauvegarder votre travail avant de continuer."
3. WHEN le popup s'affiche THEN il SHALL proposer deux boutons : "Oui, mettre à jour" et "Annuler"
4. WHEN l'utilisateur clique sur "Annuler" THEN le popup SHALL se fermer sans action
5. WHEN l'utilisateur clique sur "Oui, mettre à jour" THEN la mise à jour SHALL se lancer comme actuellement

### Requirement 3

**User Story:** En tant qu'utilisateur, je veux que le popup de confirmation soit cohérent avec le design de l'application, afin d'avoir une expérience utilisateur uniforme.

#### Acceptance Criteria

1. WHEN le popup de confirmation s'affiche THEN il SHALL utiliser les composants UI shadcn/ui existants
2. WHEN le popup s'affiche THEN il SHALL respecter le thème actuel (sombre/clair) de l'application
3. WHEN le popup s'affiche THEN il SHALL être centré sur l'écran et modal
4. WHEN le popup s'affiche THEN il SHALL avoir un overlay sombre en arrière-plan
5. WHEN l'utilisateur appuie sur Échap THEN le popup SHALL se fermer sans action

### Requirement 4

**User Story:** En tant qu'utilisateur, je veux que les autres états de mise à jour restent inchangés, afin de conserver la fonctionnalité existante.

#### Acceptance Criteria

1. WHEN une mise à jour est en cours de vérification THEN le badge SHALL continuer d'afficher "MAJ..." avec l'icône de chargement
2. WHEN une mise à jour est en cours de téléchargement THEN le badge SHALL continuer d'afficher le pourcentage de progression
3. WHEN aucune mise à jour n'est disponible THEN le badge SHALL ne pas s'afficher
4. WHEN une erreur survient THEN le comportement actuel SHALL être préservé