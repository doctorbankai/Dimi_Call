# Requirements Document - Correction des boutons non fonctionnels dans Appels 2 (mode Table)

## Introduction

La page "Appels 2" dispose d'un ViewSwitcher permettant de basculer entre une vue en cartes et une vue en table. Actuellement, lorsque l'utilisateur bascule en mode table, tous les boutons d'action (Appeler, SMS, Email, Qualification, Rappel, RDV, Cal.com) ainsi que les boutons de la navbar (Import, Export, Supprimer, sélecteur d'onglet) sont désactivés et non fonctionnels.

L'objectif est de rendre ces boutons fonctionnels en mode table en les connectant aux mêmes handlers que ceux utilisés dans la page "Appels" originale, garantissant ainsi une parité fonctionnelle complète entre les deux pages.

## Requirements

### Requirement 1: Activation des boutons d'action par ligne

**User Story:** En tant qu'utilisateur, je veux pouvoir utiliser les boutons d'action (Appeler, SMS, Email, Qualification, Rappel, RDV, Cal.com) sur chaque ligne de la table dans la page "Appels 2", afin d'interagir avec mes contacts de la même manière que dans la page "Appels" originale.

#### Acceptance Criteria

1. WHEN l'utilisateur est en mode table dans "Appels 2" THEN les boutons d'action SHALL être activés (non disabled)
2. WHEN l'utilisateur clique sur le bouton "Appeler" THEN le système SHALL déclencher l'action d'appel pour le contact de cette ligne
3. WHEN l'utilisateur clique sur le bouton "SMS" THEN le système SHALL ouvrir le menu déroulant avec les options SMS (Monsieur/Madame)
4. WHEN l'utilisateur clique sur le bouton "Email" THEN le système SHALL déclencher l'action d'envoi d'email pour le contact
5. WHEN l'utilisateur clique sur le bouton "Qualification" THEN le système SHALL ouvrir le dialogue de qualification pour le contact
6. WHEN l'utilisateur clique sur le bouton "Rappel" THEN le système SHALL ouvrir le dialogue de programmation de rappel pour le contact
7. WHEN l'utilisateur clique sur le bouton "Rendez-vous" THEN le système SHALL ouvrir le dialogue de programmation de rendez-vous pour le contact
8. WHEN l'utilisateur clique sur le bouton "Cal.com" THEN le système SHALL ouvrir l'interface Cal.com pour le contact
9. WHEN aucun contact n'est sélectionné THEN les boutons SHALL afficher un tooltip approprié indiquant qu'un contact doit être sélectionné

### Requirement 2: Activation des boutons de la navbar

**User Story:** En tant qu'utilisateur, je veux pouvoir utiliser les boutons de la navbar (Import, Export, Supprimer) en mode table dans "Appels 2", afin de gérer mes données de la même manière que dans la page "Appels" originale.

#### Acceptance Criteria

1. WHEN l'utilisateur est en mode table dans "Appels 2" THEN le bouton "Importer" SHALL être activé et fonctionnel
2. WHEN l'utilisateur clique sur "Importer" THEN le système SHALL ouvrir le dialogue de sélection de fichier et de mapping
3. WHEN l'utilisateur est en mode table dans "Appels 2" THEN le bouton "Exporter" SHALL être activé et fonctionnel
4. WHEN l'utilisateur clique sur "Exporter" THEN le système SHALL ouvrir le menu déroulant avec les options d'export
5. WHEN l'utilisateur est en mode table dans "Appels 2" THEN le bouton "Supprimer" SHALL être activé et fonctionnel
6. WHEN l'utilisateur clique sur "Supprimer" THEN le système SHALL ouvrir le dialogue de confirmation de suppression
7. WHEN l'utilisateur confirme la suppression THEN le système SHALL supprimer tous les contacts de l'onglet actif

### Requirement 3: Activation du sélecteur d'onglet

**User Story:** En tant qu'utilisateur, je veux pouvoir utiliser le sélecteur d'onglet (dropdown "Contacts") en mode table dans "Appels 2", afin de filtrer mes contacts par onglet de la même manière que dans la page "Appels" originale.

#### Acceptance Criteria

1. WHEN l'utilisateur est en mode table dans "Appels 2" THEN le sélecteur d'onglet SHALL être activé et fonctionnel
2. WHEN l'utilisateur clique sur le sélecteur d'onglet THEN le système SHALL afficher la liste des onglets disponibles
3. WHEN l'utilisateur sélectionne un onglet THEN le système SHALL filtrer les contacts affichés selon l'onglet sélectionné
4. WHEN l'utilisateur change d'onglet THEN le système SHALL mettre à jour l'affichage avec le nom et la couleur de l'onglet sélectionné

### Requirement 4: Cohérence avec la page "Appels" originale

**User Story:** En tant qu'utilisateur, je veux que tous les boutons de la page "Appels 2" en mode table se comportent exactement comme ceux de la page "Appels" originale, afin d'avoir une expérience utilisateur cohérente à travers l'application.

#### Acceptance Criteria

1. WHEN l'utilisateur utilise un bouton en mode table dans "Appels 2" THEN le comportement SHALL être identique à celui du même bouton dans la page "Appels"
2. WHEN une action est déclenchée THEN les mêmes dialogues, menus et confirmations SHALL s'afficher
3. WHEN une action est complétée THEN les mêmes notifications et feedbacks SHALL être affichés
4. WHEN une erreur survient THEN les mêmes messages d'erreur SHALL être affichés
5. WHEN l'utilisateur bascule entre les modes cards et table THEN tous les boutons SHALL rester fonctionnels dans les deux modes
