# Requirements Document

## Introduction

Cette fonctionnalité vise à étendre l'export Google Contacts existant pour inclure les contacts ayant le nouveau statut "A0". Actuellement, seuls les contacts avec les statuts "À rappeler", "DO", et "RO" sont exportés vers Google Contacts. L'utilisateur souhaite que les contacts avec le statut "A0" soient également inclus dans cet export.

## Requirements

### Requirement 1

**User Story:** En tant qu'utilisateur de l'application, je veux que les contacts avec le statut "A0" soient inclus dans l'export Google Contacts, afin de pouvoir exporter tous mes contacts pertinents vers Google Contacts.

#### Acceptance Criteria

1. WHEN l'utilisateur clique sur le bouton "Contacts" (export Google Contacts) THEN le système SHALL inclure les contacts avec le statut "A0" dans le filtrage
2. WHEN le système filtre les contacts pour l'export Google Contacts THEN il SHALL inclure les statuts "À rappeler", "DO", "RO" ET "A0"
3. WHEN il y a des contacts avec le statut "A0" THEN le compteur du badge sur le bouton "Contacts" SHALL les inclure dans le décompte total
4. WHEN l'utilisateur survole le bouton "Contacts" THEN le tooltip SHALL mentionner que les contacts "A0" sont inclus dans l'export

### Requirement 2

**User Story:** En tant qu'utilisateur, je veux que le système me donne un feedback précis sur le nombre de contacts exportés, afin de savoir combien de contacts "A0" ont été inclus.

#### Acceptance Criteria

1. WHEN l'export Google Contacts est effectué avec succès THEN le système SHALL afficher une notification indiquant le nombre total de contacts exportés
2. WHEN aucun contact avec les statuts éligibles (y compris "A0") n'est trouvé THEN le système SHALL afficher un message d'avertissement approprié
3. WHEN l'export échoue THEN le système SHALL afficher un message d'erreur spécifique

### Requirement 3

**User Story:** En tant qu'utilisateur, je veux que la logique d'export soit cohérente avec l'interface utilisateur, afin d'avoir une expérience utilisateur fluide.

#### Acceptance Criteria

1. WHEN le bouton "Contacts" est affiché THEN il SHALL être activé seulement s'il y a au moins un contact avec les statuts éligibles (incluant "A0")
2. WHEN il n'y a aucun contact éligible THEN le bouton SHALL être désactivé et le tooltip SHALL expliquer pourquoi
3. WHEN l'utilisateur clique sur le bouton désactivé THEN aucune action ne SHALL être déclenchée