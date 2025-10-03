# Requirements Document

## Introduction

Ce document décrit les exigences pour corriger un bug critique dans le système d'importation de contacts. Actuellement, lorsque l'utilisateur détecte des numéros de téléphone déjà présents dans Supabase (tables partagées ou liste noire) et clique sur "Supprimer les lignes détectées", les lignes sont bien marquées comme exclues dans l'interface, mais elles sont quand même importées dans la table finale. Le problème vient du fait que les numéros à exclure ne sont pas correctement transmis de `ImportMappingDialog` à la fonction `importContactsFromFile`.

## Requirements

### Requirement 1: Transmission correcte des numéros à exclure

**User Story:** En tant qu'utilisateur, je veux que lorsque je clique sur "Supprimer les lignes détectées" dans le dialogue d'import, les numéros détectés soient effectivement exclus de l'import final, afin d'éviter les doublons dans ma base de données.

#### Acceptance Criteria

1. WHEN l'utilisateur clique sur "Supprimer les lignes détectées" THEN le système SHALL stocker les numéros normalisés à exclure dans l'état local du dialogue
2. WHEN l'utilisateur clique sur "Importer" après avoir supprimé des lignes détectées THEN le système SHALL transmettre la liste des numéros normalisés à exclure via le paramètre `options.phonesToRemove` à la fonction `importContactsFromFile`
3. WHEN la fonction `importContactsFromFile` reçoit des numéros à exclure THEN le système SHALL filtrer toutes les lignes dont le numéro de téléphone normalisé correspond à un numéro de la liste d'exclusion
4. WHEN l'import est terminé THEN le système SHALL afficher uniquement les contacts dont les numéros n'étaient pas dans la liste d'exclusion

### Requirement 2: Cohérence entre l'UI et l'import final

**User Story:** En tant qu'utilisateur, je veux que le nombre de lignes affichées après avoir cliqué sur "Supprimer les lignes détectées" corresponde exactement au nombre de contacts importés, afin d'avoir une expérience prévisible et cohérente.

#### Acceptance Criteria

1. WHEN l'utilisateur applique le filtre "remove" THEN le système SHALL mettre à jour l'aperçu pour afficher uniquement les lignes qui seront importées
2. WHEN l'utilisateur valide l'import THEN le système SHALL importer exactement le même nombre de contacts que celui affiché dans l'aperçu filtré
3. WHEN le mode de filtrage est "remove" THEN le système SHALL passer `filterMode === 'remove'` comme condition pour inclure les numéros dans `options.phonesToRemove`
4. WHEN le mode de filtrage est "isolate" ou "none" THEN le système SHALL passer un objet `options` vide (sans `phonesToRemove`)

### Requirement 3: Logging et traçabilité

**User Story:** En tant que développeur, je veux avoir des logs clairs sur les numéros exclus à chaque étape du processus, afin de pouvoir déboguer facilement les problèmes d'exclusion.

#### Acceptance Criteria

1. WHEN l'utilisateur clique sur "Supprimer les lignes détectées" THEN le système SHALL logger les numéros normalisés qui seront exclus
2. WHEN l'utilisateur clique sur "Importer" THEN le système SHALL logger les options passées à `importContactsFromFile`, incluant le tableau `phonesToRemove`
3. WHEN `importContactsFromFile` traite les lignes THEN le système SHALL logger chaque ligne supprimée avec son numéro original et normalisé
4. WHEN l'import est terminé THEN le système SHALL logger le nombre total de contacts importés après exclusion
